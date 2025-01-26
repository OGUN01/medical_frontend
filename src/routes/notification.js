import express from 'express';
import emailService from '../services/emailService.js';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Test notifications immediately
router.post('/test', async (req, res, next) => {
  try {
    // Create a test medicine that expires soon
    const testMedicine = await prisma.medicine.create({
      data: {
        name: "Test Medicine",
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires tomorrow
        quantity: 1,
        batchNumber: "TEST-123",
        notified: false
      }
    });

    // Force check notifications
    await NotificationService.checkAndSendNotifications(true); // true to force immediate check
    
    res.json({ message: 'Test notifications sent successfully' });
  } catch (error) {
    next(error);
  }
});

// Get notification settings
router.get('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.notificationSettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    next(error);
  }
});

// Update notification settings
router.post('/settings', async (req, res, next) => {
  try {
    const settings = await prisma.notificationSettings.upsert({
      where: { id: 1 },
      update: req.body,
      create: {
        ...req.body,
        id: 1
      }
    });
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res, next) => {
  try {
    const subscription = req.body;
    const settings = await prisma.notificationSettings.upsert({
      where: { id: 1 },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enablePushNotifications: true
      },
      create: {
        id: 1,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        enablePushNotifications: true
      }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get notification history
router.get('/history', async (req, res, next) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      include: {
        medicine: true
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 50 // Limit to last 50 notifications
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
