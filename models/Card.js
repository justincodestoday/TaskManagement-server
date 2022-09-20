const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema({
  title: String,
  description: String,
  label: String,
  status: String,
  members: [
    {
      _id: false,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      name: String,
    },
  ],
  checklist: [
    {
      text: String,
      complete: Boolean,
    },
  ],
  archived: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Card", CardSchema);
