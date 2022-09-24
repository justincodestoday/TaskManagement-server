const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcrypt");
// const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User");
const auth = require("../middleware/auth");

// Register user and get token
router.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    if (firstname === "") {
      return res.status(400).json({ message: "First name is required" });
    }

    if (lastname === "") {
      return res.status(400).json({ message: "Last name is required" });
    }

    const validRegEx = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,4})+$/;
    if (!email.match(validRegEx)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }

    // See if user exists
    const userFound = await User.findOne({ email });
    if (userFound) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Register new user
    const user = new User({
      name: firstname + " " + lastname,
      email,
      avatar: gravatar.url(email, { s: "200", r: "pg", d: "wavatar" }),
      password: hash,
    });

    await user.save();
    // return res.status(200).json({
    //   user,
    //   message: "Registered successfully",
    // });

    // Return jsonwebtoken
    jwt.sign(
      {
        data: userFound,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      },
      (err, token) => {
        if (err)
          return res.status(400).json({ message: "Unable to generate token" });
        return res
          .status(200)
          .json({ token, message: "Registered successfully", user });
      }
    );
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Authenticate user and get token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === "") {
      return res.status(400).json({ message: "Email is required" });
    }

    if (password === "") {
      return res.status(400).json({ message: "Password is required" });
    }

    // See if user exists
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res
        .status(400)
        .json({ message: "No account was created using this email" });
    }

    // See if password matches
    const passwordMatch = bcrypt.compareSync(password, userFound.password);
    if (!passwordMatch)
      return res.status(400).json({ message: "Incorrect password" });

    // Return jsonwebtoken
    jwt.sign(
      {
        data: userFound,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      },
      (err, token) => {
        if (err)
          return res.status(400).json({ message: "Unable to generate token" });
        return res
          .status(200)
          .json({ token, message: "Logged in successfully" });
      }
    );
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get users with email regex
router.get("/:input", auth, async (req, res) => {
  try {
    // "i" is a flag in the new RegExp that ignores casing differences
    const regex = new RegExp(req.params.input, "i");
    // the select("-password") skips the password value from returning
    const users = await User.find({
      email: regex,
    }).select("-password");

    return res
      .status(200)
      .json(users.filter((user) => user.id !== req.user._id));
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

// Get authorized user
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    return res.status(200).json(user);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
