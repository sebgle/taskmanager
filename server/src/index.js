const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/connectToDB");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoute = require("./routes/protectedRoute");

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/protected-route", protectedRoute);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
