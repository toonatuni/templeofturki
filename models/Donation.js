const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true,
    },
    mobile: {
    type: String,
    required: true,
    },
    amount: {
    type: Number,
    required: true,
    },
    purpose: {
    type: String,
    default: "Temple Donation",
    },
    date: {
    type: Date,
    default: Date.now,
    },
});

module.exports = mongoose.model("Donation", donationSchema);