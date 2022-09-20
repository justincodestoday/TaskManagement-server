const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const member = require("../middleware/member");
const { check, validationResult } = require("express-validator");

const User = require("../models/User");
const Board = require("../models/Board");
const List = require("../models/List");

// Add a list
router.post(
  "/",
  [auth, member, [check("title", "Title is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      const { title } = req.body;
      const boardId = req.header("boardId");

      // Create and save the list
      const newList = new List({ title });
      const list = await newList.save();

      // Assign the list to the board
      const board = await Board.findById(boardId);
      board.lists.push(list.id);

      // Log activity
      const user = await User.findById(req.user._id);
      board.activity.unshift({
        text: `${user.name} added '${title}' to this board`,
      });
      await board.save();

      return res
        .status(200)
        .json({ message: "List created successfully", list });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Get all of a board's lists
router.get("/board-lists/:boardId", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const lists = [];
    for (const listId of board.lists) {
      lists.push(await List.findById(listId));
    }

    return res.status(200).json(lists);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get a list by id
router.get("/:id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    return res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Rename a list's title
router.patch(
  "/rename/:id",
  [auth, member, [check("title", "Title is required").not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      const list = await List.findById(req.params.id);
      if (!list) {
        return res.status(404).json({ message: "List not found" });
      }

      const board = await Board.findById(req.header("boardId"));
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // Log activity
      const user = await User.findById(req.user._id);
      if (req.body.title !== list.title) {
        board.activity.unshift({
          text: `${user.name} renamed this list (from '${list.title}')`,
        });
      }
      await board.save();

      list.title = req.body.title;
      await list.save();

      return res.status(200).json(list);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Archive/Unarchive a list
router.patch("/archive/:archive/:id", [auth, member], async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    list.archived = req.params.archive === "true";
    await list.save();

    // Log activity
    const user = await User.findById(req.user._id);
    const board = await Board.findById(req.header("boardId"));
    board.activity.unshift({
      text: list.archived
        ? `${user.name} archived list '${list.title}'`
        : `${user.name} sent list '${list.title}' to the board`,
    });
    await board.save();

    return res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Move a list
router.patch("/move/:id", [auth, member], async (req, res) => {
  try {
    const toIndex = req.body.toIndex ? req.body.toIndex : 0;
    const boardId = req.header("boardId");
    const listId = req.params.id;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    board.lists.splice(board.lists.indexOf(listId), 1);
    board.lists.splice(toIndex, 0, listId);
    await board.save();

    return res.status(200).json(board.lists);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Delete a list
router.delete("/delete-list/:id", [auth, member], async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).json({ message: "List not found" });

    const board = await Board.findById(req.header("boardId"));
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Look for the index of the list in the board's lists
    const listIndex = board.lists.indexOf(
      board.lists.find((list) => list.id == req.params.id)
    );
    // Remove list from board's lists
    board.lists.splice(listIndex, 1);

    // Log activity
    const user = await User.findById(req.user._id);
    board.activity.unshift({
      text: `${user.name} removed the list '${list.title}' from this board`,
    });
    await board.save();

    await List.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "List deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
