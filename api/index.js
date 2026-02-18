const serverless = require('serverless-http');
const connectDB = require('../src/db');
const app = require('../src/app');

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please try again later.',
    });
  }
  return handler(req, res);
};
