const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verify-token");
const optionalVerifyToken = require("../middleware/optional-verify-token");
const sessionDb = require("../queries/sessionDb");
const userDb = require("../queries/userDb");
const bookingDb = require("../queries/bookingDb");

// STRETCH GOALS: filter query (by instructor, by date)

// GET - ALL SESSIONS - /classes
router.get("/", optionalVerifyToken, async (req, res) => {
  try {
    let sessions;
    if (req.user) {
      console.log("req.user found");
      sessions = await sessionDb.getSessions(req.user);
    } else {
      console.log("req.user not found");
      sessions = await sessionDb.getSessions();
    }
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// GET - VIEW SESSION - /classes/:sessionId - # session page
router.get("/:sessionId", optionalVerifyToken, async (req, res) => {
  try {
    const session = await sessionDb.getSessionById(req.params.sessionId);
    if (req.user && req.user.role === "student") {
      const modifiedSession = await userDb.addUserReservedStatus(
        session,
        req.user._id
      );
      return res.status(200).json(modifiedSession);
    }
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// * might not be needed ?
// GET - VIEW SESSION ROSTER - /classes/:sessionId/bookings - # instructor/owner sees roster
router.get("/:sessionId/bookings", verifyToken, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    const session = await sessionDb.getSessionById(req.params.sessionId);
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST - CREATE NEW SESSION - /classes
router.post("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    // * only allow instructors to be selected on front-end from drop-down (username)
    const newSession = await sessionDb.createSession(req.body);
    if (!newSession) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    res.status(201).json(newSession);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT - EDIT SESSION DATA - /classes/:sessionId
router.put("/:sessionId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    const updatedSession = await sessionDb.updateSessionData(
      req.params.sessionId,
      req.body
    );
    res.status(200).json(updatedSession);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT - REASSIGN SESSION INSTRUCTOR - /classes/:sessionId/instructor
router.put("/:sessionId/instructor", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    const updatedSession = await sessionDb.updateSessionInstructor(
      req.params.sessionId,
      req.body.instructor
    );
    res.status(200).json(updatedSession);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT - CANCEL SESSION - /classes/:sessionId/cancel
// FIX  ! DO NOT NEED THIS ROUTE //
router.put("/:sessionId/cancel", verifyToken, async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    const canceledSession = await sessionDb.cancelSession(
      req.params.sessionId,
      req.user
    );
    if (!canceledSession) {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    res.status(200).json(canceledSession);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// DELETE - DELETE SESSION - /classes/:sessionId (owner access only)
router.delete("/:sessionId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res
        .status(403)
        .json({ error: "Forbidden. You do not have permission." });
    }
    await sessionDb.deleteSession(req.params.sessionId);
    res.status(200).json({ message: "Session deleted successfully." });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST - CREATE NEW BOOKING - /classes/:sessionId/bookings
router.post("/:sessionId/bookings", verifyToken, async (req, res) => {
  try {
    const newBooking = await bookingDb.createBooking(
      req.params.sessionId,
      req.user._id
    );
    if (!newBooking) {
      return res.status(403).json({
        error: "You are already booked for this class.",
        details:
          "Canceled operation as this will result in a duplicate booking.",
      });
    } else if (newBooking === "maxCapacityReached") {
      return res.status(409).json({
        error: "Cannot book reservation; the class is already full.",
      });
    } else if (newBooking === "Unauthorized") {
      return res.status(403).json({
        error: "You do not have permissions to do that.",
      });
    }
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
