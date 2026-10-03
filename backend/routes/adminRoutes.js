const express = require("express");

const Donation = require("../models/Donation");
const Booking = require("../models/Booking");
const Announcement = require("../models/announcement");
const GalleryImage = require("../models/GalleryImage");
const Event = require("../models/Event");
const { getAuth } = require("firebase-admin/auth");
const { getFirebaseAdmin, getFirebaseStorageBucket } = require("../firebaseAdmin");
const { isValidName, isValidMobileNumber, normalizeName } = require("../validation/inputValidation");
const fs = require("fs/promises");
const path = require("path");

const {
    requireAuth,
    requireAdmin
} = require("../middleware/auth");


const router = express.Router();

function getConfiguredAdminUids() {
    return String(process.env.ADMIN_UIDS || "")
        .split(",")
        .map((uid) => uid.trim())
        .filter(Boolean);
}

function getFirebaseAuth() {
    return getAuth(getFirebaseAdmin());
}

async function getAllFirebaseUsers() {
    const users = [];
    let pageToken;

    do {
        const page = await getFirebaseAuth().listUsers(1000, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
    } while (pageToken);

    return users;
}

async function getFirebaseUsersByUid(uids) {
    const users = [];
    const uniqueUids = [...new Set(uids.filter(isValidFirebaseUid))];
    for (let index = 0; index < uniqueUids.length; index += 100) {
        const result = await getFirebaseAuth().getUsers(
            uniqueUids.slice(index, index + 100).map((uid) => ({ uid }))
        );
        users.push(...result.users);
    }
    return new Map(users.map((user) => [user.uid, user]));
}

function isValidObjectId(value) {
    return /^[a-f\d]{24}$/i.test(value);
}

function isValidFirebaseUid(value) {
    return typeof value === "string" && value.length > 0 && value.length <= 128;
}


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
            const firebaseUsers = await getFirebaseUsersByUid(
                donations.map((donation) => donation.userId)
            );
            const donationRecords = donations.map((donation) => ({
                ...donation,
                email: firebaseUsers.get(donation.userId)?.email || ""
            }));


            return res.json({

                success: true,

                count:
                    donationRecords.length,

                data:
                    donationRecords

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
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation ID"
                });
            }

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

            const firebaseUsers = await getFirebaseUsersByUid([donation.userId]);

            return res.json({

                success: true,

                data:
                    {
                        ...donation,
                        email: firebaseUsers.get(donation.userId)?.email || ""
                    }

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
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation ID"
                });
            }

            const status =
                String(
                    req.body?.status || ""
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

            const donationRecord = await Donation.findById(req.params.id);
            if (!donationRecord) {
                return res.status(404).json({
                    success: false,
                    message: "Donation not found"
                });
            }

            if (status === "paid" && !donationRecord.utr) {
                return res.status(409).json({
                    success: false,
                    message: "A submitted UTR is required before manual payment verification"
                });
            }

            const verifiedAt = status === "paid" ? new Date() : null;
            const updateData = {

                status,
                verifiedBy: status === "paid" ? req.user.uid : null,
                verifiedAt

            };


            // Agar payment paid hai

            if (
                status === "paid"
            ) {

                updateData.paidAt =
                    verifiedAt;

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
                error.code || error.name
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
            if (!isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid donation ID"
                });
            }

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


router.get("/overview", async (req, res) => {
    try {
        const [users, donations, announcements, gallery, events, bookings] = await Promise.all([
            getAllFirebaseUsers(),
            Donation.find().sort({ createdAt: -1 }).lean(),
            Announcement.countDocuments(),
            GalleryImage.find().select("status").lean(),
            Event.countDocuments(),
            Booking.countDocuments()
        ]);

        const paidDonations = donations.filter((donation) => donation.status === "paid");
        const pendingDonations = donations.filter((donation) => donation.status === "pending");
        const pendingGallery = gallery.filter((image) => image.status === "pending");
        const usersByUid = new Map(users.map((user) => [user.uid, user]));

        return res.json({
            success: true,
            data: {
                totalUsers: users.length,
                totalDonations: donations.length,
                totalDonationAmount: donations.reduce(
                    (total, donation) => total + Number(donation.amount || 0),
                    0
                ),
                verifiedDonationAmount: paidDonations.reduce(
                    (total, donation) => total + Number(donation.amount || 0),
                    0
                ),
                pendingDonations: pendingDonations.length,
                verifiedDonations: paidDonations.length,
                totalAnnouncements: announcements,
                totalGalleryItems: gallery.length,
                totalEvents: events,
                totalBookings: bookings,
                pendingGalleryItems: pendingGallery.length,
                recentDonations: donations.slice(0, 8).map((donation) => ({
                    ...donation,
                    email: usersByUid.get(donation.userId)?.email || ""
                })),
                recentUsers: users
                    .sort((first, second) =>
                        String(second.metadata.creationTime || "")
                            .localeCompare(String(first.metadata.creationTime || ""))
                    )
                    .slice(0, 8)
                    .map((user) => ({
                        uid: user.uid,
                        displayName: user.displayName || "",
                        email: user.email || "",
                        creationTime: user.metadata.creationTime || null
                    }))
            }
        });
    } catch (error) {
        console.error("Admin overview failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load dashboard overview"
        });
    }
});

