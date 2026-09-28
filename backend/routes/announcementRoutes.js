const express = require("express");
const router = express.Router();

const Announcement = require("../models/announcement");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// POST - Add Announcement
router.post("/", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required"
            });
        }

        const announcement = new Announcement({
            title: title.trim(),
            message: message.trim()
        });

        await announcement.save();

        res.status(201).json({
            success: true,
            message: "Announcement Added Successfully",
            data: announcement
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// GET - All Announcements
router.get("/", async (req, res) => {
    try {
        const announcements = await Announcement
            .find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: announcements
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// DELETE - Announcement
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(
            req.params.id
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        res.json({
            success: true,
            message: "Announcement Deleted Successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;