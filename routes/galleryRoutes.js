const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const GalleryImage = require("../models/GalleryImage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads", "gallery");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype))
});

router.post("/gallery", requireAuth, upload.single("image"), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: "A JPG, PNG, or WebP image is required" });
    const extension = path.extname(req.file.originalname).toLowerCase() || ".jpg";
    const finalName = `${req.file.filename}${extension}`;
    fs.renameSync(req.file.path, path.join(uploadDir, finalName));
    const image = await GalleryImage.create({ uploaderId: req.user.uid, uploaderName: req.user.name || req.user.email || "Devotee", originalName: req.file.originalname, filePath: `/uploads/gallery/${finalName}` });
    res.status(201).json({ success: true, message: "Image submitted for admin approval", data: image });
});

module.exports = router;
