import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import emailService from './emailService.js';

const prisma = new PrismaClient();

export const setupCronJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await checkExpiringMedicines();
    } catch (error) {
      console.error('Error in cron job:', error);
    }
  });
};

async function checkExpiringMedicines() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + 7); // 7 days from now

  try {
    const expiringMedicines = await prisma.medicine.findMany({
      where: {
        expiryDate: {
          lte: thresholdDate
        },
        notified: false
      }
    });

    if (expiringMedicines.length > 0) {
      await emailService.sendExpiryNotification(expiringMedicines);

      // Update medicines as notified
      await prisma.medicine.updateMany({
        where: {
          id: {
            in: expiringMedicines.map(med => med.id)
          }
        },
        data: {
          notified: true
        }
      });
    }
  } catch (error) {
    console.error('Error checking expiring medicines:', error);
    throw error;
  }
}
