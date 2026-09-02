require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const donationRoutes = require("./routes/donationRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const publicRoutes = require("./routes/publicRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(
    helmet({
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        },
        contentSecurityPolicy: false
    })
);
app.use(express.json());
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));

// Serve Frontend Files (HTML, CSS, JS, Images)
app.use(express.static(__dirname));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Home Page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Test API
app.get("/api/test", (req, res) => {
    res.send("API Test Working");
});

// Donation API
app.use("/api", donationRoutes);
app.use("/api", announcementRoutes);
app.use("/api", publicRoutes);
app.use("/api", paymentRoutes);
app.use("/api", galleryRoutes);
app.use("/api/admin", adminRoutes);
    

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.log(" MongoDB Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server running at http://localhost:${PORT}`);
});