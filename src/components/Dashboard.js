import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import api from '../services/api';

function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [stats, setStats] = useState({
    expiringSoon: 0,
    expiringThisMonth: 0,
    valid: 0
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const updateStats = useCallback((medicineList) => {
    const now = new Date();
    const stats = medicineList.reduce((acc, medicine) => {
      const expiryDate = new Date(medicine.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        acc.expiringSoon++;
      } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
        acc.expiringThisMonth++;
      } else if (daysUntilExpiry > 30) {
        acc.valid++;
      }
      return acc;
    }, { expiringSoon: 0, expiringThisMonth: 0, valid: 0 });

    setStats(stats);
  }, []);

  const fetchMedicines = useCallback(async () => {
    try {
      const response = await api.get('/api/medicines');
      setMedicines(response.data);
      updateStats(response.data);
    } catch (err) {
      setError('Failed to fetch medicines');
      console.error('Error:', err);
    }
  }, [updateStats]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/medicines/${id}`);
      fetchMedicines();
    } catch (err) {
      setError('Failed to delete medicine');
      console.error('Error:', err);
    }
  };

  const getStatusChip = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return <Chip label="Expiring Soon" color="error" size="small" />;
    } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
      return <Chip label="Expiring This Month" color="warning" size="small" />;
    } else if (daysUntilExpiry > 30) {
      return <Chip label="Valid" color="success" size="small" />;
    } else {
      return <Chip label="Expired" color="error" size="small" />;
    }
  };

  const getMedicineStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return 'expiringSoon';
    } else if (daysUntilExpiry <= 30 && daysUntilExpiry > 7) {
      return 'expiringThisMonth';
    } else if (daysUntilExpiry > 30) {
      return 'valid';
    }
    return 'expired';
  };

  const handleStatusClick = (status) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? getMedicineStatus(medicine.expiryDate) === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Medicine Dashboard
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 4, 
        position: 'relative',
        flexDirection: isMobile ? 'column' : 'row' 
      }}>
        <Box sx={{ 
          position: isMobile ? 'static' : 'absolute',
          top: -40, 
          right: 0,
          mb: isMobile ? 2 : 0,
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          <Chip
            label="All"
            onClick={() => setSelectedStatus(null)}
            sx={{
              bgcolor: selectedStatus === null ? 'primary.dark' : 'primary.main',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          />
        </Box>
        <Card 
          sx={{ 
            flex: 1, 
            bgcolor: selectedStatus === 'expiringSoon' ? 'error.dark' : 'error.main', 
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'error.dark',
              transform: 'translateY(-2px)',
            }
          }}
          onClick={() => handleStatusClick('expiringSoon')}
        >
          <CardContent>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Expiring Soon: {stats.expiringSoon}
            </Typography>
          </CardContent>
        </Card>
        <Card 
          sx={{ 
            flex: 1, 
            bgcolor: selectedStatus === 'expiringThisMonth' ? 'warning.dark' : 'warning.main', 
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'warning.dark',
              transform: 'translateY(-2px)',
            }
          }}
          onClick={() => handleStatusClick('expiringThisMonth')}
        >
          <CardContent>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Expiring This Month: {stats.expiringThisMonth}
            </Typography>
          </CardContent>
        </Card>
        <Card 
          sx={{ 
            flex: 1, 
            bgcolor: selectedStatus === 'valid' ? 'success.dark' : 'success.main', 
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'success.dark',
              transform: 'translateY(-2px)',
            }
          }}
          onClick={() => handleStatusClick('valid')}
        >
          <CardContent>
            <Typography variant={isMobile ? "subtitle1" : "h6"}>
              Valid: {stats.valid}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search medicines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: isMobile ? 2 : 0 }}
        />
      </Box>

      {isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredMedicines.map((medicine) => (
            <Card key={medicine.id} sx={{ 
              width: '100%',
              '&:hover': {
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', flex: 1 }}>
                    {medicine.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(medicine.expiryDate)}
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(medicine.id)}
                      sx={{ 
                        color: 'error.main',
                        p: 0.5
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'auto 1fr',
                  gap: '4px 12px',
                  '& > .label': {
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  },
                  '& > .value': {
                    fontSize: '0.875rem'
                  }
                }}>
                  <Typography className="label">Expiry:</Typography>
                  <Typography className="value">{formatDate(medicine.expiryDate)}</Typography>
                  
                  <Typography className="label">Quantity:</Typography>
                  <Typography className="value">{medicine.quantity}</Typography>
                  
                  <Typography className="label">Batch:</Typography>
                  <Typography className="value">{medicine.batchNumber || '-'}</Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
          {filteredMedicines.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No medicines found
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            overflowX: 'auto',
            '& .MuiTable-root': {
              minWidth: 650,
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Batch Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMedicines.map((medicine) => (
                <TableRow
                  key={medicine.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {medicine.name}
                  </TableCell>
                  <TableCell>{formatDate(medicine.expiryDate)}</TableCell>
                  <TableCell>{medicine.quantity}</TableCell>
                  <TableCell>{medicine.batchNumber || '-'}</TableCell>
                  <TableCell>{getStatusChip(medicine.expiryDate)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(medicine.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filteredMedicines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No medicines found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default Dashboard; 