const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log("Authorization Header:", authHeader); // Log the authorization header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Unauthorized: No token provided");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded Token:", decoded); // Log the decoded token

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.error("Unauthorized: User not found");
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user; // Attach user to request
    console.log("User Found:", user); // Log user details
    next();
  } catch (err) {
    console.error("Unauthorized: Invalid token", err); // Log error details
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = protect;
