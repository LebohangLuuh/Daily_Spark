import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Routers
import contentRouter from './src/routes/content.js';
import healthRouter from './src/routes/health.js';

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:4200')
  .split(',')
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests or same-origin
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS not allowed from origin: ${origin}`));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health route should not depend on DB
app.use('/api/health', healthRouter);

// API routes
app.use('/api/content', contentRouter);

// Database connection with robust error handling
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is not set. Starting server without DB connection.');
      return false;
    }

    const maskedUri = process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@');
    console.log('Attempting MongoDB connection to:', maskedUri);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log('MongoDB connected');
    try {
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB ping successful');
    } catch (e) {
      console.warn('MongoDB ping failed but connection established:', e?.message || e);
    }

    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error?.message || error);
    return false;
  }
};

const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.warn('Continuing to start HTTP server without DB. DB-dependent endpoints may fail.');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Server ready at http://localhost:${PORT}`);
  });
};

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(0);
});
