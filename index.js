const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const {
  PORT,
  DB_HOST,
  DB_PORT,
  DB_NAME,
  MONGO_DB_USERNAME,
  MONGO_DB_PASSWORD,
  MONGO_DB_CLUSTER,
} = process.env;

// LOCAL DB
// mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`);

// ONLINE DB, change the server and database names
mongoose.connect(
  `mongodb+srv://${MONGO_DB_USERNAME}:${MONGO_DB_PASSWORD}@${MONGO_DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`
);

app.use(express.json());
app.use(cors());

app.use("/users", require("./api/users"));
app.use("/cards", require("./api/cards"));
app.use("/lists", require("./api/lists"));

app.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
mongoose.connection.once("open", () =>
  console.log("We are connected to MongoDB")
);
