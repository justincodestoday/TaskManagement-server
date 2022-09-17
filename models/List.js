const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
    name: String,
    cards: [
        {
            id: String,
            name: String,
            status: String,
        },
    ],
});

module.exports = mongoose.model("List", ListSchema);
