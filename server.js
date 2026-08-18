require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const donationRoutes = require("./routes/donationRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend Files (HTML, CSS, JS, Images)
app.use(express.static(__dirname));

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

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ MongoDB Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});