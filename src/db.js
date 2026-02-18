const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log("MONGODB_URI value:", process.env.MONGODB_URI);
  
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
