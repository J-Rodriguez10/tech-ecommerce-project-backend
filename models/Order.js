const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the User model
    required: true 
  },

  email: { 
    type: String, 
    required: true 
  },

  firstName: { 
    type: String, 
    required: true 
  },

  lastName: { 
    type: String, 
    required: true 
  },

  products: [
    {
      productId: { 
        type: String,  // Product ID from Product collection
        required: true 
      },
      productName: { 
        type: String, 
        required: true 
      },
      quantity: { 
        type: Number, 
        required: true 
      },
      price: { 
        type: Number, 
        required: true 
      },
      productImage: { 
        type: String,  // Store the product image URL
        required: true 
      }
    }
  ],

  totalPrice: { 
    type: Number, 
    required: true 
  },

  orderStatus: { 
    type: String, 
    default: "pending",  // Default order status can be 'pending'
    enum: ["pending", "paid", "shipped", "completed", "cancelled"]  // Possible statuses
  },

  shippingAddress: {
    streetAddress: { type: String, required: true },  // Updated field name
    apartment: { type: String }, // Optional field for apartment, suite, etc.
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },

  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ["creditCard", "paypal", "bankTransfer"]  // Example payment methods
  },

  useShippingAsBilling: { 
    type: Boolean, 
    default: false // Whether the shipping address is used as billing address
  },

  shippingMethod: { 
    type: String, 
    enum: ["international", "domestic"], // Available shipping methods
    required: true 
  },

  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Order Model
const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
