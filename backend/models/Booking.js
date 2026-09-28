const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    serviceType: { type: String, enum: ["prasad", "puja"], required: true },
    serviceName: { type: String, required: true, trim: true },
    bookingDate: { type: Date, required: true },
    status: { type: String, enum: ["pending", "confirmed", "cancelled"], default: "pending" },
    notes: { type: String, default: "", trim: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
