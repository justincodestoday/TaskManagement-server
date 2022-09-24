const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { PORT, LOCAL_URI, MONGODB_URI } = process.env;

// LOCAL DB
// mongoose.connect(LOCAL_URI);

// ONLINE DB, change the server and database names
mongoose.connect(
  MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => (err ? console.log(err) : console.log("MongoDB connected"))
);

app.use(express.json());
app.use(cors());

app.use("/users", require("./api/users"));
app.use("/boards", require("./api/boards"));
app.use("/lists", require("./api/lists"));
app.use("/cards", require("./api/cards"));
app.use("/checklists", require("./api/checklists"));

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

app.listen(PORT, () => console.log("Server is running on PORT " + PORT));
