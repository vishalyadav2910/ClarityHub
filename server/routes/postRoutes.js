const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const protect = require("../middleware/authMiddleware");


// 📝 CREATE POST (Protected)
router.post("/", protect, async (req, res) => {
  try {
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
});


// 🌍 GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 }); // latest first 🔥

    res.json(posts);

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

    if (post.likes.includes(userId)) {
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


// 🗑️ DELETE POST (Owner Only)
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
router.put("/:id", protect, async (req, res) => {
    try {
      const { content } = req.body;
  
      const post = await Post.findById(req.params.id);
  
      if (!post) {
        return res.status(404).json({ message: "Post not found ❌" });
      }
  
      // 🔐 owner check
      if (post.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized ❌" });
      }
  
      // ✏️ update content
      post.content = content || post.content;
  
      await post.save();
  
      res.json({
        message: "Post updated successfully ✅",
        post,
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
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
  
      // 🔐 check ownership
      if (
        comment.user.toString() !== req.user._id.toString() &&
        post.user.toString() !== req.user._id.toString()
      ) {
        return res.status(401).json({ message: "Not authorized ❌" });
      }
  
      // 🗑️ remove comment
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


module.exports = router;