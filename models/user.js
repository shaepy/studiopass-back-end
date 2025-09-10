const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: { type: String, required: true },
  hashedPassword: { type: String, required: true },
  email: { type: String, required: true },
  role: {
    type: String,
    enum: ["owner", "instructor", "student"],
  },
  bio: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  // role: 'instructor' only
  sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Session" }],
  // student attendance record
  bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject.hashedPassword;
  },
});

module.exports = mongoose.model("User", userSchema);
