const jwt = require("jsonwebtoken");

const optionalVerifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      // No token provided, continue without user info
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.payload;
    next();
  } catch (error) {
    console.log("error with optionalVerifyToken:", error);
  }
};

module.exports = optionalVerifyToken;