router.get("/users", async (req, res) => {
    try {
        const users = await getAllFirebaseUsers();
        const search = String(req.query.search || "").trim().toLowerCase();
        const status = String(req.query.status || "all");
        const sort = String(req.query.sort || "newest");
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
        const sortFields = {
            name: (user) => user.displayName || user.email || user.uid,
            email: (user) => user.email || "",
            newest: (user) => user.metadata.creationTime || "",
            lastLogin: (user) => user.metadata.lastSignInTime || ""
        };
        if (!["all", "active", "blocked"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid account status filter" });
        }
        if (!Object.prototype.hasOwnProperty.call(sortFields, sort)) {
            return res.status(400).json({ success: false, message: "Invalid user sort field" });
        }

        const filteredUsers = users.filter((user) => {
            const matchesStatus = status === "all" ||
                (status === "blocked" ? user.disabled : !user.disabled);
            const searchable = [
                user.uid,
                user.displayName,
                user.email,
                user.phoneNumber
            ].filter(Boolean).join(" ").toLowerCase();
            return matchesStatus && (!search || searchable.includes(search));
        });
        const sortValue = sortFields[sort];
        filteredUsers.sort((first, second) =>
            sort === "name" || sort === "email"
                ? String(sortValue(first)).localeCompare(String(sortValue(second)))
                : String(sortValue(second)).localeCompare(String(sortValue(first)))
        );

        const pageUsers = filteredUsers.slice((page - 1) * limit, page * limit);
        const uids = pageUsers.map((user) => user.uid);
        const [donationTotals, donationCounts] = uids.length
            ? await Promise.all([
                Donation.aggregate([
                    { $match: { userId: { $in: uids } } },
                    { $group: { _id: "$userId", total: { $sum: "$amount" } } }
                ]),
                Donation.aggregate([
                    { $match: { userId: { $in: uids } } },
                    { $group: { _id: "$userId", count: { $sum: 1 } } }
                ])
            ])
            : [[], []];
        const totalsByUid = new Map(donationTotals.map((entry) => [entry._id, entry.total]));
        const countsByUid = new Map(donationCounts.map((entry) => [entry._id, entry.count]));

        return res.json({
            success: true,
            data: pageUsers.map((user) => ({
                uid: user.uid,
                displayName: user.displayName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                photoURL: user.photoURL || "",
                emailVerified: user.emailVerified,
                disabled: user.disabled,
                customClaims: user.customClaims || {},
                creationTime: user.metadata.creationTime || null,
                lastSignInTime: user.metadata.lastSignInTime || null,
                totalDonations: countsByUid.get(user.uid) || 0,
                donationAmount: totalsByUid.get(user.uid) || 0
            })),
            pagination: {
                page,
                limit,
                total: filteredUsers.length,
                pages: Math.ceil(filteredUsers.length / limit)
            }
        });
    } catch (error) {
        console.error("Admin user list failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load registered users"
        });
    }
});

router.get("/users/:uid", async (req, res) => {
    if (!isValidFirebaseUid(req.params.uid)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    try {
        const [user, donations, bookings] = await Promise.all([
            getFirebaseAuth().getUser(req.params.uid),
            Donation.find({ userId: req.params.uid }).sort({ createdAt: -1 }).lean(),
            Booking.find({ userId: req.params.uid }).sort({ createdAt: -1 }).lean()
        ]);

        return res.json({
            success: true,
            data: {
                uid: user.uid,
                displayName: user.displayName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                photoURL: user.photoURL || "",
                emailVerified: user.emailVerified,
                disabled: user.disabled,
                customClaims: user.customClaims || {},
                providerData: user.providerData,
                creationTime: user.metadata.creationTime || null,
                lastSignInTime: user.metadata.lastSignInTime || null,
                donations,
                bookings
            }
        });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        console.error("Admin user details failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load user details"
        });
    }
});

