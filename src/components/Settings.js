import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

function Settings() {
  const [settings, setSettings] = useState({
    email: '',
    enableEmailNotifications: true,
    enablePushNotifications: false,
    notificationTime: '09:00',
    enableMonthlyNotifications: true,
    enableWeeklyNotifications: true,
    enableDailyNotifications: true
  });

  const [notificationHistory, setNotificationHistory] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Load save state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('settingsSaveState');
    const savedTime = localStorage.getItem('settingsSaveTime');
    
    if (savedState && savedTime) {
      const timeDiff = Date.now() - parseInt(savedTime);
      if (timeDiff < 3000) {
        setSaveState(savedState);
        // Set up the remaining time for the state to reset
        const remainingTime = 3000 - timeDiff;
        setTimeout(() => {
          setSaveState('idle');
          localStorage.removeItem('settingsSaveState');
          localStorage.removeItem('settingsSaveTime');
        }, remainingTime);
      } else {
        localStorage.removeItem('settingsSaveState');
        localStorage.removeItem('settingsSaveTime');
      }
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications/settings');
      // Ensure we update all settings fields
      setSettings(prevSettings => ({
        ...prevSettings,
        ...response.data,
        email: response.data.email || '',
        enableEmailNotifications: response.data.enableEmailNotifications ?? true,
        enablePushNotifications: response.data.enablePushNotifications ?? false,
        notificationTime: response.data.notificationTime || '09:00',
        enableMonthlyNotifications: response.data.enableMonthlyNotifications ?? true,
        enableWeeklyNotifications: response.data.enableWeeklyNotifications ?? true,
        enableDailyNotifications: response.data.enableDailyNotifications ?? true
      }));
    } catch (err) {
      setError('Failed to fetch settings');
      console.error('Error:', err);
    }
  }, []);

  const fetchNotificationHistory = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications/history');
      setNotificationHistory(response.data);
    } catch (err) {
      setError('Failed to fetch notification history');
      console.error('Error:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchNotificationHistory();
  }, [fetchSettings, fetchNotificationHistory]);

  const handleSettingChange = (name) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset save button state when settings change
    setSaveState('idle');
  };

  const handleTimeChange = (newTime) => {
    setSettings(prev => ({
      ...prev,
      notificationTime: dayjs(newTime).format('HH:mm')
    }));
    // Reset save button state when time changes
    setSaveState('idle');
  };

  const handleSubmit = async () => {
    try {
      setSaveState('saving');
      localStorage.setItem('settingsSaveState', 'saving');
      localStorage.setItem('settingsSaveTime', Date.now().toString());

      await api.post('/api/notifications/settings', settings);
      
      // Fetch the latest settings to ensure UI is in sync
      await fetchSettings();
      
      setSuccess(true);
      setError(null);
      setSaveState('saved');
      localStorage.setItem('settingsSaveState', 'saved');
      localStorage.setItem('settingsSaveTime', Date.now().toString());
      
      const timer = setTimeout(() => {
        setSuccess(false);
        setSaveState('idle');
        localStorage.removeItem('settingsSaveState');
        localStorage.removeItem('settingsSaveTime');
      }, 3000);

      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to update settings');
      console.error('Error:', err);
      setSaveState('idle');
      localStorage.removeItem('settingsSaveState');
      localStorage.removeItem('settingsSaveTime');
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });
        
        await api.post('/api/notifications/subscribe', subscription);
        setSettings(prev => ({ ...prev, enablePushNotifications: true }));
        setSuccess('Push notifications enabled successfully');
      }
    } catch (err) {
      setError('Failed to enable push notifications');
      console.error('Error:', err);
    }
  };

  // Helper function to format notification type for mobile
  const formatNotificationType = (type) => {
    switch(type) {
      case 'DAILY': return 'Daily';
      case 'WEEKLY': return 'Weekly';
      case 'MONTHLY': return 'Monthly';
      default: return type;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    return status === 'success' ? 'success' : 'error';
  };

  return (
    <Box sx={{ 
      pb: isMobile ? 4 : 0,
      px: isMobile ? 2 : 0 
    }}>
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        gutterBottom
        sx={{ mb: 3 }}
      >
        Notification Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings updated successfully!
        </Alert>
      )}

      <Card 
        sx={{ 
          mb: 4,
          boxShadow: isMobile ? 1 : 3
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom 
            sx={{ fontWeight: 'bold' }}
          >
            Email Notifications
          </Typography>
          <Box sx={{ mb: isMobile ? 4 : 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={handleSettingChange('email')}
              sx={{ 
                mb: 2,
                '& .MuiInputBase-root': {
                  height: isMobile ? '48px' : '56px'
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableEmailNotifications}
                  onChange={handleSettingChange('enableEmailNotifications')}
                  sx={isMobile ? {
                    '& .MuiSwitch-switchBase': {
                      padding: '8px',
                    }
                  } : {}}
                />
              }
              label="Enable Email Notifications"
              sx={{ 
                '& .MuiFormControlLabel-label': {
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }
              }}
            />
          </Box>

          <Divider sx={{ my: isMobile ? 3 : 2 }} />

          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Push Notifications
          </Typography>
          <Box sx={{ mb: isMobile ? 4 : 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enablePushNotifications}
                  onChange={handleSettingChange('enablePushNotifications')}
                  sx={isMobile ? {
                    '& .MuiSwitch-switchBase': {
                      padding: '8px',
                    }
                  } : {}}
                />
              }
              label="Enable Push Notifications"
              sx={{ 
                '& .MuiFormControlLabel-label': {
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }
              }}
            />
            {!settings.enablePushNotifications && (
              <Button
                variant="outlined"
                onClick={requestPushPermission}
                sx={{ 
                  ml: 2,
                  height: isMobile ? '36px' : '40px',
                  fontSize: isMobile ? '0.875rem' : '0.9rem'
                }}
              >
                Enable Browser Notifications
              </Button>
            )}
          </Box>

          <Divider sx={{ my: isMobile ? 3 : 2 }} />

          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Notification Schedule
          </Typography>
          <Box sx={{ mb: isMobile ? 4 : 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Notification Time"
                value={dayjs(`2024-01-01T${settings.notificationTime}`)}
                onChange={handleTimeChange}
                sx={{ 
                  mb: 3,
                  width: '100%',
                  '& .MuiInputBase-root': {
                    height: isMobile ? '48px' : '56px'
                  }
                }}
              />
            </LocalizationProvider>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? 2 : 1 
            }}>
              {[
                {
                  key: 'enableDailyNotifications',
                  label: 'Daily Notifications (for medicines expiring tomorrow)'
                },
                {
                  key: 'enableWeeklyNotifications',
                  label: 'Weekly Notifications (for medicines expiring this week)'
                },
                {
                  key: 'enableMonthlyNotifications',
                  label: 'Monthly Notifications (for medicines expiring this month)'
                }
              ].map(({ key, label }) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={settings[key]}
                      onChange={handleSettingChange(key)}
                      sx={isMobile ? {
                        '& .MuiSwitch-switchBase': {
                          padding: '8px',
                        }
                      } : {}}
                    />
                  }
                  label={label}
                  sx={{ 
                    '& .MuiFormControlLabel-label': {
                      fontSize: isMobile ? '0.9rem' : '1rem'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmit}
            fullWidth={isMobile}
            disabled={saveState === 'saving'}
            sx={{ 
              mt: 2,
              height: isMobile ? '48px' : '40px',
              fontSize: isMobile ? '1rem' : '0.9rem',
              bgcolor: saveState === 'saved' ? 'success.main' : 
                      saveState === 'saving' ? 'grey.400' : 'primary.main',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: saveState === 'saved' ? 'success.dark' : 
                        saveState === 'saving' ? 'grey.500' : 'primary.dark',
              },
              '&:disabled': {
                bgcolor: 'grey.400',
                cursor: 'not-allowed'
              }
            }}
          >
            {saveState === 'saving' ? 'Saving...' : 
             saveState === 'saved' ? 'Saved!' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        gutterBottom 
        sx={{ 
          mt: 4,
          mb: 2,
          fontWeight: isMobile ? 'medium' : 'regular'
        }}
      >
        Notification History
      </Typography>
      
      <Box sx={{ 
        position: 'relative',
        height: isMobile ? 'calc(100vh - 800px)' : '400px',
        minHeight: '200px',
        overflow: 'hidden'
      }}>
        <TableContainer 
          component={Paper} 
          sx={{ 
            height: '100%',
            overflow: 'auto',
            boxShadow: isMobile ? 1 : 3,
            '& .MuiTableCell-root': isMobile ? {
              padding: '12px 8px',
              fontSize: '0.875rem',
              whiteSpace: 'nowrap'
            } : {},
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '4px'
            }
          }}
        >
          <Table stickyHeader size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {!isMobile && (
                  <TableCell>Medicine</TableCell>
                )}
                <TableCell>Type</TableCell>
                {!isMobile && (
                  <>
                    <TableCell>Channel</TableCell>
                    <TableCell>Email</TableCell>
                  </>
                )}
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notificationHistory.map((notification) => (
                <TableRow
                  key={notification.id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    cursor: 'pointer'
                  }}
                >
                  <TableCell>
                    <Box>
                      {isMobile 
                        ? new Date(notification.sentAt).toLocaleDateString()
                        : new Date(notification.sentAt).toLocaleString()
                      }
                      {isMobile && (
                        <Typography 
                          variant="caption" 
                          display="block" 
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {notification.medicine.name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {!isMobile && <TableCell>{notification.medicine.name}</TableCell>}
                  <TableCell>
                    <Box>
                      <Chip
                        label={formatNotificationType(notification.type)}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontSize: isMobile ? '0.75rem' : '0.875rem',
                          height: isMobile ? '24px' : '32px',
                        }}
                      />
                      {isMobile && (
                        <Typography 
                          variant="caption" 
                          display="block" 
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {notification.channel}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>{notification.channel}</TableCell>
                      <TableCell>{notification.email || '-'}</TableCell>
                    </>
                  )}
                  <TableCell>
                    <Chip
                      label={notification.status}
                      color={getStatusColor(notification.status)}
                      size="small"
                      sx={{
                        fontSize: isMobile ? '0.75rem' : '0.875rem',
                        height: isMobile ? '24px' : '32px',
                        minWidth: '70px'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {notificationHistory.length === 0 && (
                <TableRow>
                  <TableCell 
                    colSpan={isMobile ? 3 : 6} 
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography color="text.secondary">
                      No notification history available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}

export default Settings; 