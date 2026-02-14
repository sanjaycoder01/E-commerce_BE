const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
// Connect to MongoDB (optional - server will start even if connection fails)
if (MONGO_URI) {
    console.log("Connecting to MongoDB", MONGO_URI);
    mongoose
        .connect(MONGO_URI)
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((error) => {
            console.warn("MongoDB connection error:", error.message);
            console.warn("Server will continue without MongoDB connection");
        });
} else {
    console.warn("MONGO_URI not set. Server running without database connection.");
}

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

