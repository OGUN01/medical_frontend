import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import medicineRoutes from './routes/medicine.js';
import notificationRoutes from './routes/notification.js';
import { setupCronJobs } from './services/cronService.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startNotificationScheduler } from './schedulers/notificationScheduler.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/medicines', medicineRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  setupCronJobs(); // Start cron jobs for expiry checks
  startNotificationScheduler();
});

// Handle shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
