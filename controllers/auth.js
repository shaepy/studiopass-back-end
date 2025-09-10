const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

// ex. /sign-up?role=student
router.post("/sign-up", async (req, res) => {
  try {
    const { role } = req.query; // role = 'owner', 'instructor', 'student'
    if (!role) {
      return res.status(400).json({ err: "Missing role from request query." });
    }

    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.status(409).json({ err: "Username already taken." });
    }

    const user = await User.create({
      username: req.body.username,
      hashedPassword: bcrypt.hashSync(req.body.password, 12),
      email: req.body.email,
      role: role,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const payload = {
      username: user.username,
      _id: user._id,
      role: user.role,
    };
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post("/sign-in", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    console.log("Signing in user:", user);
    if (!user) return res.status(401).json({ err: "Invalid credentials." });

    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      user.hashedPassword
    );
    console.log("isPasswordCorrect?", isPasswordCorrect);
    if (!isPasswordCorrect)
      return res.status(401).json({ err: "Invalid credentials." });

    const payload = {
      username: user.username,
      _id: user._id,
      role: user.role,
    };
    const token = jwt.sign({ payload }, process.env.JWT_SECRET);
    res.status(209).json({ token });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
