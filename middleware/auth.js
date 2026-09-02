const { verifyIdToken } = require("../firebaseAdmin");

function getBearerToken(req) {
    const header = req.get("authorization") || "";
    return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function requireAuth(req, res, next) {
    const token = getBearerToken(req);
    if (!token) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        req.user = await verifyIdToken(token);
        next();
    } catch (error) {
        console.error("Auth verification failed:", error.message);

        if (error.message && error.message.includes("FIREBASE_SERVICE_ACCOUNT_JSON")) {
            return res.status(500).json({
                success: false,
                message: "Server Firebase auth is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON in .env."
            });
        }

        return res.status(401).json({ success: false, message: "Invalid or expired login" });
    }
}

function requireAdmin(req, res, next) {
    const adminUids = (process.env.ADMIN_UIDS || "")
        .split(",")
        .map(uid => uid.trim())
        .filter(Boolean);

    if (!req.user || !adminUids.includes(req.user.uid)) {
        return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.user.isAdmin = true;
    next();
}

module.exports = { requireAuth, requireAdmin };
