const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB (optional - server will start even if connection fails)
if (process.env.MONGODB_URI) {
    mongoose
        .connect(process.env.MONGODB_URI)
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
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

