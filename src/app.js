const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'E-Commerce API is running',
        status: 'success'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        statusCode: 404,
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

module.exports = app;
