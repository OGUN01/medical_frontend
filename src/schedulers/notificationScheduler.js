import cron from 'node-cron';
import { NotificationService } from '../services/notificationService.js';

// Run every minute to check if notifications need to be sent
// The NotificationService will check the preferred notification time
export const startNotificationScheduler = () => {
  console.log('Starting notification scheduler...');
  
  cron.schedule('* * * * *', async () => {
    try {
      await NotificationService.checkAndSendNotifications();
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  });
}; 