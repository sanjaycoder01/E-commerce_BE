const serverless = require('serverless-http');
const mongoose = require('mongoose');
const config = require('../src/config');
const app = require('../src/app');

if (config.mongoUri) {
    mongoose.connect(config.mongoUri)
        .then(() => console.log('MongoDB Connected'))
        .catch((err) => console.warn('MongoDB connection error:', err.message));
}

module.exports = serverless(app);
