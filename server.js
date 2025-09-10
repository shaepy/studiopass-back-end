const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const logger = require("morgan");
const authRouter = require("./controllers/auth");
const usersRouter = require("./controllers/users");
const classesRouter = require("./controllers/classes");
const agendaRouter = require("./controllers/agenda");

mongoose.connect(process.env.MONGODB_URI);

try {
  mongoose.connection.on("connected", () => {
    console.log(
      `Connected to MongoDB collection: ${mongoose.connection.name}.`
    );
  });
} catch (error) {
  console.log(
    `Failed to connect to MongoDB collection: ${mongoose.connection.name}`
  );
}

app.use(cors());
app.use(express.json());
app.use(logger("dev"));

app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/classes", classesRouter);
app.use("/agenda", agendaRouter);

/* --------- ROUTES --------- */

app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${process.env.PORT}`);
});
