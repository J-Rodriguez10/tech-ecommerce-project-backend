const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const authenticateUser = require('../middleware/authenticateUser'); 
const User = require("../models/User"); 


/***
 * Provides authenticated endpoints to fetch user orders, create new orders from cart contents,
 * and update order statuses with validation and authorization.
 */

// @desc    Get all orders of a specific user (authenticated route)
// @route   GET /api/orders
router.get('/', authenticateUser, async (req, res) => {
  try {
    // Fetch the user ID from the JWT
    const userId = req.user.id;
    console.log("User ID from JWT:", userId);  // Log the userId

    // Find all orders for the authenticated user
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });  // Sort by creation date (latest first)
    console.log("Fetched orders:", orders);  // Log the fetched orders

    // If no orders are found, return an empty list with a 200 status
    if (orders.length === 0) {
      console.log("No orders found for this user.");
      return res.status(200).json({ message: 'No orders found for this user', orders: [] });  // Return 200 and empty array
    }

    // Return the orders
    console.log("Returning orders:", orders);  // Log the orders that will be returned
    res.status(200).json({ message: 'Orders fetched successfully', orders });
  } catch (error) {
    console.error('Error fetching orders:', error);  // Log any errors
    res.status(500).json({ message: 'Error fetching orders' });
  }
});


// @desc    Create a new order (authenticated route)
// @route   POST /api/orders
router.post('/', authenticateUser, async (req, res) => {
  const { email, firstName, lastName, shippingAddress, paymentMethod, shippingMethod, useShippingAsBilling, newsletterSubscribed } = req.body;

  try {
    // Log incoming request data
    console.log("Request Body:", req.body);

    const userId = req.user.id;  // Get the user ID from the JWT
    console.log("User ID from JWT:", userId);

    // Fetch user data from the database
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("User not found.");
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("User data found:", user);

    if (!user.cart || user.cart.length === 0) {
      console.log("User's cart is empty.");
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Log cart data
    console.log("User's cart:", user.cart);

    // Check if shippingAddress has all required fields
    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) {
      console.log("Incomplete shipping address:", shippingAddress);
      return res.status(400).json({ message: 'Incomplete shipping address' });
    }

    // Calculate total price from cart items
    const totalPrice = user.cart.reduce((total, item) => total + item.price * item.quantity, 0);
    console.log("Total Price:", totalPrice);

    // Prepare products for the order
    const products = user.cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      productImage: item.productImage,
    }));
    console.log("Prepared products for the order:", products);

    // Create a new order object
    const newOrder = new Order({
      userId,
      email,
      firstName, // Add first name from the form
      lastName,  // Add last name from the form
      products,
      totalPrice,
      shippingAddress: {
        streetAddress: shippingAddress.streetAddress,
        apartment: shippingAddress.apartment,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country
      },
      paymentMethod,
      shippingMethod,
      useShippingAsBilling,
      orderStatus: 'pending', // Default status
      newsletterSubscribed,
    });

    // Log the order details before saving
    console.log("New Order Object:", newOrder);

    // Save the new order
    await newOrder.save();
    console.log("Order saved successfully.");

    // Clear the cart after the order is placed
    user.cart = [];
    await user.save();
    console.log("User's cart cleared after order.");

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});


// @desc    Update the status of an order (authenticated route)
// @route   PUT /api/orders/:orderId/status
router.put('/:orderId/status', authenticateUser, async (req, res) => { 
  const { orderStatus } = req.body;  // Get the new order status from the request body

  try {
    // Find the order by ID
    const order = await Order.findById(req.params.orderId);

    // If the order does not exist
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is authorized to update the order (i.e., the order must belong to the logged-in user)
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this order' });
    }

    // Validate the provided orderStatus
    const validStatuses = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    // Update the order status
    order.orderStatus = orderStatus;

    // Save the updated order
    await order.save();

    // Respond with the updated order
    res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

module.exports = router;