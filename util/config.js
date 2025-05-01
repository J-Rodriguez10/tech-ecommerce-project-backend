/***
 * Defines the base server URL used to proxy external product images through /api/products/proxy-image,
 * enabling secure, CORS-free image delivery to the frontend.
 */

const BACK_END_URL = process.env.BACK_END_URL || "http://localhost:4000";
module.exports = { BACK_END_URL };
