const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema({
  title: String,
  cards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cards",
    },
  ],
  archived: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("List", ListSchema);
