const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["active", "canceled", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

bookingSchema.virtual("computedStatus").get(function () {
  const now = new Date();
  if (this.status === "canceled") return "canceled";
  if (now < this.startAt) return "active";
  return "inactive";
});

bookingSchema.set("toJSON", { virtuals: true });
bookingSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Booking", bookingSchema);
