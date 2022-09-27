const mongoose = require("mongoose");

const BoardSchema = new mongoose.Schema(
    {
        title: String,
        lists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Lists",
            },
        ],
        activity: [
            {
                text: String,
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        backgroundURL: String,
        members: [
            {
                _id: false,
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users",
                },
                name: String,
                role: {
                    type: String,
                    default: "admin",
                },
            },
        ],
        cards: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Cards",
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Board", BoardSchema);
