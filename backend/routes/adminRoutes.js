const express = require("express");

const Donation = require("../models/Donation");

const {
    requireAuth,
    requireAdmin
} = require("../middleware/auth");


const router = express.Router();


// =====================================================
// ADMIN SECURITY
// =====================================================
//
// Pehle Firebase user verify hoga.
//
// Uske baad check hoga ki user ADMIN_UIDS
// me मौजूद hai ya nahi.
//
// Iske baad hi neeche wali admin APIs access hongi.
//

router.use(requireAuth);

router.use(requireAdmin);



// =====================================================
// GET ALL DONATIONS
// =====================================================
//
// GET:
// /api/admin/donations
//

router.get(
    "/donations",

    async (req, res) => {

        try {

            const donations =
                await Donation
                    .find()
                    .sort({
                        createdAt: -1
                    })
                    .lean();


            return res.json({

                success: true,

                count:
                    donations.length,

                data:
                    donations

            });

        } catch (error) {

            console.error(
                "Admin Donations Error:",
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
// GET SINGLE DONATION
// =====================================================
//
// GET:
// /api/admin/donations/:id
//

router.get(
    "/donations/:id",

    async (req, res) => {

        try {

            const donation =
                await Donation
                    .findById(
                        req.params.id
                    )
                    .lean();


            if (!donation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Donation not found"

                });

            }


            return res.json({

                success: true,

                data:
                    donation

            });

        } catch (error) {

            console.error(
                "Get Donation Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load donation"

            });

        }

    }
);




// =====================================================
// UPDATE DONATION STATUS
// =====================================================
//
// PATCH:
// /api/admin/donations/:id
//
// Allowed status:
//
// pending
// paid
// failed
//

router.patch(
    "/donations/:id",

    async (req, res) => {

        try {

            const status =
                String(
                    req.body.status || ""
                )
                    .trim()
                    .toLowerCase();


            // ==========================================
            // VALIDATE STATUS
            // ==========================================

            const allowedStatus = [

                "pending",

                "paid",

                "failed"

            ];


            if (
                !allowedStatus.includes(
                    status
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment status"

                });

            }



            // ==========================================
            // UPDATE DATA
            // ==========================================

            const updateData = {

                status:
                    status

            };


            // Agar payment paid hai

            if (
                status === "paid"
            ) {

                updateData.paidAt =
                    new Date();

            }


            // Agar pending ya failed hai

            if (
                status === "pending" ||
                status === "failed"
            ) {

                updateData.paidAt =
                    null;

            }



            // ==========================================
            // UPDATE DATABASE
            // ==========================================

            const donation =
                await Donation
                    .findByIdAndUpdate(

                        req.params.id,

                        updateData,

                        {
                            new: true,
                            runValidators: true
                        }

                    );


            if (!donation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Donation not found"

                });

            }


            return res.json({

                success: true,

                message:
                    "Donation status updated successfully",

                data:
                    donation

            });

        } catch (error) {

            console.error(
                "Update Donation Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to update donation"

            });

        }

    }
);




// =====================================================
// DELETE DONATION
// =====================================================
//
// DELETE:
// /api/admin/donations/:id
//
// WARNING:
// Ye donation permanently delete karega.
//

router.delete(
    "/donations/:id",

    async (req, res) => {

        try {

            const donation =
                await Donation
                    .findByIdAndDelete(
                        req.params.id
                    );


            if (!donation) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Donation not found"

                });

            }


            return res.json({

                success: true,

                message:
                    "Donation deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete Donation Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to delete donation"

            });

        }

    }
);




// =====================================================
// ADMIN INFORMATION
// =====================================================
//
// GET:
// /api/admin/profile
//

router.get(
    "/profile",

    async (req, res) => {

        try {

            return res.json({

                success: true,

                message:
                    "Admin authenticated successfully",

                admin: {

                    uid:
                        req.user.uid,

                    email:
                        req.user.email || null,

                    name:
                        req.user.name || null,

                    isAdmin:
                        true

                }

            });

        } catch (error) {

            console.error(
                "Admin Profile Error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load admin profile"

            });

        }

    }
);




// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;