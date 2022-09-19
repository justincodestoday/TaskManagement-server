const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tasks: [
    {
      authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      title: String,
      status: Boolean,
    },
  ],
});

module.exports = mongoose.model("Card", CardSchema);
