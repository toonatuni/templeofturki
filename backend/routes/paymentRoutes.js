const express = require("express");
const QRCode = require("qrcode");
const crypto = require("crypto");

const Donation = require("../models/Donation");
const { optionalAuth, requireAuth } = require("../middleware/auth");
const { isValidName, isValidMobileNumber, normalizeName } = require("../validation/inputValidation");

const router = express.Router();

function hashGuestAccessToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function tokensMatch(storedHash, token) {
    if (
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/.test(storedHash) ||
        typeof token !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
    ) {
        return false;
    }
    const suppliedHash = Buffer.from(hashGuestAccessToken(token), "hex");
    return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), suppliedHash);
}

function isValidDonationId(value) {
    return /^[a-f\d]{24}$/i.test(value);
}


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

    optionalAuth,

    async (req, res) => {

        try {
            const body = req.body || {};

            const amount = Number(body.amount);

            const name = String(
                body.name || ""
            ).trim();

            const mobile = String(
                body.mobile || ""
            ).trim();

            const purpose = String(
                body.purpose || "Temple Donation"
            ).trim();
            const normalizedName = normalizeName(name);
            const submissionKey = String(body.submissionKey || "").trim();
            const guestAccessToken = String(body.guestAccessToken || "").trim();


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

            if (!isValidName(normalizedName)) {

                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid donor name"
                });

            }


            if (!mobile) {

                return res.status(400).json({
                    success: false,
                    message: "Mobile number is required"
                });

            }


            if (!isValidMobileNumber(mobile)) {

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

            if (purpose.length > 160) {
                return res.status(400).json({
                    success: false,
                    message: "Donation purpose is too long"
                });
            }

            if (submissionKey && !/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionKey)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation submission identifier"
                });
            }

            const userId = req.user?.uid || null;
            if (!userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(guestAccessToken)) {
                return res.status(400).json({
                    success: false,
                    message: "A secure guest verification token is required"
                });
            }
            const guestAccessTokenHash = userId ? null : hashGuestAccessToken(guestAccessToken);


            // =========================================
            // CREATE DONATION
            // =========================================

            let donation = submissionKey
                ? await Donation.findOne({ submissionKey }).select("+guestAccessTokenHash")
                : null;
            if (donation) {
                const matchesRequest =
                    donation.name === normalizedName &&
                    donation.mobile === mobile &&
                    donation.amount === amount &&
                    donation.purpose === purpose &&
                    (donation.userId || null) === userId &&
                    (userId !== null || tokensMatch(donation.guestAccessTokenHash, guestAccessToken));
                if (!matchesRequest) {
                    return res.status(409).json({
                        success: false,
                        message: "This donation submission identifier was already used for different details"
                    });
                }
            } else {
                try {
                    donation = await Donation.create({
                        userId,
                        submissionKey: submissionKey || undefined,
                        name: normalizedName,
                        mobile,
                        amount,
                        purpose,
                        guestAccessTokenHash: guestAccessTokenHash || undefined,
                        status: "pending"
                    });
                } catch (error) {
                    if (error.code !== 11000 || !submissionKey) {
                        throw error;
                    }
                    donation = await Donation.findOne({ submissionKey }).select("+guestAccessTokenHash");
                    if (
                        !donation ||
                        donation.name !== normalizedName ||
                        donation.mobile !== mobile ||
                        donation.amount !== amount ||
                        donation.purpose !== purpose ||
                        (donation.userId || null) !== userId ||
                        (userId === null && !tokensMatch(donation.guestAccessTokenHash, guestAccessToken))
                    ) {
                        return res.status(409).json({
                            success: false,
                            message: "This donation submission identifier was already used for different details"
                        });
                    }
                }
            }


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
                error.code || error.name
            );

            return res.status(500).json({

                success: false,

                message: "Failed to create donation"

            });

        }

    }
);

router.post(
    "/payments/donations/:id/utr",
    optionalAuth,
    async (req, res) => {
        const donationId = req.params.id;
        if (!isValidDonationId(donationId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid donation ID"
            });
        }

        const utr = String(req.body?.utr || "").trim().toUpperCase();
        if (!/^[A-Z0-9]{6,32}$/.test(utr)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid UTR/reference number using 6–32 letters or digits"
            });
        }

        try {
            let query = Donation.findById(donationId).select("+guestAccessTokenHash");
            const donation = await query;
            if (!donation) {
                return res.status(404).json({
                    success: false,
                    message: "Donation not found or verification access is invalid"
                });
            }

            if (donation.userId) {
                if (!req.user || donation.userId !== req.user.uid) {
                    return res.status(404).json({
                        success: false,
                        message: "Donation not found or verification access is invalid"
                    });
                }
            } else {
                const guestAccessToken = String(req.body?.guestAccessToken || "").trim();
                if (!tokensMatch(donation.guestAccessTokenHash, guestAccessToken)) {
                    return res.status(404).json({
                        success: false,
                        message: "Donation not found or verification access is invalid"
                    });
                }
            }

            if (donation.status !== "pending") {
                return res.status(409).json({
                    success: false,
                    message: "UTR can only be submitted while the donation is pending"
                });
            }

            const updatedDonation = await Donation.findOneAndUpdate(
                { _id: donationId, status: "pending" },
                { $set: { utr, utrSubmittedAt: new Date() } },
                { new: true, runValidators: true }
            ).select("status utrSubmittedAt");

            if (!updatedDonation) {
                return res.status(409).json({
                    success: false,
                    message: "Donation status changed; reload before submitting the UTR"
                });
            }

            return res.json({
                success: true,
                message: "UTR submitted. The donation remains pending until an administrator verifies the payment.",
                data: {
                    status: updatedDonation.status,
                    utrSubmittedAt: updatedDonation.utrSubmittedAt
                }
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "This UTR/reference number has already been submitted"
                });
            }

            console.error("Donation UTR submission failed:", error.code || error.name);
            return res.status(500).json({
                success: false,
                message: "Failed to submit UTR"
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
                .select("name amount purpose status createdAt paidAt")
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