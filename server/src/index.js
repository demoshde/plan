import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import convoyRoutes from './routes/convoyRoutes.js';
import dispatchRoutes from './routes/dispatchRoutes.js';
import planRoutes from './routes/planRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// API Routes
app.use('/api/convoys', convoyRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/shifts', shiftRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OT Mining Logistics API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
