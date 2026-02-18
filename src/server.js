/**
 * Server entry point - loads config, connects to DB, starts Express server
 */
const mongoose = require('mongoose');
const config = require('./config');
const app = require('./app');

const { uri: mongouri, options } = config;
const { port } = config.server;

// Connect to MongoDB (optional - server will start even if connection fails)
if (mongouri) {
  mongoose
    .connect(mongouri, options)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.warn('MongoDB connection error:', error.message);
      console.warn('Server will continue without MongoDB connection');
    });
} else {
  console.warn('MONGODB_URI not set. Server running without database connection.');
}

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port} (${config.server.env})`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    mongoose.connection.close().then(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
