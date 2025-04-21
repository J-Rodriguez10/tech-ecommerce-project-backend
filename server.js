require("dotenv").config();
const express = require("express");
const cors = require("cors");  // Import CORS
const connectDB = require("./config/db");

// Import routes
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");  // User routes are active
const orderRoutes = require("./routes/orderRoutes");  // Import order routes

const app = express();
const PORT = process.env.PORT || 5000;

// 1) Enable CORS (allow requests from any origin)
app.use(cors());

// 2) Connect to the database
connectDB();

// 3) Middleware to parse JSON request bodies
app.use(express.json()); 

// Use routes
app.use("/api/products", productRoutes);  // Product routes are active
app.use("/api/users", userRoutes);  // User routes are active
app.use("/api/orders", orderRoutes);  // Use the order routes for the '/api/orders' path

// Test if the server is running
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
