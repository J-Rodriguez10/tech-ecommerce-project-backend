## 🧠 Tech E-Commerce Backend

This is the backend for the **Phoone** e-commerce web application — a full-stack portfolio project designed to simulate a real-world online storefront. It provides a RESTful API for product listings, cart management, user authentication, orders, and reviews.

Built with **Express.js** and **MongoDB Atlas**, this backend powers the frontend deployed on Vercel and supports key business logic and data handling.

👉 [View the Frontend Repository](https://github.com/J-Rodriguez10/tech-ecommerce-project)

---

## ⚙️ Built With

- Express.js
- MongoDB Atlas + Mongoose
- Node.js
- JWT Authentication
- RESTful API architecture
- Hosted on Render

---

## ✨ API Features

- 🔑 User registration & login (JWT-based)
- 🛒 Cart and wishlist management (add, update, remove)
- 📦 Order placement and history retrieval
- 🧾 Review system per product
- 🖼️ Image proxying endpoint for frontend-safe image URLs
- 🔍 Product filtering by multiple query params: tags, stock, price, brand, color, size

---

## 🔐 Environment Variables

To run this project locally, create a `.env` file in the root with the following:

```env
MONGO_URI=your-mongodb-atlas-uri
JWT_SECRET=your-jwt-secret
