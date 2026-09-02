const express = require("express");
const QRCode = require("qrcode");

const Donation = require("../models/Donation");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();


// =====================================================
// UPI CONFIG
// =====================================================

function getUpiConfig() {
    return {
        id: process.env.UPI_ID || "",
        name: process.env.UPI_PAYEE_NAME || "Dhiraj Kumar"
    };
}


// =====================================================
// GET UPI CONFIG
// =====================================================

router.get("/payments/upi-config", (req, res) => {

    try {

        const config = getUpiConfig();

        if (!config.id) {

            return res.status(503).json({
                success: false,
                message: "UPI_ID is not configured"
            });

        }

        res.json({
            success: true,
            data: config
        });

    } catch (error) {

        console.error("UPI Config Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// =====================================================
// CREATE UPI PAYMENT
// =====================================================

router.post(
    "/payments/upi-intent",
    requireAuth,
    async (req, res) => {

        try {

            const amount = Number(req.body.amount);

            const name = String(
                req.body.name || ""
            ).trim();

            const mobile = String(
                req.body.mobile || ""
            ).trim();

            const purpose = String(
                req.body.purpose || "Temple Donation"
            ).trim();


            // -----------------------------------------
            // UPI CONFIG
            // -----------------------------------------

            const config = getUpiConfig();

            if (!config.id) {

                return res.status(503).json({
                    success: false,
                    message:
                        "UPI_ID is not configured in .env"
                });

            }


            // -----------------------------------------
            // VALIDATION
            // Minimum donation = ₹1
            // -----------------------------------------

            if (!name) {

                return res.status(400).json({
                    success: false,
                    message: "Name is required"
                });

            }

            if (!mobile) {

                return res.status(400).json({
                    success: false,
                    message: "Mobile number is required"
                });

            }

            if (
                !Number.isInteger(amount) ||
                amount < 1 ||
                amount > 10000000
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Donation amount must be between ₹1 and ₹1,00,00,000"
                });

            }


            // -----------------------------------------
            // CREATE DONATION
            // -----------------------------------------

            const donation =
                await Donation.create({

                    userId: req.user.uid,

                    name: name,

                    mobile: mobile,

                    amount: amount,

                    purpose: purpose,

                    status: "pending"

                });


            // -----------------------------------------
            // UPI PAYMENT LINK
            // -----------------------------------------

            const note =
                `TOT Donation ${donation._id}`;


            const upiLink =
                `upi://pay` +
                `?pa=${encodeURIComponent(config.id)}` +
                `&pn=${encodeURIComponent(config.name)}` +
                `&am=${amount}` +
                `&cu=INR` +
                `&tn=${encodeURIComponent(note)}`;


            // -----------------------------------------
            // GENERATE QR
            // -----------------------------------------

            const qrCode =
                await QRCode.toDataURL(
                    upiLink,
                    {
                        errorCorrectionLevel: "M",
                        margin: 2,
                        width: 320
                    }
                );


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            return res.status(201).json({

                success: true,

                message:
                    "UPI payment details created",

                data: {

                    donationId:
                        donation._id,

                    upiId:
                        config.id,

                    payeeName:
                        config.name,

                    upiLink:
                        upiLink,

                    qrCode:
                        qrCode,

                    amount:
                        amount,

                    status:
                        donation.status

                }

            });

        } catch (error) {

            console.error(
                "UPI Intent Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to create UPI payment"

            });

        }

    }
);


// =====================================================
// SUBMIT UTR
// =====================================================

router.post(
    "/payments/upi-utr",
    requireAuth,
    async (req, res) => {

        try {

            const utr =
                String(
                    req.body.utr || ""
                ).trim();


            const donationId =
                req.body.donationId;


            // -----------------------------------------
            // VALIDATE UTR
            // -----------------------------------------

            if (!/^\d{6,30}$/.test(utr)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid UTR number"

                });

            }


            if (!donationId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Donation ID is required"

                });

            }


            // -----------------------------------------
            // FIND DONATION
            // -----------------------------------------

            const donation =
                await Donation.findOneAndUpdate(

                    {
                        _id: donationId,

                        userId: req.user.uid,

                        status: "pending"
                    },

                    {
                        utr: utr
                    },

                    {
                        new: true
                    }

                );


            if (!donation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Pending donation not found"

                });

            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            return res.json({

                success: true,

                message:
                    "UTR submitted. Admin verification is pending.",

                data:
                    donation

            });

        } catch (error) {

            console.error(
                "UTR Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Failed to submit UTR"

            });

        }

    }
);


// =====================================================
// MY DONATIONS
// =====================================================

router.get(
    "/my-donations",
    requireAuth,
    async (req, res) => {

        try {

            const donations =
                await Donation.find({

                    userId:
                        req.user.uid

                })
                .sort({
                    createdAt: -1
                })
                .lean();


            return res.json({

                success: true,

                data:
                    donations

            });

        } catch (error) {

            console.error(
                "My Donations Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;