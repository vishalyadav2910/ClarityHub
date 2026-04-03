const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// 🔥 Trust proxy (IMPORTANT for Render / production)
app.set("trust proxy", 1);

// Connect DB
connectDB();

// 🔒 Security Middleware
app.use(cors());
app.use(helmet());

// ⚡ Rate Limiting (only on API routes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per IP
  message: "Too many requests, please try again later ❌",
});

app.use("/api", limiter);

// Body parser
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/posts", postRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "ClarityHub API running 🚀",
  });
});

// ❌ Handle unknown routes (PRO FEATURE)
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found ❌",
  });
});

// ❌ Global error handler (PRO FEATURE)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong ❌",
  });
});

// Server start
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});