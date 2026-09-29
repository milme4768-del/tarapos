const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/authRoutes');
const outletRoutes = require('./routes/outletRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or if in allowed list
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for this origin.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Compression for lightweight payloads
app.use(compression());

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Taraaang POS API',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
    errorCode: 'ROUTE_NOT_FOUND',
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
