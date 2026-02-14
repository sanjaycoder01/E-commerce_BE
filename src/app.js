const express = require('express');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: 'E-Commerce API is running',
        status: 'success'
    });
});

// Error handler (must be after routes, before 404)
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal server error'
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
