const mongoose = require("mongoose");

const galleryImageSchema = new mongoose.Schema({
    uploaderId: { type: String, required: true, index: true },
    uploaderName: { type: String, default: "Devotee" },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    category: { type: String, default: "General", trim: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GalleryImage", galleryImageSchema);
