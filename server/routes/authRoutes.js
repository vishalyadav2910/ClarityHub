const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");


// 🔐 REGISTER (WITH VALIDATION)
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required ❌"),
    body("email").isEmail().withMessage("Valid email required ❌"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters ❌"),
  ],
  async (req, res) => {
    try {
      // 🔍 validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { name, email, password } = req.body;

      // check user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists ❌" });
      }

      // hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      // hide password
      user.password = undefined;

      res.status(201).json({
        message: "User registered successfully ✅",
        user,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🔑 LOGIN (WITH VALIDATION)
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required ❌"),
    body("password").notEmpty().withMessage("Password required ❌"),
  ],
  async (req, res) => {
    try {
      // 🔍 validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // check user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found ❌" });
      }

      // compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials ❌" });
      }

      // generate token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful ✅",
        token,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🔒 PROTECTED ROUTE
router.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed ✅",
    user: req.user,
  });
});


module.exports = router;