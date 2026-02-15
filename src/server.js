const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config");

const { port, mongoUri } = config;

// Connect to MongoDB (optional - server will start even if connection fails)
if (mongoUri) {
    console.log("Connecting to MongoDB", mongoUri);
    mongoose
        .connect(mongoUri)
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

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

