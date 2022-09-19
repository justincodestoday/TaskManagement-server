const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const List = require("../models/List");
const Card = require("../models/Card");
const User = require("../models/User");

router.post("/add-list", auth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.user.isAdmin) {
      return res.status(400).json({
        message: "User is not authorized to add a list",
      });
    } else {
      const list = new List({
        title,
      });
      list.save();
      return res.status(200).json({
        message: "New list added successfully",
        list,
      });
    }
  } catch (e) {
    return res.status(400).json({
      e,
      message: "List cannot be added",
    });
  }
});

router.delete("/delete-list/:id", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(400).json({
        message: "User is not authorized to delete this list",
      });
    } else {
      await List.findByIdAndDelete(req.params.id);
      return res.status(200).json({
        message: "List deleted successfully",
      });
    }
  } catch (e) {
    return res.status(400).json({
      e,
      message: "List cannot be deleted",
    });
  }
});

router.get("/get-cards", async (req, res) => {
  try {
    let card = await Card.find({});
    if (!card.length)
      return res.status(400).json({
        message: "No cards found",
      });
    return res.status(200).json(card);
  } catch (e) {
    return res.status(400).json({
      e,
      message: "Cannot get cards",
    });
  }
});

// Get post by ID eg. localhost:3000/posts/id
router.get("/:id", async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post)
      return res.json({
        message: "No post found",
      });
    return res.send(post);
  } catch (e) {
    return res.json({
      e,
      message: "Cannot get posts",
    });
  }
});

// Delete post by ID eg. localhost:3000/posts/id

// Update post by ID eg. localhost:3000/posts/id
router.put("/:id", auth, async (req, res) => {
  try {
    let sameUser = await Post.findById(req.params.id);
    if (sameUser.author != req.user._id) {
      return res.json({
        message: "User has no authorisation",
      });
    } else {
      let post = await Post.findByIdAndUpdate(req.params.id, req.body);
      return res.json({
        post,
        message: "Post successfully updated",
      });
    }
  } catch (e) {
    return res.json({
      e,
      message: "Unable to update post",
    });
  }
});

module.exports = router;
