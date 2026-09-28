const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: "Temple Event", trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    location: { type: String, default: "Temple of Turki", trim: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Event", eventSchema);
