const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const member = require("../middleware/member");
// const { check, validationResult } = require("express-validator");

const User = require("../models/User");
const Board = require("../models/Board");

// Add a board
router.post("/", auth, async (req, res) => {
  try {
    const { title } = req.body;

    if (title === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    // BACKGROUNDURL USE FILE OR URL?

    // Create and save the board
    const newBoard = new Board({ title });
    const board = await newBoard.save();

    // Add board to user's boards
    const user = await User.findById(req.user._id);
    user.boards.unshift(board.id);
    await user.save();

    // Add user to board's members as admin
    board.members.push({ user: user.id, name: user.name });

    // Log activity
    board.activity.unshift({ text: `${user.name} created this board` });
    await board.save();

    return res
      .status(200)
      .json({ message: "Board created successfully", board });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get user's boards
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const boards = [];
    for (const boardId of user.boards) {
      boards.push(await Board.findById(boardId));
    }

    return res.status(200).json(boards);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get a board by id
router.get("/:id", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    return res.status(200).json(board);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get a board's activity
router.get("/activity/:boardId", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    return res.status(200).json(board.activity);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Rename a board's title
router.patch(
  "/rename/:id",
  [
    auth,
    // member
  ],
  async (req, res) => {
    try {
      const { title } = req.body;
      if (title === "") {
        return res.status(400).json({ message: "Title is required" });
      }

      const board = await Board.findById(req.params.id);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      // Log activity
      const user = await User.findById(req.user._id);
      if (title !== board.title) {
        board.activity.unshift({
          text: `${user.name} renamed this board (from '${board.title}')`,
        });
      }

      board.title = title;
      await board.save();

      return res
        .status(200)
        .json({ message: "Board renamed successfully", board });
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Add a board member
router.put(
  "/add-member/:userId",
  [
    auth,
    // member
  ],
  async (req, res) => {
    try {
      const board = await Board.findById(req.header("boardId"));
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // See if the user is already a member of the board
      const members = JSON.stringify(
        board.members.map((member) => member.user)
      );
      if (members.includes(req.params.userId)) {
        return res.status(400).json({ message: "Already member of board" });
      }

      // Add board to user's boards
      user.boards.unshift(board.id);
      await user.save();

      // Add user to board's members with 'normal' role
      board.members.push({ user: user._id, name: user.name, role: "normal" });

      // Log activity
      board.activity.unshift({
        text: `${user.name} joined this board`,
      });
      await board.save();

      return res.status(200).json(board.members);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Remove a board member
router.put(
  "/remove-member/:userId",
  [
    auth,
    // member
  ],
  async (req, res) => {
    try {
      const board = await Board.findById(req.header("boardId"));
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const member = board.members.find(
        (memberId) => memberId.user == req.user._id
      );
      // See if it's the admin logged in now
      if (member.role != "admin")
        return res.status(400).json({
          message: "Only admin is allowed to remove a board member",
        });

      // Look for the index of the board in the user's board catalog
      const boardIndex = user.boards.indexOf(
        user.boards.find((boardId) => boardId == board.id)
      );
      // Remove board from user's board
      user.boards.splice(boardIndex, 1);
      await user.save();

      // Look for the index of the user in the board's members
      const memberIndex = board.members.indexOf(
        board.members.find((memberId) => memberId.user == req.params.userId)
      );
      // Remove user from board's members
      board.members.splice(memberIndex, 1);

      // Log activity
      board.activity.unshift({
        text: `${user.name} left this board`,
      });
      await board.save();
      return res.status(200).json(board.members);
    } catch (err) {
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Probably causes errors
// Delete a board
router.delete(
  "/:id",
  [
    auth,
    // member
  ],
  async (req, res) => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) return res.status(404).json({ message: "Board not found" });

      const member = board.members.find(
        (memberId) => memberId.user == req.user._id
      );
      // See if it's the admin logged in now
      if (member.role != "admin")
        return res.status(400).json({
          message: "Only admin is allowed to delete this board",
        });

      await Board.findByIdAndDelete(req.params.id);
      return res.status(200).json({ message: "Board deleted successfully" });
    } catch (err) {
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
