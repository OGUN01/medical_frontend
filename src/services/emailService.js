import nodemailer from 'nodemailer';
import { formatExpiryDate } from '../utils/dateUtils.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  async sendExpiryNotification(medicines) {
    if (!medicines || medicines.length === 0) return;

    const emailContent = this.generateExpiryEmailContent(medicines);

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Sending to the same email for now
      subject: 'Medicine Expiry Alert',
      html: emailContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Expiry notification email sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send expiry notification email:', error);
      throw error;
    }
  }

  generateExpiryEmailContent(medicines) {
    const medicineList = medicines
      .map(medicine => `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;">${medicine.name}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${formatExpiryDate(medicine.expiryDate)}</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${medicine.quantity}</td>
        </tr>
      `)
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d9534f;">Medicine Expiry Alert</h2>
        <p>The following medicines are expiring soon:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd;">Medicine Name</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Expiry Date</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${medicineList}
          </tbody>
        </table>
        
        <p style="margin-top: 20px; color: #666;">
          Please take necessary action for these medicines.
        </p>
      </div>
    `;
  }
}

export default new EmailService();
