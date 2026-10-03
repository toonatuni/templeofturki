const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Donation = require("../models/Donation");
const { optionalAuth, requireAuth, requireAdmin } = require("../middleware/auth");
const { isValidName, isValidMobileNumber, normalizeName } = require("../validation/inputValidation");

// Legacy donation endpoint. New records remain pending until an admin verifies payment.
router.post("/donate", optionalAuth, async (req, res) => {
    try {
        const body = req.body || {};
        const name = normalizeName(body.name);
        const mobile = String(body.mobile || "").trim();
        const amount = Number(body.amount);
        const purpose = String(body.purpose || "TOT Donation").trim();
        const guestAccessToken = req.user ? null : crypto.randomUUID();
        if (
            !isValidName(name) ||
            !isValidMobileNumber(mobile) ||
            !Number.isFinite(amount) ||
            amount < 1 ||
            amount > 10000000 ||
            purpose.length > 160
        ) {
            return res.status(400).json({ success: false, message: "Enter a valid name, 10-digit mobile number, amount, and purpose" });
        }
        const donation = new Donation({
            userId: req.user?.uid || null,
            name,
            mobile,
            amount,
            purpose,
            guestAccessTokenHash: guestAccessToken
                ? crypto.createHash("sha256").update(guestAccessToken).digest("hex")
                : undefined,
            status: "pending"
        });
        await donation.save();
        const donationData = donation.toObject();
        delete donationData.guestAccessTokenHash;

        return res.status(201).json({
            success: true,
            message: "Donation saved for admin verification",
            data: {
                ...donationData,
                ...(guestAccessToken ? { guestAccessToken } : {})
            }
        });
    } catch (error) {
        console.error("Donation save failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to save donation"
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

// DELETE Donation
router.delete("/donations/:id", requireAuth, requireAdmin, async (req, res) => {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid donation ID"
        });
    }

    try {
        const donation = await Donation.findByIdAndDelete(req.params.id);
        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        return res.json({
            success: true,
            message: "Donation Deleted Successfully"
        });

    } catch (error) {
        console.error("Donation deletion failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete donation"
        });
    }
});

module.exports = router;