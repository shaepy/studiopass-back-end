const Session = require("../models/session");
const Booking = require("../models/booking");
const User = require("../models/user");
const utils = require("../utils/serverUtils");
const userDb = require("./userDb");

// TODO-ST: prevention for not being able to create something new, scheduled in the past

const getSessions = async (user) => {
  try {
    const sessions = await Session.find({ status: "scheduled" })
      .populate(["instructorId", "bookings"])
      .sort({ startAt: "asc" });
    const formattedSessions = await utils.formatSessions(sessions);

    if (user && user.role === "student") {
      const modifiedSessions = await userDb.addReservedStatusToSessions(
        formattedSessions,
        user._id
      );
      console.log("modifiedSessions with reserved status:", modifiedSessions);
      return modifiedSessions;
    }

    return formattedSessions;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with fetching sessions");
  }
};

const getSessionById = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId).populate([
      "instructorId",
      {
        path: "bookings",
        populate: { path: "userId" },
      },
    ]);
    const formatted = await utils.formatSession(session);
    return formatted;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with fetching session by ID");
  }
};

const getSessionsByInstructor = async (instructorId) => {
  try {
    const sessions = await Session.find({
      instructorId: instructorId,
    })
      .populate({
        path: "bookings",
        populate: { path: "userId" },
      })
      .sort({ startAt: "asc" });
    const formatted = await utils.formatSessions(sessions);
    return formatted;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with fetching sessions by instructor"
    );
  }
};

const createSession = async (reqBody) => {
  try {
    // req.body.instructor will be a username
    const instructor = await User.findOne({ username: reqBody.instructor });
    console.log("instructor found by username:", instructor);

    if (!instructor) return null;

    const {
      startAtDate,
      startAtTime,
      endAtDate,
      endAtTime,
      timezone = "-07:00", // if no timezone is passed, use default
    } = reqBody;

    const startAt = new Date(`${startAtDate}T${startAtTime}:00${timezone}`);
    const endAt = new Date(`${endAtDate}T${endAtTime}:00${timezone}`);

    const newSession = await Session.create({
      title: reqBody.title,
      description: reqBody.description,
      startAt: startAt,
      endAt: endAt,
      capacity: reqBody.capacity || 3,
      instructorId: instructor._id,
    });
    console.log("newSession created:", newSession);

    instructor.sessions.push(newSession);
    await instructor.save();
    console.log("Successfully added session to instructor.sessions");

    return newSession;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong with creating a session");
  }
};

const updateSessionData = async (sessionId, reqBody) => {
  try {
    const {
      startAtDate,
      startAtTime,
      endAtDate,
      endAtTime,
      timezone = "-07:00", // if no timezone is passed, use default
    } = reqBody;

    console.log(
      "Date string being created:",
      `${startAtDate}T${startAtTime}:00${timezone}`
    );
    const startAt = new Date(`${startAtDate}T${startAtTime}:00${timezone}`);
    console.log("startAt UTC:", startAt.toISOString());
    console.log("startAt Local:", startAt.toString());

    const endAt = new Date(`${endAtDate}T${endAtTime}:00${timezone}`);
    console.log("startAt UTC:", endAt.toISOString());
    console.log("startAt Local:", endAt.toString());

    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      {
        title: reqBody.title,
        description: reqBody.description,
        startAt: startAt,
        endAt: endAt,
        capacity: reqBody.capacity,
      },
      { new: true }
    );
    console.log("updatedSession is:", updatedSession);
    return updatedSession;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with updating the session data"
    );
  }
};

const updateSessionInstructor = async (sessionId, username) => {
  try {
    // remove from exInstructor's sessions
    const session = await Session.findById(sessionId);
    const exInstructor = await User.findById(session.instructorId);
    exInstructor.sessions.pull(session._id);
    await exInstructor.save();

    // add to newInstructor's sessions
    const newInstructor = await User.findOne({ username: username });
    newInstructor.sessions.push(session);
    await newInstructor.save();

    // update session to newInstructor
    session.instructorId = newInstructor._id;
    const updatedSession = await session.save();
    return updatedSession;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Error something went wrong with reassigning session instructor"
    );
  }
};

// post-mvp: allow notification/email of class cancellation
const cancelSession = async (sessionId, user) => {
  try {
    const session = await Session.findById(sessionId).populate("bookings");
    console.log("session to cancel is:", session);

    if (
      user.role === "instructor" &&
      user._id.toString() !== session.instructorId.toString()
    ) {
      console.log("Invalid instructorId. Access denied");
      return null;
    }

    console.log("session.bookings details:", session.bookings);
    // Loop through each booking in the session
    for (const booking of session.bookings) {
      const user = await User.findById(booking.userId);
      if (user) {
        user.bookings.pull(booking._id);
        await user.save();
        console.log(
          `Removed booking ${booking._id} from user ${user.username}'s bookings`
        );
      }
    }

    // Delete all bookings from the Booking model
    const deletedBookings = await Booking.deleteMany({
      sessionId: session._id,
    });
    console.log(
      `Deleted ${deletedBookings.deletedCount} bookings from Booking model`
    );

    // Update session status to canceled and clear bookings array
    session.status = "canceled";
    session.bookings = [];
    const canceledSession = await session.save();
    return canceledSession;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong canceling the session");
  }
};

const deleteSession = async (sessionId) => {
  try {
    const session = await Session.findById(sessionId);
    const sessionBookings = await Booking.find({ sessionId: session._id });
    console.log("sessionBookings list:", sessionBookings);

    for (const booking of sessionBookings) {
      const user = await User.findById(booking.userId);
      if (user) {
        user.bookings.pull(booking._id);
        await user.save();
        console.log(
          `Removed booking ${booking._id} from user ${user.username}'s bookings`
        );
      }
    }

    // Delete all bookings from the Booking model
    const deletedBookings = await Booking.deleteMany({
      sessionId: session._id,
    });
    console.log(
      `Deleted ${deletedBookings.deletedCount} bookings from Booking model`
    );

    // Remove session from instructor's sessions
    const instructor = await User.findById(session.instructorId);
    instructor.sessions.pull(session._id);
    await instructor.save();
    console.log(
      `Removed session ${session._id} from ${instructor.username}'s sessions`
    );

    const deletedSession = await session.deleteOne();
    console.log("Successfully deleted session:", deletedSession);
    return deletedSession;
  } catch (err) {
    console.log(err);
    throw new Error("Error something went wrong deleting the session");
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionsByInstructor,
  getSessionById,
  updateSessionData,
  updateSessionInstructor,
  cancelSession,
  deleteSession,
};
