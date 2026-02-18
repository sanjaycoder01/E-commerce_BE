const serverless = require('serverless-http');
const connectDB = require('../src/db');
const app = require('../src/app');

// Create handler once (important for performance)
const handler = serverless(app);

module.exports = async (req, res) => {
  await connectDB();
  return handler(req, res);
};
