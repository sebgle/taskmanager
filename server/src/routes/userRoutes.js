const express = require("express");
const {
  registerUser,
  updateUser,
  deleteUser,
  getUserById,
  getAllUsers,
} = require("../controllers/userController");
const validateSignup = require("../middlewares/validateSignup");

const router = express.Router();

router.post("/register", validateSignup, registerUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.get("/:id", getUserById);
router.get("/", getAllUsers);

module.exports = router;
