const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
    name: String,
    description: String,
    status: String,
    tasks: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            name: String,
            status: Boolean,
        },
    ],
});

module.exports = mongoose.model("Card", CardSchema);
