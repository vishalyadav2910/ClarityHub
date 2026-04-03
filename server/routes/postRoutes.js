const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");
const { body, validationResult } = require("express-validator");


// 📝 CREATE POST (WITH VALIDATION)
router.post(
  "/",
  protect,
  [
    body("content")
      .notEmpty()
      .withMessage("Content is required ❌")
      .isLength({ max: 500 })
      .withMessage("Content too long ❌"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { content } = req.body;

      const post = await Post.create({
        user: req.user._id,
        content,
      });

      res.status(201).json({
        message: "Post created successfully ✅",
        post,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 👤 GET MY POSTS
router.get("/my", protect, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id })
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.json({
      totalPosts: posts.length,
      posts: formattedPosts,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 🌍 GET POSTS (Pagination + Search)
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchFilter = {
      content: { $regex: search, $options: "i" },
    };

    const totalPosts = await Post.countDocuments(searchFilter);

    const posts = await Post.find(searchFilter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedPosts = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.json({
      page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
      posts: formattedPosts,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ❤️ LIKE / UNLIKE POST
router.put("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found ❌" });
    }

    const userId = req.user._id;

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: "Like updated ✅",
      likesCount: post.likes.length,
      likes: post.likes,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 💬 ADD COMMENT (WITH VALIDATION)
router.post(
  "/:id/comment",
  protect,
  [
    body("text")
      .notEmpty()
      .withMessage("Comment text required ❌")
      .isLength({ max: 200 })
      .withMessage("Comment too long ❌"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { text } = req.body;

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post not found ❌" });
      }

      const comment = {
        user: req.user._id,
        text,
      };

      post.comments.push(comment);
      await post.save();

      res.json({
        message: "Comment added ✅",
        comments: post.comments,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🗑️ DELETE COMMENT
router.delete("/:postId/comment/:commentId", protect, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found ❌" });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found ❌" });
    }

    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    comment.deleteOne();
    await post.save();

    res.json({
      message: "Comment deleted successfully ✅",
      comments: post.comments,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ✏️ UPDATE POST (WITH VALIDATION)
router.put(
  "/:id",
  protect,
  [
    body("content")
      .notEmpty()
      .withMessage("Content required ❌")
      .isLength({ max: 500 })
      .withMessage("Content too long ❌"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }

      const { content } = req.body;

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({ message: "Post not found ❌" });
      }

      if (post.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized ❌" });
      }

      post.content = content;
      await post.save();

      res.json({
        message: "Post updated successfully ✅",
        post,
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


// 🗑️ DELETE POST
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found ❌" });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized ❌" });
    }

    await post.deleteOne();

    res.json({
      message: "Post deleted successfully ✅",
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;