const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("../firebase-service-account.json");

initializeApp({
    credential: cert(serviceAccount)
});

const uid = "0nRiqgyX1mUCE6Vt2Np1jTMwZO93";

async function makeAdmin() {
    try {
        await getAuth().setCustomUserClaims(uid, {
            admin: true
        });

        console.log("✅ Admin role assigned successfully");

    } catch (error) {
        console.error("❌ Error:", error);
    }
}

makeAdmin();