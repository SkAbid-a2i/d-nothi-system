// backend/server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { authLimiter, apiLimiter } = require('./middleware/rateLimit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const leaveRoutes = require('./routes/leaves');
const adminRoutes = require('./routes/admin');
const reportRoutes = require('./routes/reports');
const dropdownRoutes = require('./routes/dropdowns');

const { verifyToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for auth routes
app.use('/api/auth', authLimiter);

// General rate limiting
app.use('/api/', apiLimiter);

// CORS configuration - UPDATED FOR PRODUCTION
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://d-nothi-system.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Root route - ADD THIS
app.get('/', (req, res) => {
  res.json({ 
    message: 'D-Nothi Backend API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/tasks', verifyToken, taskRoutes);
app.use('/api/leaves', verifyToken, leaveRoutes);
app.use('/api/admin', verifyToken, adminRoutes);
app.use('/api/reports', verifyToken, reportRoutes);
app.use('/api/dropdowns', verifyToken, dropdownRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

// Serve frontend in production - ADD THIS
if (process.env.NODE_ENV === 'production') {
  // Serve static files from frontend build
  app.use(express.static('../frontend/build'));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});