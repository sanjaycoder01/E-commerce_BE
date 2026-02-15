const serverless = require('serverless-http');
const connectDB = require('../src/db');
const app = require('../src/app');

const serverlessHandler = serverless(app);

module.exports = async (req, res) => {
    await connectDB();
    return serverlessHandler(req, res);
};
