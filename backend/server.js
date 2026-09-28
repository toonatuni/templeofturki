require("dotenv").config();

const app = require("./app");
const { connectToDatabase } = require("./database");

const PORT = process.env.PORT || 5000;

connectToDatabase()
    .then(() => {
        console.log("MongoDB Connected");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    })
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    });
