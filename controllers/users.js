const express = require("express");
const router = express.Router();
const User = require("../models/user");
const verifyToken = require("../middleware/verify-token");
const userDb = require("../queries/userDb");

router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have permissions to do that.",
      });
    }
    const users = await userDb.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/staff", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have permissions to do that.",
      });
    }
    const staffList = await userDb.getStaffList();
    res.status(200).json(staffList);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/students", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have permissions to do that.",
      });
    }
    const students = await userDb.getStudents();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.get("/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res.status(403).json({
        error: "Forbidden",
        details: "You do not have permissions to do that.",
      });
    }
    const user = await userDb.getUserById(req.params.userId);
    console.log("User found is:", user);
    
    if (!user) return res.status(404).json({ err: "User not found." });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
