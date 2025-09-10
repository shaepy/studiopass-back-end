const Session = require("../models/session");
const Booking = require("../models/booking");
const User = require("../models/user");
const utils = require("../utils/serverUtils");

const createBooking = async (sessionId, userId) => {
  try {
    const user = await User.findById(userId);
    if (user.role !== "student") return "Unauthorized";

    // check session capacity
    const session = await Session.findById(sessionId).populate("bookings");
    if (session.bookings.length >= session.capacity) {
      return "maxCapacityReached";
    }

    const isDuplicate = session.bookings.some(
      (booking) => booking.userId.toString() === userId
    );
    if (isDuplicate) return null;

    // create booking
    const newBooking = await Booking.create({
      sessionId: sessionId,
      userId: user._id,
    });

    // add booking to user's bookings and session's bookings
    user.bookings.push(newBooking);
    await user.save();
    session.bookings.push(newBooking);
    await session.save();
    return newBooking;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with creating a booking");
  }
};

const getBookingById = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate("sessionId");
    console.log("booking found by ID:", booking);
    return booking;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with cancelling a booking");
  }
};

const getBookingsByUserId = async (userId) => {
  try {
    const bookings = await Booking.find({
      userId: userId,
      status: "active",
    }).populate("sessionId");

    // Sort by session startAt after population
    bookings.sort(
      (a, b) => new Date(b.sessionId.startAt) - new Date(a.sessionId.startAt)
    );

    console.log("user found for bookings:", bookings);
    const modifiedBookings = await utils.formatAgendaBookings(bookings);
    console.log("modifiedBookings:", modifiedBookings);

    return modifiedBookings;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with getting bookings by userId"
    );
  }
};

const updateBookingStatus = async (bookingId, user) => {
  try {
    const booking = await Booking.findById(bookingId);
    console.log("booking found:", booking);
    if (!booking) return null;

    if (user.role === "student" && user._id !== booking.userId.toString()) {
      console.log("Unauthorized access. Not your booking");
      return 403;
    }

    booking.status = "canceled";
    await booking.save();

    const session = await Session.findById(booking.sessionId).populate(
      "bookings"
    );
    console.log("session found:", session);
    if (!session) return null;

    // remove booking from session
    session.bookings.pull(bookingId);
    const updatedSession = await session.save();

    return updatedSession;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with cancelling a booking");
  }
};

/* * not needed right now
const getBookingsByInstructor = async (instructorId) => {
  try {
    const instructor = await User.findById(instructorId).populate({
      path: "sessions",
      populate: {
        path: "bookings",
        populate: [{ path: "userId" }, { path: "sessionId" }],
      },
    });
    const allBookings = [];
    for (const session of instructor.sessions) {
      if (session.bookings && session.bookings.length > 0) {
        allBookings.push(...session.bookings);
      }
    }
    return allBookings;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with getting bookings by instructor"
    );
  }
};
*/

module.exports = {
  createBooking,
  getBookingsByUserId,
  getBookingById,
  updateBookingStatus,
};
