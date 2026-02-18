/**
 * Database connection with caching for serverless environments (Vercel).
 * Reuses the connection across warm invocations; resets on failure so the
 * next request can retry rather than getting stuck on a rejected promise.
 */
const mongoose = require('mongoose');

// Disable command buffering globally - fail fast instead of hanging
mongoose.set('bufferCommands', false);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Return existing connection
  if (cached.conn) {
    return cached.conn;
  }

  // Start a new connection if one isn't in progress
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      })
      .then((mongooseInstance) => {
        console.log('MongoDB connected');
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request can attempt a fresh connection
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
