const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User");
const auth = require("../middleware/auth");

// Register user
router.post(
  "/register",
  [
    check("firstname", "First name is required").not().isEmpty(),
    check("lastname", "Last name is required").not().isEmpty(),
    check("email", "Please provide a valid email").isEmail(),
    check("password", "Password must be at least 8 characters long").isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({
        message: errors.array(),
        // message: JSON.stringify(errors.array()),
      });

    try {
      const { firstname, lastname, email, password } = req.body;

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
        avatar: gravatar.url(email, { s: "200", r: "pg", d: "mm" }),
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
          if (err) throw err;
          return res
            .status(200)
            .json({ token, message: "Registered successfully", user });
        }
      );
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// Authenticate user and get token
router.post(
  "/login",
  [
    check("email", "Email is required").not().isEmpty(),
    check("password", "Password is required").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ message: errors.array() });

    try {
      const { email, password } = req.body;

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
            return res
              .status(400)
              .json({ message: "Unable to generate token" });
          return res
            .status(200)
            .json({ token, message: "Logged in successfully" });
        }
      );
    } catch (err) {
      console.error(err.message);
      return res.status(500).json({ message: "Server Error" });
    }
  }
);

// ALERT! Is this needed?
// Get users with email regex
router.get("/:input", auth, async (req, res) => {
  try {
    const regex = new RegExp(req.params.input, "i");
    const users = await User.find({
      email: regex,
    }).select("-password");

    res.json(users.filter((user) => user.id !== req.user.id));
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get authorized user
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
