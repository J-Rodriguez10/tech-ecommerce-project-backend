const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema({
  // Basic user information
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Cart items for the user
  cart: [
    {
      productId: { 
        type: String,  // Store productId as a string (instead of an ObjectId)
        required: true
      },
      productImage: { type: String, required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],

  // Wishlist items for the user
  wishlist: [
    {
      productId: { type: String, required: true },  // Store productId as a string
    },
  ],
  // Date of user account creation
  createdAt: { type: Date, default: Date.now },
});

// Password hashing before saving (ensure passwords are encrypted)
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Compare hashed passwords (for login)
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);

module.exports = User;
