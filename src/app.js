const express = require('express');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./db');

const app = express();

// CORS setup
const { allowedOrigins, credentials, methods, allowedHeaders } = config.cors;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now
      }
    },
    credentials,
    methods,
    allowedHeaders,
  })
);

app.use(express.urlencoded({ extended: true }));

// Razorpay webhook must receive raw body for signature verification — register before express.json()
const webhookHandler = [
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      return res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
  },
  require('./controllers/payment.controller').webhook,
];
app.post('/payment/webhook', webhookHandler);
app.post('/api/payment/webhook', webhookHandler);

app.use(express.json());

// Health check routes — no DB needed
app.get('/', (req, res) => {
  res.json({ message: 'E-Commerce API is running', status: 'success' });
});

app.get('/ping', (req, res) => {
  res.json({ status: 'Server running' });
});

// DB connection middleware — applied only to routes that need it
app.use(['/auth', '/products', '/cart', '/orders', '/payment', '/api/chat'], async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please try again later.',
    });
  }
});

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/products', require('./routes/products.route'));
app.use('/cart', require('./routes/cart.routes'));
app.use('/orders', require('./routes/order.routes'));
app.use('/payment', require('./routes/payment.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

// Error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

// 404 handler (MUST be last)
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

module.exports = app;
