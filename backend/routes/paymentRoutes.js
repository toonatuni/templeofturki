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
        id: String(process.env.UPI_ID || "").trim(),

        name: String(
            process.env.UPI_PAYEE_NAME || "TOT - Temple of Turki"
        ).trim()
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
            message: "Failed to load UPI configuration"
        });

    }

});


// =====================================================
// CREATE DONATION + UPI QR
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


            // =========================================
            // UPI CONFIG
            // =========================================

            const config = getUpiConfig();

            if (!config.id) {

                return res.status(503).json({
                    success: false,
                    message: "UPI_ID is not configured in .env"
                });

            }


            // =========================================
            // VALIDATION
            // =========================================

            if (!name) {

                return res.status(400).json({
                    success: false,
                    message: "Donor name is required"
                });

            }


            if (!mobile) {

                return res.status(400).json({
                    success: false,
                    message: "Mobile number is required"
                });

            }


            if (!/^[0-9]{10}$/.test(mobile)) {

                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid 10 digit mobile number"
                });

            }


            if (
                !Number.isFinite(amount) ||
                amount < 1 ||
                amount > 10000000
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Donation amount must be valid"
                });

            }


            // =========================================
            // CREATE DONATION
            // =========================================

            const donation = await Donation.create({

                userId: req.user.uid,

                name: name,

                mobile: mobile,

                amount: amount,

                purpose: purpose,

                status: "pending"

            });


            // =========================================
            // CREATE UPI NOTE
            // =========================================

            const note =
                `TOT Donation ${donation._id}`;


            // =========================================
            // UPI PAYMENT LINK
            // =========================================

            const upiLink =
                `upi://pay` +
                `?pa=${encodeURIComponent(config.id)}` +
                `&pn=${encodeURIComponent(config.name)}` +
                `&am=${amount}` +
                `&cu=INR` +
                `&tn=${encodeURIComponent(note)}`;


            // =========================================
            // GENERATE QR CODE
            // =========================================

            const qrCode =
                await QRCode.toDataURL(
                    upiLink,
                    {
                        errorCorrectionLevel: "M",
                        margin: 2,
                        width: 320
                    }
                );


            // =========================================
            // RESPONSE
            // =========================================

            return res.status(201).json({

                success: true,

                message:
                    "Donation created successfully",

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
                        donation.amount,

                    status:
                        donation.status,

                    createdAt:
                        donation.createdAt

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
                    "Failed to create donation"

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
                    "Failed to load donations"

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;