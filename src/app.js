const express = require('express');
const cors = require('cors');
const app = express();

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : [])
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
// Routes
const authRoutes = require('./routes/auth.routes');
app.use('/auth', authRoutes);
const productRoutes = require('./routes/products.route');
app.use('/products', productRoutes);
const cartRoutes = require('./routes/cart.routes');
app.use('/cart', cartRoutes);
const orderRoutes = require('./routes/order.routes');
app.use('/orders', orderRoutes);
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
app.get("/ping", (req, res) => {
    res.json({ status: "Server running" });
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
