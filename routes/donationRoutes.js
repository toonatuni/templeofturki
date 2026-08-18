const express = require("express");
const router = express.Router();

const Donation = require("../models/Donation");

// POST - Save Donation
router.post("/donate", async (req, res) => {
    try {
        const donation = new Donation(req.body);
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
router.get("/donations", async (req, res) => {
    try {
        const donations = await Donation.find().sort({ date: -1 });

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
router.delete("/donations/:id", async (req, res) => {
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