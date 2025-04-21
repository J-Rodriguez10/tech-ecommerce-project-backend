const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Product = require('../models/Product'); // Correct import for Product model
const router = express.Router();
const authenticateUser = require('../middleware/authenticateUser'); // Import the middleware
const mongoose = require('mongoose');  // Make sure mongoose is required at the top of your file

const { BACK_END_URL } = require('../util/config');


// Helper function to generate JWT tokens
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @desc    Register a new user
// @route   POST /api/users/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create a new user object
    const user = new User({
      firstName,
      lastName,
      email,
      password, // No need to hash the password here manually, pre("save") will handle it
    });

    // Log the cart before saving the user
    console.log('User cart before saving:', user.cart);

    // Save the user to the database (the password gets hashed here automatically)
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    // Log the user object after registration
    console.log('User registered successfully:', user);

    // Return the full user object (not just the userId)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user, // Include the full user object here
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});



// @desc    Login user
// @route   POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Find the user by email and correctly populate the paths
    const user = await User.findOne({ email })
      .populate("cart.productId")  // Populate the cart's productId field
      .populate("wishlist.productId");  // Populate the wishlist's productId field

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log the cart before comparing the password
    console.log('User cart before checking password:', user.cart);

    // Step 2: Use the comparePassword method to check if the entered password matches the stored hashed password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Log the user object after successful login
    console.log('User object after successful login:', user);

    // Step 3: Generate JWT token
    const token = generateToken(user._id);

    // Step 4: Send successful response with token and full user object
    res.status(200).json({
      message: 'Login successful',
      token,
      user, // Return the entire user object (including cart, wishlist, orders, etc.)
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @desc    Get user profile (authenticated route)
// @route   GET /api/users/profile
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password'); // Use userId from the JWT
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


// Helper function to modify a single product image URL
const modifyProductImageUrl = (imgUrl) => {
  if (!imgUrl) return ""; // Return an empty string if the image URL is falsy

  return `${BACK_END_URL}/api/products/proxy-image?url=${encodeURIComponent(
      imgUrl
  )}`;
};

// @desc    Add product to cart (authenticated route)
// @route   POST /api/users/cart
router.post('/cart', authenticateUser, async (req, res) => {
  try {
    const { productId, actionType, quantity } = req.body; // `actionType` and `productId` are required; `quantity` is optional

    const userId = req.user.id;  // Get userId from the JWT

    // Log the userId to confirm that the correct user is being processed
    console.log('User ID from JWT:', userId);

    // Validate actionType to ensure it's either UPDATE or INCREMENT
    if (!['UPDATE', 'INCREMENT'].includes(actionType)) {
      return res.status(400).json({ message: "Invalid actionType. Must be either 'UPDATE' or 'INCREMENT'" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the current user's cart before any changes
    console.log('Current user cart before adding product:', user.cart);

    // Find the product to ensure it exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the product is already in the cart
    const existingProductIndex = user.cart.findIndex(item => item.productId.toString() === productId);

    // Use a switch statement to handle the different actions
    switch (actionType) {
      case 'UPDATE':
        if (existingProductIndex !== -1) {
          // If the product is already in the cart, update its quantity
          if (!quantity || quantity <= 0) {
            return res.status(400).json({ message: "Invalid quantity for update. Must be a positive number." });
          }
          console.log('Updating quantity to:', quantity);
          user.cart[existingProductIndex].quantity = quantity;
        } else {
          // If the product is not in the cart, add it with the provided quantity
          console.log('Product not in cart, adding to cart:', productId);
          const newCartItem = {
            productId: productId,
            productImage: modifyProductImageUrl(product.productImages[0]),
            productName: product.name,
            quantity,
            price: product.price
          };
          user.cart.push(newCartItem);
        }
        break;

      case 'INCREMENT':
        if (existingProductIndex !== -1) {
          // If the product is in the cart, increment the quantity
          console.log('Incrementing quantity by 1');
          user.cart[existingProductIndex].quantity += 1;
        } else {
          // If the product is not in the cart, add it with quantity 1
          console.log('Product not in cart, adding to cart with quantity 1');
          const newCartItem = {
            productId: productId,
            productImage: modifyProductImageUrl(product.productImages[0]),
            productName: product.name,
            quantity: 1,
            price: product.price
          };
          user.cart.push(newCartItem);
        }
        break;

      default:
        return res.status(400).json({ message: "Invalid actionType. Must be either 'UPDATE' or 'INCREMENT'" });
    }

    // Log the updated cart before saving
    console.log('Updated user cart after adding product:', user.cart);

    // Save the updated user document
    await user.save();

    // Return the updated cart
    res.status(200).json({ message: "Product added to cart", cart: user.cart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});


// @desc    Remove product from cart (authenticated route)
// @route   DELETE /api/users/cart/:productId
router.delete('/cart/:productId', authenticateUser, async (req, res) => {
  const { productId } = req.params; // Extract productId from the URL parameter
  const userId = req.user.id; // Get userId from the JWT

  try {
    // Debug: Log the received productId and userId
    console.log(`Received request to remove productId: ${productId} from userId: ${userId}`);

    // Find the user
    const user = await User.findById(userId); // Find the user by userId
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: 'User not found' });
    }

    // Debug: Log the user's current cart before filtering
    console.log("User's current cart:", user.cart);

    // Filter out the product based on productId
    user.cart = user.cart.filter((item) => item.productId.toString() !== productId);

    // Debug: Log the updated cart after filtering
    console.log("Updated cart after removal:", user.cart);

    // Save the updated user document
    await user.save();

    // Return the updated cart
    res.status(200).json({ message: 'Product removed from cart', cart: user.cart });
  } catch (error) {
    // Debug: Log the error
    console.error("Error during product removal:", error);
    res.status(500).json({ message: 'Error removing product from cart', error: error.message });
  }
});


// @desc    Clear user's cart (authenticated route)
// @route   DELETE /api/users/cart
router.delete('/cart', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;  // Get userId from the JWT

    // Log the userId to confirm the correct user is being processed
    console.log('User ID from JWT:', userId);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clear the cart by setting it to an empty array
    user.cart = [];

    // Save the updated user document with an empty cart
    await user.save();

    // Return the updated cart (which is now empty)
    res.status(200).json({ message: "Cart cleared successfully", cart: user.cart });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Error clearing cart" });
  }
});



// @desc    Add product to wishlist (authenticated route)
// @route   POST /api/users/wishlist
router.post('/wishlist', authenticateUser, async (req, res) => {
  console.log("Wishlist endpoint reached"); // Log when the endpoint is reached

  const { productId } = req.body;
  const userId = req.user.id; // Get userId from the JWT

  console.log("Received data - productId:", productId, "userId:", userId); // Log received data

  try {
    console.log("Fetching user from database with userId:", userId);
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found with userId:", userId); // Log if user is not found
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the product is already in the wishlist
    console.log("Checking if product is already in the wishlist for user:", userId);
    const existingProduct = user.wishlist.find(item => item.productId.toString() === productId);
    
    if (existingProduct) {
      console.log("Product already in wishlist:", productId); // Log if the product is already in the wishlist
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Add product to wishlist
    console.log("Adding product to wishlist:", productId);
    user.wishlist.push({ productId });

    console.log("Saving updated user to the database. Updated wishlist:", user.wishlist);
    await user.save();

    // Return the updated wishlist
    console.log("Product successfully added to wishlist. Returning updated wishlist.");
    res.status(200).json({ message: 'Product added to wishlist', wishlist: user.wishlist });

  } catch (error) {
    console.error("Error adding to wishlist:", error); // Log the full error
    res.status(500).json({ message: 'Error adding product to wishlist', error: error.message });
  }
});



// @desc    Remove product from wishlist (authenticated route)
// @route   DELETE /api/users/wishlist/:productId
router.delete('/wishlist/:productId', authenticateUser, async (req, res) => {
  const { productId } = req.params;  // Extract productId from the URL parameter
  const userId = req.user.id;  // Get userId from the JWT

  try {
    const user = await User.findById(userId);  // Find the user by userId
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove the product from the wishlist
    user.wishlist = user.wishlist.filter(item => item.productId.toString() !== productId);

    await user.save();  // Save the user with the updated wishlist
    res.status(200).json({ message: 'Product removed from wishlist', wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ message: 'Error removing product from wishlist', error: error.message });
  }
});



// @desc    Add order to user's orders array (authenticated route)
// @route   POST /api/users/orders
router.post('/orders', authenticateUser, async (req, res) => {
  const userId = req.user.id; // Get userId from the JWT
  const { products } = req.body;  // Get the products array from the frontend

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate the total price on the backend
    let totalPrice = 0;
    const orderProducts = [];

    // Loop through the products array and process each product
    for (const item of products) {
      // Fetch the product details from the Product collection
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with ID ${item.productId} not found` });
      }

      // Calculate the price for this product and add to the total
      totalPrice += item.quantity * product.price;

      // Add the product details to the order array
      orderProducts.push({
        product: product._id,  // Directly use product._id
        quantity: item.quantity,
        price: product.price,
        orderStatus: "pending"  // Default status
      });
    }

    // Add the new order to the user's orders array
    user.orders.push(...orderProducts);  // Spread operator to push multiple orders at once

    // Clear the cart after placing the order
    user.cart = [];

    await user.save();
    res.status(201).json({ message: 'Order added successfully', orders: user.orders });
  } catch (error) {
    console.error("Error adding order:", error);  // Log the error for debugging
    res.status(500).json({ message: 'Error adding order', error: error.message });
  }
});


// @desc    Remove an order from the user's orders array (authenticated route)
// @route   DELETE /api/users/orders/:orderId
router.delete('/orders/:orderId', authenticateUser, async (req, res) => {
  const { orderId } = req.params;  // Get the orderId from the request params
  const userId = req.user.id;      // Get userId from the JWT

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the order to delete and remove it from the orders array
    const orderIndex = user.orders.findIndex(order => order._id.toString() === orderId);

    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Remove the order at the found index
    user.orders.splice(orderIndex, 1);

    // Save the updated user document
    await user.save();
    res.status(200).json({ message: 'Order removed successfully', orders: user.orders });
  } catch (error) {
    console.error("Error removing order:", error);  // Log the error for debugging
    res.status(500).json({ message: 'Error removing order', error: error.message });
  }
});



module.exports = router;
