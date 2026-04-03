const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    // 🔍 Check if header exists and starts with Bearer
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, no token ❌",
      });
    }

    // 🎯 Extract token
    token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Token missing ❌",
      });
    }

    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 👤 Get user from DB
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found ❌",
      });
    }

    // ✅ Attach user to request
    req.user = user;

    next();

  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Token failed ❌",
    });
  }
};

module.exports = protect;
