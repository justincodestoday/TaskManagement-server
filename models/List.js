const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
  title: String,
  cards: [
    {
      cardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card",
      },
      title: String,
      status: String,
    },
  ],
});

module.exports = mongoose.model("List", ListSchema);
