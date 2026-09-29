require("dotenv").config();

const app = require("./app");
const { connectToDatabase } = require("./database");

const PORT = process.env.PORT || 5000;

connectToDatabase()
    .then(() => {
        console.log("MongoDB Connected");
        const server = app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
        server.on("error", (error) => {
            console.error("Server failed to start:", error);
            process.exitCode = 1;
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed; server was not started:", error);
        process.exitCode = 1;
    });
