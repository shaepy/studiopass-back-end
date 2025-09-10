const User = require("../models/user");
const Booking = require("../models/booking");

const getAllUsers = async () => {
  return await User.find({});
};

const getStaffList = async () => {
  return await User.find({ role: { $in: ["instructor", "owner"] } });
};

const getStudents = async () => {
  return await User.find({ role: "student" });
};

const getUserById = async (userId) => {
  return await User.findById(userId).populate([
    {
      path: "bookings",
      populate: { path: "sessionId" },
    },
    "sessions",
  ]);
};

const addUserReservedStatus = async (session, userId) => {
  try {
    const user = await User.findById(userId);
    if (user.role === "student") {
      // Check if any of this session's active bookings belong to this user
      const isBooked = session.bookings.some((booking) => {
        return user.bookings.some(
          (userBookingId) => userBookingId.toString() === booking._id.toString()
        );
      });
      console.log("isBooked:", isBooked);
      console.log("session.bookings:", session.bookings);
      console.log("user.bookings:", user.bookings);
      session.reservedStatus = isBooked;
    }
    return session;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with adding reserved status on session"
    );
  }
};

// TODO-ST Add reservation status for sessions list
const addReservedStatusToSessions = async (sessions, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== "student") {
      return sessions;
    }
    // Loop through each session and check if user has an active booking for it
    return sessions.map((session) => {
      // Check if any of this session's active bookings belong to this user
      const isBooked = session.bookings.some((booking) => {
        return user.bookings.some(
          (userBookingId) => userBookingId.toString() === booking._id.toString()
        );
      });
      console.log(`Session ${session._id} isBooked:`, isBooked);
      console.log("session.bookings:", session.bookings);
      console.log("user.bookings:", user.bookings);
      session.reservedStatus = isBooked;
      return session;
    });
  } catch (err) {
    throw new Error(
      "Error something went wrong with adding reserved status on sessions"
    );
  }
};

module.exports = {
  addUserReservedStatus,
  addReservedStatusToSessions,
  getAllUsers,
  getStaffList,
  getStudents,
  getUserById,
};
