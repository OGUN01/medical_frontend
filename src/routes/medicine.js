import express from 'express';
import { MedicineService } from '../services/medicineService.js';
import multer from 'multer';

const router = express.Router();
const upload = multer();

// Get all medicines
router.get('/', async (req, res, next) => {
  try {
    const medicines = await MedicineService.getMedicines();
    res.json(medicines);
  } catch (error) {
    next(error);
  }
});

// Add medicine manually
router.post('/', async (req, res, next) => {
  try {
    const medicine = await MedicineService.addMedicine(req.body);
    res.status(201).json(medicine);
  } catch (error) {
    next(error);
  }
});

// Extract medicine info from image
router.post('/extract', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Please upload a JPEG or PNG image.' });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const medicineInfo = await MedicineService.extractMedicineInfo(imageBase64);

    // Convert date format if needed
    if (medicineInfo.expiryDate) {
      const date = new Date(medicineInfo.expiryDate);
      if (!isNaN(date.getTime())) {
        medicineInfo.expiryDate = date.toISOString().split('T')[0];
      }
    }

    res.json(medicineInfo);
  } catch (error) {
    console.error('Image processing error:', error);
    next(error);
  }
});

// Get expiring medicines
router.get('/expiring', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const medicines = await MedicineService.getExpiringMedicines(days);
    res.json(medicines);
  } catch (error) {
    next(error);
  }
});

// Delete medicine
router.delete('/:id', async (req, res, next) => {
  try {
    await MedicineService.deleteMedicine(parseInt(req.params.id));
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
