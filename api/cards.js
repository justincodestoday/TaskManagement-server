const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const member = require("../middleware/member");
// const { check, validationResult } = require("express-validator");

const User = require("../models/User");
const Board = require("../models/Board");
const List = require("../models/List");
const Card = require("../models/Card");

// Add a card
router.post("/", [auth, member], async (req, res) => {
  try {
    const { title, listId } = req.body;

    if (title === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    const boardId = req.header("boardId");

    // Create and save the card
    const newCard = new Card({ title });
    const card = await newCard.save();

    // Assign the card to the list
    const list = await List.findById(listId);
    list.cards.push(card.id);
    await list.save();

    // Log activity
    const user = await User.findById(req.user._id);
    const board = await Board.findById(boardId);
    board.activity.unshift({
      text: `${user.name} added '${title}' to '${list.title}'`,
    });
    await board.save();

    return res.status(200).json({ cardId: card.id, listId });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get all of a list's cards
router.get("/list-cards/:listId", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    const cards = [];
    for (const cardId of list.cards) {
      cards.push(await Card.findById(cardId));
    }

    return res.status(200).json(cards);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get a card by id
router.get("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Edit a card's title, description, and/or label
router.patch("/rename/:id", [auth, member], async (req, res) => {
  try {
    const { title, description, label } = req.body;

    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.title = title ? title : card.title;
    if (description || description === "") {
      card.description = description;
    }
    if (label || label === "") {
      card.label = label;
    }
    await card.save();

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Archive/Unarchive a card
router.patch("/archive/:archive/:id", [auth, member], async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    card.archived = req.params.archive === "true";
    await card.save();

    // Log activity
    const user = await User.findById(req.user._id);
    const board = await Board.findById(req.header("boardId"));
    board.activity.unshift({
      text: card.archived
        ? `${user.name} archived card '${card.title}'`
        : `${user.name} sent card '${card.title}' to the board`,
    });
    await board.save();

    return res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Move a card
router.patch("/move/:id", [auth, member], async (req, res) => {
  try {
    const { fromId, toId, toIndex } = req.body;
    const boardId = req.header("boardId");
    const cardId = req.params.id;

    const from = await List.findById(fromId);
    let to = await List.findById(toId);
    if (!cardId || !from || !to) {
      return res.status(404).json({ message: "List/card not found" });
    } else if (fromId === toId) {
      to = from;
    }

    const fromIndex = from.cards.indexOf(cardId);
    if (fromIndex !== -1) {
      from.cards.splice(fromIndex, 1);
      await from.save();
    }

    if (!to.cards.includes(cardId)) {
      if (toIndex === 0 || toIndex) {
        to.cards.splice(toIndex, 0, cardId);
      } else {
        to.cards.push(cardId);
      }
      await to.save();
    }

    // Log activity
    const user = await User.findById(req.user.id);
    const board = await Board.findById(boardId);
    const card = await Card.findById(cardId);
    if (fromId !== toId) {
      board.activity.unshift({
        text: `${user.name} moved '${card.title}' from '${from.title}' to '${to.title}'`,
      });
      await board.save();
    }

    return res.status(200).json({ cardId, from, to });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Add/Remove a member
router.put(
  "/add-member/:add/:cardId/:userId",
  [auth, member],
  async (req, res) => {
    try {
      const { cardId, userId } = req.params;
      const card = await Card.findById(cardId);
      const user = await User.findById(userId);
      if (!card || !user) {
        return res.status(404).json({ message: "Card/user not found" });
      }

      const add = req.params.add === "true";
      const members = JSON.stringify(card.members.map((member) => member.user));

      // Look for the index of the user in the card's members
      const memberIndex = card.members.indexOf(
        card.members.find((cardId) => cardId.user == userId)
      );

      // See if the user is already in the card's members
      if ((add && members.includes(userId)) || (!add && memberIndex === -1)) {
        return res.json(card);
      }

      if (add) {
        card.members.push({ user: user.id, name: user.name });
      } else {
        card.members.splice(memberIndex, 1);
      }
      await card.save();

      // Log activity
      const board = await Board.findById(req.header("boardId"));
      board.activity.unshift({
        text: `${user.name} ${add ? "joined" : "left"} '${card.title}'`,
      });
      await board.save();

      return res.status(200).json(card);
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Delete a card
router.delete("/:listId/:id", [auth, member], async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    const list = await List.findById(req.params.listId);
    if (!card || !list) {
      return res.status(404).json({ message: "List/card not found" });
    }

    list.cards.splice(list.cards.indexOf(req.params.id), 1);
    await list.save();
    await card.remove();

    // Log activity
    const user = await User.findById(req.user._id);
    const board = await Board.findById(req.header("boardId"));
    board.activity.unshift({
      text: `${user.name} deleted '${card.title}' from '${list.title}'`,
    });
    await board.save();

    return res.status(200).json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
