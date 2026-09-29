const express = require("express");
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
const publicDirectory = path.join(__dirname, "..", "public");
const allowedOrigins = new Set(
    String(process.env.FRONTEND_ORIGINS || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
);

function isLocalDevelopmentOrigin(origin) {
    try {
        const parsedOrigin = new URL(origin);
        return parsedOrigin.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(parsedOrigin.hostname);
    } catch {
        return false;
    }
}

app.use(cors({
    origin: (origin, callback) => {
        callback(null, !origin || allowedOrigins.has(origin) || isLocalDevelopmentOrigin(origin));
    }
}));
app.use(
    helmet({
        crossOriginOpenerPolicy: {
            policy: "same-origin-allow-popups"
        },
        crossOriginResourcePolicy: {
            policy: "cross-origin"
        },
        contentSecurityPolicy: false
    })
);
app.use(express.json());
app.use(
    "/api",
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 300,
        standardHeaders: "draft-8",
        legacyHeaders: false
    })
);

app.use(express.static(publicDirectory));

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDirectory, "index.html"));
});

app.get("/api/test", (req, res) => {
    res.send("API Test Working");
});

app.use("/api", donationRoutes);
app.use("/api", announcementRoutes);
app.use("/api", publicRoutes);
app.use("/api", paymentRoutes);
app.use("/api", galleryRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
