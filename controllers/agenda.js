const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verify-token");
const sessionDb = require("../queries/sessionDb");
const bookingsDb = require("../queries/bookingDb");

// GET - VIEW USER BOOKINGS (student) or VIEW SESSIONS (instructor/owner)
router.get("/", verifyToken, async (req, res) => {
  try {
    const { role, _id } = req.user;
    let agenda = [];
    if (role === "student") agenda = await bookingsDb.getBookingsByUserId(_id);
    else agenda = await sessionDb.getSessionsByInstructor(_id);
    res.status(200).json(agenda);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// PUT - CANCEL A BOOKING (remove from session) - /agenda/:bookingId
router.put("/:bookingId", verifyToken, async (req, res) => {
  try {
    const removedBooking = await bookingsDb.updateBookingStatus(
      req.params.bookingId,
      req.user
    );
    console.log("removedBooking is:", removedBooking);
    if (!removedBooking) {
      return res.status(404).json({ error: "Not found." });
    } else if (removedBooking === 403) {
      return res.status(403).json({
        error: "Forbidden. You do not have permission.",
      });
    }
    res.status(200).json({ message: "Successfully cancelled booking." });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
