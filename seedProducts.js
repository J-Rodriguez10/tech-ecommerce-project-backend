require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const csv = require("csv-parser");
const Product = require("./models/Product"); // Adjust path if needed

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const products = [];

fs.createReadStream(path.join(__dirname, "seed.csv"))
  .pipe(csv())
  .on("data", (row) => {
    products.push({
      name: row.name,
      description: row.description,
      productImages: row.productImages ? row.productImages.split("|") : [], // Splitting on '|'
      rating: parseFloat(row.rating) || 0,
      reviews: [], // Leave reviews empty for now
      createdAt: row.createdAt ? new Date(row.createdAt) : Date.now(),
      category: row.category,
      subCategory: row.subCategory,
      productType: row.productType || "",
      price: parseFloat(row.price),
      stock: parseInt(row.stock),
      storageSize: row.storageSize
        ? row.storageSize.split("|").map(Number)
        : undefined,
      color: row.color ? row.color.split("|") : [], // Convert to array of strings
      tags: row.tags ? row.tags.split("|") : [], // Convert to array of strings
      brand: row.brand,
    });
  })
  .on("end", async () => {
    try {
      await Product.deleteMany(); // Clear existing products
      await Product.insertMany(products);
      console.log("Database Seeded Successfully!");
      mongoose.connection.close();
    } catch (err) {
      console.error("Error Seeding Database:", err);
    }
  });
