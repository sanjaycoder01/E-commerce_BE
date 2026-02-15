const mongoose = require('mongoose');
const config = require('./config');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
    if (!config.mongoUri) {
        throw new Error('MONGO_URI is not defined');
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(config.mongoUri, {
            bufferCommands: false
        }).then((mongooseInstance) => mongooseInstance);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectDB;
