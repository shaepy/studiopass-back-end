const mongoose = require("mongoose");

const sessionSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  capacity: {
    type: Number,
    required: true,
    default: 3,
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bookings: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  ],
  status: {
    type: String,
    enum: ["scheduled", "inactive"],
    default: "scheduled",
    required: true,
  },
});

sessionSchema.virtual("computedStatus").get(function () {
  const now = new Date();
  if (now < this.startAt) return "scheduled";
  return "inactive";
});

sessionSchema.set("toJSON", { virtuals: true });
sessionSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Session", sessionSchema);
