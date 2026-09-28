const app = require("./app");
const { connectToDatabase } = require("./database");

module.exports = async function vercelHandler(req, res) {
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error("Vercel API initialization failed:", error);
        return res.status(503).json({
            success: false,
            message: "The API is temporarily unavailable"
        });
    }
};
