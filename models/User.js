const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  avatar: String,
  boards: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boards",
    },
  ],
});

module.exports = mongoose.model("User", UserSchema);
