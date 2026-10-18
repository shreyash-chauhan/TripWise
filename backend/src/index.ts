import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, db } from './db/database.js';
import placesRoutes from './routes/placesRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';

dotenv.config();

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all during development and recruitment review
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/places', placesRoutes);
app.use('/api/itinerary', itineraryRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  try {
    const row = db.prepare('SELECT count(*) as count FROM itinerary').get() as { count: number };
    res.json({
      status: 'healthy',
      app: 'TripWise API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'connected',
      savedItineraryCount: row.count,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'degraded',
      error: error.message
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[TripWise Server Error]:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 TripWise Backend running at http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Places API:  http://localhost:${PORT}/api/places`);
  console.log(`🗺️ Itinerary:   http://localhost:${PORT}/api/itinerary`);
  console.log(`===============================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[TripWise Backend] Closing database & server...');
  db.close();
  server.close(() => {
    console.log('[TripWise Backend] Exited gracefully.');
    process.exit(0);
  });
});

export default app;
