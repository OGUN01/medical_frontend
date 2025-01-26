import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Box,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  Inventory as InventoryIcon,
  Numbers as BatchIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

function MedicineCard({ medicine, onDelete }) {
  const theme = useTheme();

  const getStatusColor = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7) {
      return theme.palette.error.main;
    } else if (daysUntilExpiry <= 30) {
      return theme.palette.warning.main;
    }
    return theme.palette.success.main;
  };

  const getStatusText = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7) {
      return 'Expiring Soon';
    } else if (daysUntilExpiry <= 30) {
      return 'Expiring This Month';
    }
    return 'Valid';
  };

  return (
    <Card
      sx={{
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3" color="text.primary" gutterBottom>
            {medicine.name}
          </Typography>
          <Chip
            label={getStatusText(medicine.expiryDate)}
            sx={{
              backgroundColor: getStatusColor(medicine.expiryDate),
              color: '#fff',
              fontWeight: 500,
            }}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Expires: {format(new Date(medicine.expiryDate), 'MMM dd, yyyy')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InventoryIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Quantity: {medicine.quantity}
            </Typography>
          </Box>

          {medicine.batchNumber && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BatchIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Batch: {medicine.batchNumber}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <IconButton
            size="small"
            onClick={() => onDelete(medicine.id)}
            sx={{
              color: theme.palette.error.main,
              '&:hover': {
                backgroundColor: theme.palette.error.light + '20',
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}

export default MedicineCard; 