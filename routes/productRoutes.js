const express = require("express");
const Product = require("../models/Product");
const axios = require("axios");
const { BACK_END_URL } = require("../util/config");

/***
 * Handles product-related API endpoints including filtering, sorting, and pagination (GET /),
 * single and batch product fetching (GET /:id, POST /fetch), and image proxying for secure frontend display.
 */

const router = express.Router();

// Helper function to modify the image URLs
const modifyProductImagesUrl = (product) => {
    const newProduct = {
        ...product.toObject(), // Convert to plain JS object to avoid Mongoose issues
        productImages: product.productImages.map(
            (imgUrl) =>
                `${BACK_END_URL}/api/products/proxy-image?url=${encodeURIComponent(
                    imgUrl
                )}`
        ),
    };
    return newProduct;
};

// Proxy route for fetching images
router.get("/proxy-image", async (req, res) => {
    try {
        const imageUrl = decodeURIComponent(req.query.url); // Get the image URL from the query params
        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        }); // Fetch image

        res.setHeader("Content-Type", response.headers["content-type"]); // Set content type of image
        res.send(response.data); // Send the image back to the frontend
    } catch (error) {
        res.status(500).json({
            message: "Error fetching image",
            error: error.message,
        });
    }
});


// @desc    Get filtered products (with pagination & image modifications)
// @route   GET /api/products
router.get("/", async (req, res) => {
    try {
        // 1) Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 2) Build query object for filtering
        const query = {};

        if (req.query.name) {
            query.name = { $regex: req.query.name, $options: "i" };
            // Case-insensitive search for name
        }
        if (req.query.tags) {
            const tagsArray = Array.isArray(req.query.tags)
                ? req.query.tags
                : req.query.tags.split(",").map((tag) => tag.trim());

            query.tags = { $in: tagsArray };
        }
        if (req.query.inStock !== undefined) {
            // Convert the "true"/"false" string to boolean
            const inStock = req.query.inStock === "true";
            
            if (inStock) {
                // Query for products that are in stock (stock > 0)
                query.stock = { $gt: 0 };
            } else {
                // Query for products that are out of stock (stock === 0)
                query.stock = { $eq: 0 };
            }
        }
        if (req.query.minPrice && req.query.maxPrice) {
            query.price = {
                $gte: parseFloat(req.query.minPrice),
                $lte: parseFloat(req.query.maxPrice),
            };
        }
        if (req.query.color) {
            query.color = { $in: req.query.color.split(",") };
        }
        if (req.query.size) {
            query.storageSize = { $in: req.query.size.split(",").map(Number) };
        }

        // EX: http://localhost:4000/api/products?brand=Apple,Canon
        if (req.query.brand) {
            query.brand = { $in: req.query.brand.split(",") };
        }

        // 3) Sorting logic
        let sort = {};
        if (req.query.sortBy && req.query.sortBy !== "") {
            const sortOptions = {
                "alpha-A-Z": { name: 1 },
                "alpha-Z-A": { name: -1 },
                "price-low-high": { price: 1 },
                "price-high-low": { price: -1 },
                "date-new-old": { createdAt: -1 },
                "date-old-new": { createdAt: 1 },
            };
            sort = sortOptions[req.query.sortBy] || {};
        }

        console.log("Final MongoDB Query:", query);

        // 4) Fetch filtered products from MongoDB
        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // 5) Modify image URLs (preserve existing functionality)
        const modifiedProducts = products.map((product) =>
            modifyProductImagesUrl(product)
        );

        // 6) Send response
        res.json({
            products: modifiedProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: page,
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// @desc    Get a single product by ID
// @route   GET /api/products/:id
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product)
            return res.status(404).json({ message: "Product not found" });

        // Modify image URLs for the individual product
        const modifiedProduct = modifyProductImagesUrl(product);

        res.json(modifiedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// @desc    Get multiple products by IDs
// @route   POST /api/products/fetch
router.post('/fetch', async (req, res) => {
    try {
        const { productIds } = req.body;  // Get an array of productIds from the request body

        // Find products where the productId is in the array of productIds
        const products = await Product.find({
            '_id': { $in: productIds }
        });

        if (products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }

        // Modify image URLs for each product
        const modifiedProducts = products.map(modifyProductImagesUrl);

        res.json({ products: modifiedProducts });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;


