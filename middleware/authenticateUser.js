const jwt = require('jsonwebtoken');

// Middleware to authenticate the user by checking the JWT token
const authenticateUser = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from the header

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using JWT_SECRET
    req.user = decoded; // Attach the decoded user info to the request
    next(); // Call next middleware or route handler
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authenticateUser; // Export the middleware to be used in other files