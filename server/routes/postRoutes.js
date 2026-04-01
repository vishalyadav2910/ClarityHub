const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");


// 📝 CREATE POST (Protected)
router.post("/", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required ❌" });
    }

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
});


// 🌍 GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    // add counts 🔥
    const formattedPosts = posts.map((post) => ({
      ...post._doc,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    res.json(formattedPosts);

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
      // unlike
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // like
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


// 💬 ADD COMMENT
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text required ❌" });
    }

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
});


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

    // 🔐 ownership check
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


// ✏️ UPDATE POST
router.put("/:id", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required ❌" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found ❌" });
    }

    // 🔐 owner check
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
});


// 🗑️ DELETE POST
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found ❌" });
    }

    // 🔐 owner check
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