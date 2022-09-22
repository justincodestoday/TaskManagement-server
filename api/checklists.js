const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const member = require("../middleware/member");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");
const Board = require("../models/Board");
const Card = require("../models/Card");

// Add a checklist item
router.post("/:cardId", [auth, member], async (req, res) => {
  try {
    const { text } = req.body;
    if (text === "") {
      return res.status(400).json({ message: "Text is required" });
    }

    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.checklist.push({ text, complete: false });
    await card.save();

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Rename a checklist's item's text
router.patch("/:cardId/:itemId", [auth, member], async (req, res) => {
  try {
    const { text } = req.body;
    if (text === "") {
      return res.status(400).json({ message: "Text is required" });
    }

    const boardId = req.header("boardId");

    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const items = card.checklist.find((item) => item.id === req.params.itemId);

    // Log activity
    const user = await User.findById(req.user._id);
    const board = await Board.findById(boardId);
    if (text !== items.text) {
      board.activity.unshift({
        text: `${user.name} renamed the checklist item to '${text}' (from '${items.text}')`,
      });
    }
    await board.save();

    items.text = text;
    await card.save();

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Complete/Incomplete a checklist item
router.patch("/:cardId/:complete/:itemId", [auth, member], async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const items = card.checklist.find((item) => item.id === req.params.itemId);

    items.complete = req.params.complete === "true";
    await card.save();

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Delete a checklist item
router.delete("/:cardId/:itemId", [auth, member], async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    const index = card.checklist.findIndex(
      (item) => item.id === req.params.itemId
    );
    if (index !== -1) {
      card.checklist.splice(index, 1);
      await card.save();
    }

    return res
      .status(200)
      .json({ message: "Checklist item deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
