const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Post = require("../models/Post");

// 👤 GET USER PROFILE + POSTS
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found ❌" });
    }

    const posts = await Post.find({ user: userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.json({
      user,
      posts: formattedPosts,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;