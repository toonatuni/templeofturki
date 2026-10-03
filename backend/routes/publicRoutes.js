const express = require("express");
const Event = require("../models/Event");
const GalleryImage = require("../models/GalleryImage");
const Donation = require("../models/Donation");
const Booking = require("../models/Booking");
const { requireAuth } = require("../middleware/auth");
const { markPresence, getActiveUserCount } = require("../middleware/presence");
const { isValidName, isValidMobileNumber, normalizeName } = require("../validation/inputValidation");

const router = express.Router();

router.get("/stats", async (req, res) => {
    try {
        const [donationStats, userCount] = await Promise.all([
            Donation.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" }, donors: { $addToSet: "$userId" } } }]),
            Donation.distinct("userId")
        ]);
        res.json({ success: true, data: { totalCollected: donationStats[0]?.total || 0, donorCount: donationStats[0]?.donors?.length || 0, registeredUsers: userCount.length, activeUsers: getActiveUserCount() } });
    } catch (error) {
        res.status(500).json({ success: false, message: "Unable to load public stats" });
    }
});

router.get("/events", async (req, res) => {
    const events = await Event.find({ isPublished: true, startsAt: { $gte: new Date() } }).sort({ startsAt: 1 }).lean();
    res.json({ success: true, data: events });
});

router.get("/gallery", async (req, res) => {
    const images = await GalleryImage.find({ status: "approved" }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: images });
});

router.post("/presence", requireAuth, markPresence);

router.post("/bookings", requireAuth, async (req, res) => {
    try {
        const { userName, mobile, serviceType, serviceName, bookingDate, notes } = req.body;
        const normalizedUserName = normalizeName(userName);
        if (!isValidName(normalizedUserName) || !isValidMobileNumber(mobile) || !serviceType || !serviceName || !bookingDate) {
            return res.status(400).json({ success: false, message: "Enter a valid name and 10-digit mobile number, and complete all booking fields" });
        }
        const booking = await Booking.create({ userId: req.user.uid, userName: normalizedUserName, mobile, serviceType, serviceName, bookingDate, notes });
        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get("/my-bookings", requireAuth, async (req, res) => {
    const bookings = await Booking.find({ userId: req.user.uid }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: bookings });
});

module.exports = router;
