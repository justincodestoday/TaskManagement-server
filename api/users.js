const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

router.post(
    "/register",
    check("firstname").not().isEmpty().withMessage("First name is required"),

    check("lastname").not().isEmpty().withMessage("Last name is required"),

    check("username")
        .not()
        .isEmpty()
        .withMessage("Username is required")
        .bail()
        .isEmail()
        .withMessage("Email is not valid"),

    check("password")
        .not()
        .isEmpty()
        .withMessage("Password is required")
        .bail()
        .isLength({
            min: 8,
        })
        .withMessage("Password must be at least 8 characters long"),

    async (req, res) => {
        try {
            const { firstname, lastname, username, password } = req.body;

            const userFound = await User.findOne({
                username,
            });
            if (userFound) {
                return res.status(400).json({
                    message: "Email already in use",
                });
            }

            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.status(400).json({
                    message: JSON.stringify(errors.array()),
                });

            const user = new User(req.body);

            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            user.password = hash;

            user.save();
            return res.status(200).json({
                user,
                message: "Registered successfully",
            });
        } catch (e) {
            return res.status(400).json({
                e,
                message: "Register was not successful",
            });
        }
    }
);

router.post(
    "/login",
    check("username").not().isEmpty().withMessage("Username is required"),

    check("password").not().isEmpty().withMessage("Password is required"),

    async (req, res) => {
        try {
            const { username, password } = req.body;

            const errors = validationResult(req);
            if (!errors.isEmpty())
                return res.status(400).json({
                    message: JSON.stringify(errors.array()),
                });

            let userFound = await User.findOne({
                username,
            });
            if (!userFound) {
                return res.status(400).json({
                    message: "No account was created using this email",
                });
            }

            let passwordMatch = bcrypt.compareSync(
                password,
                userFound.password
            );
            if (!passwordMatch)
                return res.status(400).json({
                    message: "Incorrect password",
                });

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
                        return res.status(400).json({
                            err,
                            message: "Unable to generate token",
                        });
                    return res
                        .status(200)
                        .json({ token, message: "Logged in successfully" });
                }
            );
        } catch (e) {
            return res.status(400).json({
                e,
                message: "Invalid Credentials",
            });
        }
    }
);

module.exports = router;
