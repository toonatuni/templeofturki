const express = require("express");

const Event = require("../models/Event");
const GalleryImage = require("../models/GalleryImage");
const Booking = require("../models/Booking");
const Donation = require("../models/Donation");

const {
    requireAuth,
    requireAdmin
} = require("../middleware/auth");

const router = express.Router();


// =====================================================
// ADMIN AUTHENTICATION
// =====================================================

router.use(requireAuth, requireAdmin);


// =====================================================
// ADMIN PROFILE
// =====================================================

router.get("/me", (req, res) => {

    res.json({
        success: true,
        data: {
            uid: req.user.uid,
            email: req.user.email,
            isAdmin: true
        }
    });

});


// =====================================================
// DONATIONS
// =====================================================


// GET ALL DONATIONS
router.get("/donations", async (req, res) => {

    try {

        const donations = await Donation
            .find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: donations
        });

    } catch (error) {

        console.error("Get Donations Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// MARK DONATION AS PAID / UPDATE STATUS
// =====================================================

router.patch("/donations/:id", async (req, res) => {

    try {

        const { status, utr } = req.body;


        // Validate status
        if (!["pending", "paid", "failed"].includes(status)) {

            return res.status(400).json({
                success: false,
                message: "Invalid donation status"
            });

        }


        const updates = {
            status: status
        };


        // If donation is marked paid
        if (status === "paid") {

            updates.paidAt = new Date();

        }


        // Save UTR if provided
        if (utr) {

            updates.utr = String(utr).trim();

        }


        const donation = await Donation.findByIdAndUpdate(

            req.params.id,

            updates,

            {
                new: true,
                runValidators: true
            }

        );


        // Donation not found
        if (!donation) {

            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });

        }


        res.json({
            success: true,
            message:
                status === "paid"
                    ? "Donation marked as paid successfully"
                    : "Donation status updated successfully",
            data: donation
        });

    } catch (error) {

        console.error("PATCH Donation Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// DELETE DONATION
// =====================================================

router.delete("/donations/:id", async (req, res) => {

    try {

        const donation =
            await Donation.findByIdAndDelete(req.params.id);


        if (!donation) {

            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });

        }


        res.json({
            success: true,
            message: "Donation deleted successfully"
        });

    } catch (error) {

        console.error("Delete Donation Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// GALLERY
// =====================================================


// GET ALL GALLERY IMAGES
router.get("/gallery", async (req, res) => {

    try {

        const images = await GalleryImage
            .find()
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: images
        });

    } catch (error) {

        console.error("Get Gallery Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// UPDATE GALLERY IMAGE STATUS
router.patch("/gallery/:id", async (req, res) => {

    try {

        const image =
            await GalleryImage.findByIdAndUpdate(

                req.params.id,

                {
                    status: req.body.status
                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!image) {

            return res.status(404).json({
                success: false,
                message: "Gallery image not found"
            });

        }


        res.json({
            success: true,
            data: image
        });

    } catch (error) {

        console.error("Gallery Update Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// DELETE GALLERY IMAGE
router.delete("/gallery/:id", async (req, res) => {

    try {

        const image =
            await GalleryImage.findByIdAndDelete(req.params.id);


        if (!image) {

            return res.status(404).json({
                success: false,
                message: "Gallery image not found"
            });

        }


        res.json({
            success: true,
            message: "Gallery image deleted successfully"
        });

    } catch (error) {

        console.error("Delete Gallery Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// EVENTS
// =====================================================


// GET ALL EVENTS
router.get("/events", async (req, res) => {

    try {

        const events = await Event
            .find()
            .sort({ startsAt: 1 })
            .lean();

        res.json({
            success: true,
            data: events
        });

    } catch (error) {

        console.error("Get Events Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// CREATE EVENT
router.post("/events", async (req, res) => {

    try {

        const event = await Event.create({

            ...req.body,

            createdBy: req.user.uid

        });


        res.status(201).json({
            success: true,
            data: event
        });

    } catch (error) {

        console.error("Create Event Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// UPDATE EVENT
router.patch("/events/:id", async (req, res) => {

    try {

        const event =
            await Event.findByIdAndUpdate(

                req.params.id,

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!event) {

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });

        }


        res.json({
            success: true,
            data: event
        });

    } catch (error) {

        console.error("Update Event Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// DELETE EVENT
router.delete("/events/:id", async (req, res) => {

    try {

        const event =
            await Event.findByIdAndDelete(req.params.id);


        if (!event) {

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });

        }


        res.json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {

        console.error("Delete Event Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// BOOKINGS
// =====================================================


// GET ALL BOOKINGS
router.get("/bookings", async (req, res) => {

    try {

        const bookings = await Booking
            .find()
            .sort({ bookingDate: 1 })
            .lean();

        res.json({
            success: true,
            data: bookings
        });

    } catch (error) {

        console.error("Get Bookings Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// UPDATE BOOKING STATUS
router.patch("/bookings/:id", async (req, res) => {

    try {

        const booking =
            await Booking.findByIdAndUpdate(

                req.params.id,

                {
                    status: req.body.status
                },

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Booking not found"
            });

        }


        res.json({
            success: true,
            data: booking
        });

    } catch (error) {

        console.error("Booking Update Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;