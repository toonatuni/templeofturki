const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

let firebaseApp;

function readServiceAccountConfig() {
    const rawConfig =
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.FIREBASE_SERVICE_ACCOUNT_FILE;

    if (rawConfig) {
        if (rawConfig.trim().startsWith("{")) {
            return JSON.parse(rawConfig);
        }

        const candidatePath = rawConfig.trim();
        if (fs.existsSync(candidatePath)) {
            return JSON.parse(fs.readFileSync(candidatePath, "utf8"));
        }
    }

    const fallbackFiles = [
        "firebase-service-account.json",
        "firebase-service-account.json.json",
        "service-account.json"
    ];

    for (const fileName of fallbackFiles) {
        const filePath = path.join(__dirname, fileName);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, "utf8"));
        }
    }

    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");
}

function getFirebaseAdmin() {
    if (firebaseApp) return firebaseApp;

    const serviceAccount = readServiceAccountConfig();
    firebaseApp = admin.initializeApp({
        credential: admin.cert(serviceAccount)
    });

    return firebaseApp;
}

async function verifyIdToken(token) {
    return admin.auth(getFirebaseAdmin()).verifyIdToken(token);
}

module.exports = { getFirebaseAdmin, verifyIdToken };
