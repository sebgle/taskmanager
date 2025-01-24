const express = require("express");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Protected route
router.get("/", protect, (req, res) => {
  res.status(200).json({ message: "Access granted" });
});

module.exports = router;
