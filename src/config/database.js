/**
 * Database configuration
 */
module.exports = {
  uri: process.env.MONGODB_URI,
  options: {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  },
};
