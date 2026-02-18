const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config");

const mongouri=process.env.MONGODB_URI;

// Connect to MongoDB (optional - server will start even if connection fails)
if (mongouri) {
    console.log("Connecting to MongoDB", mongouri);
    mongoose
        .connect(mongouri)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((error) => {
            console.warn("MongoDB connection error:", error.message);
            console.warn("Server will continue without MongoDB connection");
        });
} else {
    console.warn("MONGODB_URI not set. Server running without database connection.");
}

