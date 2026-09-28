const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// POST - Save Donation
router.post("/donate", requireAuth, async (req, res) => {
    try {
        const { name, mobile, amount, purpose } = req.body;
        if (!name || !mobile || !Number.isFinite(Number(amount)) || Number(amount) < 1) {
            return res.status(400).json({ success: false, message: "Name, mobile, and a valid amount are required" });
        }
        const donation = new Donation({ userId: req.user.uid, name, mobile, amount: Number(amount), purpose, status: "paid", paidAt: new Date() });
        await donation.save();

        res.status(201).json({
            success: true,
            message: "Donation Saved Successfully",
            data: donation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET - All Donations
router.get("/donations", requireAuth, requireAdmin, async (req, res) => {
    try {
        const donations = await Donation.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: donations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
// DELETE Donation
router.delete("/donations/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        await Donation.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Donation Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});