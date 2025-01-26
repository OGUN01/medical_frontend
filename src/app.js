import express from 'express';
import cors from 'cors';
import medicineRoutes from './routes/medicine.js';
import notificationRoutes from './routes/notification.js';

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: err.message 
  });
});

export default app;
