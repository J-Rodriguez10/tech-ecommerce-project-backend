const mongoose = require("mongoose");

/***
 * Defines the schema for products, including display info, pricing, inventory, reviews, categorization,
 * and filterable attributes like color, storage, and tags.
 */

const ProductSchema = new mongoose.Schema({
  // Product Display:
  name: { type: String, required: true },
  description: { type: String, required: true },
  productImages: { type: [String], required: true }, // First two images are the main & hover images
  rating: { type: Number, default: 0 }, // Optional, defaults to 0
  
  reviews: {
    type: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // References the 'User' collection
        comment: String,
        rating: Number,
      },
    ],
    default: [],
    required: false,
  },

  createdAt: { type: Date, default: Date.now }, // Automatically sets to the current date

  // Hierarchical Category Structure:
  // Template: shop/{category}/{subCategory}/{productType}
  // Ex: shop/cameras-videos/cameras/dslr-cameras
  category: { type: String, required: true }, // Example: "Cameras & Videos"
  subCategory: { type: String, required: true }, // Example: "Cameras"
  productType: { type: String, required: false }, // Optional: "DSLR Cameras"

  // Shop Page Filters - Query Parameters:
  price: { type: Number, required: true },
  stock: { type: Number, required: true, min: 0 }, // Stock cannot be negative
  // Storage size as an array of numbers (e.g., [16, 64, 256])

  storageSize: {
    type: [Number],
    enum: [16, 32, 64, 128, 256, 512, 1024], // Allowed storage sizes
    default: undefined, // Ensures it's optional
  },

  color: { type: [String], required: true },

  tags: {
    type: [String],
    enum: ["hotDeal", "featured", "specialOffer"],
    default: [],
  }, // Optional, defaults to an empty array

  brand: { type: String, required: true },
});

const Product = mongoose.model("Product", ProductSchema);

module.exports = Product;
