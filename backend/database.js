const mongoose = require("mongoose");

let connectionPromise;

function connectToDatabase() {
    const readyState = mongoose.connection.readyState;
    if (readyState === 1) {
        return Promise.resolve(mongoose.connection);
    }

    if (readyState === 2 && connectionPromise) {
        return connectionPromise;
    }

    if (readyState === 3) {
        return Promise.reject(new Error("MongoDB connection is shutting down"));
    }

    if (!process.env.MONGO_URI) {
        return Promise.reject(new Error("MONGO_URI is not configured"));
    }

    connectionPromise = mongoose.connect(process.env.MONGO_URI).then(
        () => mongoose.connection,
        (error) => {
            connectionPromise = undefined;
            throw error;
        }
    );
    return connectionPromise;
}

module.exports = { connectToDatabase };