router.patch("/users/:uid", async (req, res) => {
    const uid = req.params.uid;
    if (!isValidFirebaseUid(uid)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (getConfiguredAdminUids().includes(uid)) {
        return res.status(403).json({
            success: false,
            message: "Configured admin accounts cannot be modified here"
        });
    }

    const update = {};
    for (const field of ["displayName", "email", "phoneNumber"]) {
        if (req.body[field] !== undefined) {
            if (field === "displayName") {
                const displayName = normalizeName(req.body[field]);
                if (!isValidName(displayName)) {
                    return res.status(400).json({
                        success: false,
                        message: "Enter a name using English or Hindi letters and spaces only"
                    });
                }
                update.displayName = displayName;
                continue;
            }
            if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-empty string`
                });
            }
            if (field === "phoneNumber" && !isValidMobileNumber(req.body[field].trim())) {
                return res.status(400).json({
                    success: false,
                    message: "Phone number must contain exactly 10 digits"
                });
            }
            update[field] = field === "phoneNumber"
                ? `+91${req.body[field].trim()}`
                : req.body[field].trim();
        }
    }
    if (req.body.disabled !== undefined) {
        if (typeof req.body.disabled !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "disabled must be a boolean"
            });
        }
        update.disabled = req.body.disabled;
    }
    if (!Object.keys(update).length) {
        return res.status(400).json({
            success: false,
            message: "No supported user changes were supplied"
        });
    }

    try {
        const user = await getFirebaseAuth().updateUser(uid, update);
        if (update.disabled === true) {
            await getFirebaseAuth().revokeRefreshTokens(uid);
        }
        return res.json({
            success: true,
            data: {
                uid: user.uid,
                displayName: user.displayName || "",
                email: user.email || "",
                phoneNumber: user.phoneNumber || "",
                disabled: user.disabled
            }
        });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (error.code && error.code.startsWith("auth/invalid-")) {
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error("Admin user update failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update user"
        });
    }
});

router.delete("/users/:uid", async (req, res) => {
    const uid = req.params.uid;
    if (!isValidFirebaseUid(uid)) {
        return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (getConfiguredAdminUids().includes(uid)) {
        return res.status(403).json({
            success: false,
            message: "Configured admin accounts cannot be deleted"
        });
    }

    try {
        await getFirebaseAuth().deleteUser(uid);
        return res.json({
            success: true,
            message: "Firebase account deleted; associated donation and booking records were retained."
        });
    } catch (error) {
        if (error.code === "auth/user-not-found") {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        console.error("Admin user deletion failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete Firebase user"
        });
    }
});

router.get("/gallery", async (req, res) => {
    try {
        const gallery = await GalleryImage.find().sort({ createdAt: -1 }).lean();
        return res.json({ success: true, data: gallery });
    } catch (error) {
        console.error("Admin gallery list failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load gallery"
        });
    }
});

router.patch("/gallery/:id", async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid gallery ID" });
    }

    const update = {};
    if (req.body.status !== undefined) {
        if (!["pending", "approved", "rejected"].includes(req.body.status)) {
            return res.status(400).json({ success: false, message: "Invalid gallery status" });
        }
        update.status = req.body.status;
    }
    if (req.body.category !== undefined) {
        if (typeof req.body.category !== "string" || !req.body.category.trim()) {
            return res.status(400).json({ success: false, message: "Category is required" });
        }
        update.category = req.body.category.trim();
    }
    if (!Object.keys(update).length) {
        return res.status(400).json({ success: false, message: "No gallery changes were supplied" });
    }

    try {
        const image = await GalleryImage.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true, runValidators: true }
        );
        if (!image) {
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }
        return res.json({ success: true, data: image });
    } catch (error) {
        console.error("Gallery update failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update gallery image"
        });
    }
});

router.delete("/gallery/:id", async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid gallery ID" });
    }

    try {
        const image = await GalleryImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ success: false, message: "Gallery image not found" });
        }

        if (image.filePath.startsWith("/uploads/gallery/")) {
            const uploadRoot = path.resolve(__dirname, "..", "uploads", "gallery");
            const localPath = path.resolve(
                uploadRoot,
                path.basename(image.filePath)
            );
            if (localPath.startsWith(uploadRoot + path.sep)) {
                await fs.rm(localPath, { force: true });
            }
        } else if (image.filePath.includes("firebasestorage.googleapis.com")) {
            const objectPath = new URL(image.filePath).pathname.split("/o/")[1];
            if (objectPath) {
                await getFirebaseStorageBucket()
                    .file(decodeURIComponent(objectPath))
                    .delete({ ignoreNotFound: true });
            }
        }

        await image.deleteOne();
        return res.json({ success: true, message: "Gallery image deleted" });
    } catch (error) {
        console.error("Gallery deletion failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete gallery image"
        });
    }
});


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