const path = require('path');
const dotenv = require('dotenv');

// Load .env from src directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  ...require('./database'),
  jwt: require('./jwt'),
  cors: require('./cors'),
  server: require('./server'),
  razorpay: require('./razorpay'),
  // Convenience exports for backward compatibility
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '20h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
