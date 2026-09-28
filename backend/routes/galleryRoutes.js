const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const GalleryImage = require("../models/GalleryImage");
const { getFirebaseStorageBucket } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads", "gallery");
const useCloudStorage = Boolean(process.env.VERCEL || process.env.FIREBASE_STORAGE_BUCKET);

if (!useCloudStorage) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = useCloudStorage
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, callback) => {
            const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
            callback(null, `${crypto.randomUUID()}${extension}`);
        }
    });

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
    }
});

router.post("/gallery", requireAuth, upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "A JPG, PNG, or WebP image is required"
        });
    }

    try {
        let filePath;

        if (useCloudStorage) {
            if (!process.env.FIREBASE_STORAGE_BUCKET) {
                return res.status(503).json({
                    success: false,
                    message: "FIREBASE_STORAGE_BUCKET is not configured"
                });
            }

            const bucket = getFirebaseStorageBucket();
            const extension = path.extname(req.file.originalname).toLowerCase() || ".jpg";
            const objectPath = `gallery/${crypto.randomUUID()}${extension}`;
            const downloadToken = crypto.randomUUID();

            await bucket.file(objectPath).save(req.file.buffer, {
                metadata: {
                    contentType: req.file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            filePath = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${downloadToken}`;
        } else {
            filePath = `/uploads/gallery/${req.file.filename}`;
        }

        const image = await GalleryImage.create({
            uploaderId: req.user.uid,
            uploaderName: req.user.name || req.user.email || "Devotee",
            originalName: req.file.originalname,
            filePath
        });

        return res.status(201).json({
            success: true,
            message: "Image submitted for admin approval",
            data: image
        });
    } catch (error) {
        console.error("Gallery image upload failed:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to upload gallery image"
        });
    }
});

module.exports = router;
