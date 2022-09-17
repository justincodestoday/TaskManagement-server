const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  username: String,
  password: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);
