import React, { useState, useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CameraAlt as CameraIcon,
  QrCode as QrIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { QrReader } from 'react-qr-reader';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const steps = ['Upload Image or Scan QR', 'Enter Details', 'Confirm'];

function AddMedicine() {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    expiryDate: '',
    quantity: '',
    batchNumber: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    setIsProcessingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('http://localhost:5000/api/medicines/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({
        ...prev,
        ...response.data,
      }));
      setActiveStep(1);
    } catch (err) {
      setError('Failed to extract information from image');
      console.error('Error:', err);
    } finally {
      setIsProcessingImage(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: false
  });

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  const handleQrScan = (data) => {
    if (data) {
      try {
        const medicineData = JSON.parse(data.text);
        setFormData(prev => ({
          ...prev,
          ...medicineData
        }));
        setIsScanning(false);
        setActiveStep(1);
      } catch (err) {
        setError('Invalid QR code format');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate required fields
      if (!formData.name || !formData.expiryDate || !formData.quantity) {
        setError('Please fill in all required fields (Name, Expiry Date, and Quantity)');
        return;
      }
    }
    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      await axios.post('http://localhost:5000/api/medicines', formData);
      setSuccess(true);
      setError(null);
      setFormData({
        name: '',
        expiryDate: '',
        quantity: '',
        batchNumber: ''
      });
      setSelectedImage(null);
      setActiveStep(0);
    } catch (err) {
      setError('Failed to add medicine');
      console.error('Error:', err);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Box
                  {...getRootProps()}
                  sx={{
                    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? theme.palette.primary.light + '10' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input {...getInputProps()} />
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drag & Drop or Click to Upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supported formats: JPEG, PNG
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    onClick={handleCameraCapture}
                  >
                    Capture Photo
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<QrIcon />}
                    onClick={() => setIsScanning(!isScanning)}
                  >
                    {isScanning ? 'Stop Scanning' : 'Scan QR Code'}
                  </Button>
                </Box>

                {isScanning && (
                  <Box sx={{ mt: 3 }}>
                    <QrReader
                      onResult={handleQrScan}
                      constraints={{ facingMode: 'environment' }}
                      style={{ width: '100%' }}
                    />
                  </Box>
                )}

                {isProcessingImage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography>Processing image...</Typography>
                  </Box>
                )}

                {selectedImage && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <img
                      src={selectedImage}
                      alt="Selected medicine"
                      style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: theme.shape.borderRadius }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Medicine Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Expiry Date"
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Batch Number"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Review Details</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography><strong>Name:</strong> {formData.name}</Typography>
                  <Typography><strong>Expiry Date:</strong> {formData.expiryDate}</Typography>
                  <Typography><strong>Quantity:</strong> {formData.quantity}</Typography>
                  <Typography><strong>Batch Number:</strong> {formData.batchNumber || 'Not specified'}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom color="text.primary">
        Add New Medicine
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Medicine added successfully!
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent(activeStep)}
        </motion.div>
      </AnimatePresence>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<BackIcon />}
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
          endIcon={activeStep === steps.length - 1 ? null : <NextIcon />}
          disabled={isProcessingImage}
        >
          {activeStep === steps.length - 1 ? 'Add Medicine' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
}

export default AddMedicine; 