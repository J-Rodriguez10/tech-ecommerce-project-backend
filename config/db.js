require("dotenv").config();
const mongoose = require("mongoose");

/***
 * Establishes a connection to MongoDB using mongoose and logs connection status, exiting
 * the process on failure.
 */

const connectDB = async () => {
  try {
    console.log("Connecting to:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI); // No need for options
    console.log("MongoDB Connected!!!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
