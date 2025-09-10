const dayjs = require("dayjs");
const localizedFormat = require("dayjs/plugin/localizedFormat");
dayjs.extend(localizedFormat);

const formatSessions = (sessions) => {
  const transformedSessions = sessions.map((session) => {
    const start = dayjs(session.startAt);
    const end = dayjs(session.endAt);

    const startDate = start.format("ddd, MMM D");
    const endDate = end.format("ddd, MMM D");
    const startTime = start.format("h:mm A");
    const endTime = end.format("h:mm A");

    const weekday = start.format("ddd");
    const month = start.format("MMM");
    const day = start.format("D");
    const year = start.format("YYYY");

    const instructorName = `${session.instructorId.firstName} ${session.instructorId.lastName}`;

    return {
      ...session.toObject(),
      month: month,
      day: day,
      year: year,
      weekday: weekday,
      startTime: startTime,
      endTime: endTime,
      startDate: startDate,
      endDate: endDate,
      instructorName: instructorName,
    };
  });
  return transformedSessions;
};

const formatSession = (session) => {
  const start = dayjs(session.startAt);
  const end = dayjs(session.endAt);

  const startDate = start.format("ddd, MMM D");
  const endDate = end.format("ddd, MMM D");
  const startTime = start.format("h:mm A");
  const endTime = end.format("h:mm A");
  const weekday = start.format("ddd");
  const month = start.format("MMM");
  const day = start.format("D");
  const year = start.format("YYYY");

  const instructorName = `${session.instructorId.firstName} ${session.instructorId.lastName}`;

  // For editing forms
  const startAtDate = start.format("YYYY-MM-DD");
  const startAtTime = start.format("HH:mm");
  const endAtDate = end.format("YYYY-MM-DD");
  const endAtTime = end.format("HH:mm");

  return {
    ...session.toObject(),
    month: month,
    day: day,
    year: year,
    weekday: weekday,
    startDate: startDate,
    endDate: endDate,
    startTime: startTime,
    endTime: endTime,
    instructorName: instructorName,
    // FORM DATA (EDIT SESSION)
    instructor: session.instructorId.username,
    startAtDate: startAtDate,
    startAtTime: startAtTime,
    endAtDate: endAtDate,
    endAtTime: endAtTime,
  };
};

const formatAgendaBookings = (bookings) => {
  const formattedBookings = bookings.map((booking) => {
    const start = dayjs(booking.sessionId.startAt);
    const end = dayjs(booking.sessionId.endAt);

    const startDate = start.format("ddd, MMM D");
    const startTime = start.format("h:mm A");
    const endDate = end.format("ddd, MMM D");
    const endTime = end.format("h:mm A");

    return {
      ...booking.toObject(),
      startDate: startDate,
      endDate: endDate,
      startTime: startTime,
      endTime: endTime,
    };
  });
  return formattedBookings;
};

module.exports = { formatSessions, formatSession, formatAgendaBookings };
