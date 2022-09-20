const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({
      message: "Authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded.data;
    next();
  } catch (err) {
    return res.status(401).json({
      err,
      message: "Authorization denied",
    });
  }
};
