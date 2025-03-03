const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  profilePicture: String,
  name: String,
  email: String,
  password: String, // Hashed in real use
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // Stores an array of Product Ids
  cart: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
    },
  ],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  isAdmin: { type: Boolean, default: false },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
