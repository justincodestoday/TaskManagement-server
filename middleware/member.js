const Board = require("../models/Board");

module.exports = async (req, res, next) => {
  const board = await Board.findById(req.header("board-id"));
  if (!board) {
    return res.status(404).json({ message: "Board not found" });
  }

  const members = JSON.stringify(board.members.map((member) => member.user));
  if (members.includes(req.user._id)) {
    next();
  } else {
    return res
      .status(401)
      .json({ message: "You must be a member of this board to make changes" });
  }
};
