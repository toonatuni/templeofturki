const app = require("./app");
const { connectToDatabase } = require("./database");

function runExpress(req, res) {
    return new Promise((resolve, reject) => {
        const finish = () => {
            res.off("finish", finish);
            res.off("close", finish);
            resolve();
        };

        res.once("finish", finish);
        res.once("close", finish);

        try {
            app(req, res);
        } catch (error) {
            res.off("finish", finish);
            res.off("close", finish);
            reject(error);
        }
    });
}

function requiresDatabase(req) {
    const pathname = new URL(req.url, "http://localhost").pathname;
    return pathname !== "/api/test" &&
        pathname !== "/api/payments/upi-config";
}

module.exports = async function vercelHandler(req, res) {
    try {
        if (requiresDatabase(req)) {
            await connectToDatabase();
        }
        await runExpress(req, res);
    } catch (error) {
        console.error("Vercel API initialization failed:", error.code || error.name);
        if (res.headersSent || res.writableEnded) {
            return;
        }
        return res.status(503).json({
            success: false,
            message: "The API is temporarily unavailable"
        });
    }
};
