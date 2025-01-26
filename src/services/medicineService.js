import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export class MedicineService {
  static async addMedicine(medicineData) {
    // Convert the date string to ISO format with time
    const expiryDate = new Date(medicineData.expiryDate);
    expiryDate.setHours(23, 59, 59, 999); // Set to end of day

    // Convert quantity to number and handle empty batch number
    const data = {
      name: medicineData.name,
      expiryDate: expiryDate,
      quantity: parseInt(medicineData.quantity),
      batchNumber: medicineData.batchNumber || null
    };

    return prisma.medicine.create({
      data
    });
  }

  static async getMedicines() {
    return prisma.medicine.findMany({
      orderBy: {
        expiryDate: 'asc'
      }
    });
  }

  static async deleteMedicine(id) {
    // First delete related notification logs
    await prisma.notificationLog.deleteMany({
      where: {
        medicineId: id
      }
    });

    // Then delete the medicine
    return prisma.medicine.delete({
      where: {
        id: id
      }
    });
  }

  static async getExpiringMedicines(daysThreshold = 7) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

    return prisma.medicine.findMany({
      where: {
        expiryDate: {
          lte: thresholdDate
        },
        notified: false
      }
    });
  }

  static async extractMedicineInfo(imageBase64) {
    try {
      const prompt = `Analyze this medicine package image and extract the following information:
      1. Medicine Name (look for product name, brand name, or drug name)
      2. Expiry Date (look for "EXP", "Expiry", or similar indicators, convert to YYYY-MM-DD format)
      3. Batch Number (look for "Batch", "LOT", "B.No.", or similar indicators)

      Format the response as a JSON object with these exact keys:
      {
        "name": "Medicine Name",
        "expiryDate": "YYYY-MM-DD",
        "batchNumber": "BATCH123"
      }

      Rules:
      - For medicine name, include the strength/dosage if visible
      - For expiry date, convert any date format to YYYY-MM-DD
      - For batch number, include only the alphanumeric value
      - If any information is not visible or unclear, use null for that field
      - Do not include any additional fields
      - Return ONLY the JSON object, no other text`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }, {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64
                }
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API error:', error);
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      const text = result.candidates[0].content.parts[0].text;
      
      // Extract JSON from response (in case there's any extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }

      const extractedData = JSON.parse(jsonMatch[0]);

      // Validate the extracted data
      if (!extractedData.name && !extractedData.expiryDate && !extractedData.batchNumber) {
        throw new Error('No information could be extracted from the image');
      }

      return extractedData;
    } catch (error) {
      console.error('Error extracting medicine info:', error);
      throw new Error('Failed to extract medicine information from image');
    }
  }
}
