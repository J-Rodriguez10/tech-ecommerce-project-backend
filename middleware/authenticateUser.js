const jwt = require('jsonwebtoken');

/***
 * Middleware that verifies JWT tokens in the Authorization header and attaches the decoded
 * user info to the request.
 */

const authenticateUser = (req, res, next) => {
  // 1) Extract token from the header
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // 2) Verify and decode token if valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    // 3) Attach decoded token to the user's request
    req.user = decoded;

    // 4) Call next middleware or route handler
    next(); 
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authenticateUser;