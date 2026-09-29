const express = require("express");
const router = express.Router();

const Announcement = require("../models/announcement");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.post("/", requireAuth, requireAdmin, async (req, res) => {
    try {
        const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
        const message = typeof req.body.message === "string" ? req.body.message.trim() : "";

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: "Title and message are required"
            });
        }

        const announcement = await Announcement.create({
            title,
            message,
            isPublished: req.body.isPublished !== false
        });

        return res.status(201).json({
            success: true,
            message: "Announcement Added Successfully",
            data: announcement
        });
    } catch (error) {
        console.error("Announcement creation failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add announcement"
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const announcements = await Announcement
            .find({
                $or: [
                    { isPublished: true },
                    { isPublished: { $exists: false } }
                ]
            })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error("Public announcements could not be loaded:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load announcements"
        });
    }
});

router.get("/admin/announcements", requireAuth, requireAdmin, async (req, res) => {
    try {
        const announcements = await Announcement
            .find()
            .sort({ createdAt: -1 })
            .lean();
        return res.json({ success: true, data: announcements });
    } catch (error) {
        console.error("Admin announcements could not be loaded:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to load announcements"
        });
    }
});

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
    const update = {};

    if (req.body.title !== undefined) {
        if (typeof req.body.title !== "string" || !req.body.title.trim()) {
            return res.status(400).json({
                success: false,
                message: "A title is required"
            });
        }
        update.title = req.body.title.trim();
    }

    if (req.body.message !== undefined) {
        if (typeof req.body.message !== "string" || !req.body.message.trim()) {
            return res.status(400).json({
                success: false,
                message: "A message is required"
            });
        }
        update.message = req.body.message.trim();
    }

    if (req.body.isPublished !== undefined) {
        if (typeof req.body.isPublished !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isPublished must be a boolean"
            });
        }
        update.isPublished = req.body.isPublished;
    }

    if (!Object.keys(update).length) {
        return res.status(400).json({
            success: false,
            message: "No announcement changes were supplied"
        });
    }

    try {
        const announcement = await Announcement.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        return res.json({ success: true, data: announcement });
    } catch (error) {
        console.error("Announcement update failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update announcement"
        });
    }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: "Announcement not found"
            });
        }

        return res.json({
            success: true,
            message: "Announcement Deleted Successfully"
        });
    } catch (error) {
        console.error("Announcement deletion failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete announcement"
        });
    }
});

module.exports = router;
