const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  try {
    // check the token
    const token = req.headers.authorization.split(" ")[1];
    console.log("Token from auth header is:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded is:", decoded);

    // assign decoded payload to req.user
    req.user = decoded.payload;
    console.log("req.user is:", req.user);

    next()
  } catch (err) {
    res.status(401).json({ err: 'Invalid token.' });
  }
}

module.exports = verifyToken;
