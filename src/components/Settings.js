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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/api/notifications/settings');
      setSettings(response.data);
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
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
  };

  const handleTimeChange = (newTime) => {
    setSettings(prev => ({
      ...prev,
      notificationTime: dayjs(newTime).format('HH:mm')
    }));
  };

  const handleSubmit = async () => {
    try {
      await api.post('/api/notifications/settings', settings);
      setSuccess(true);
      setError(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update settings');
      console.error('Error:', err);
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

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
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

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Email Notifications
          </Typography>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={handleSettingChange('email')}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableEmailNotifications}
                  onChange={handleSettingChange('enableEmailNotifications')}
                />
              }
              label="Enable Email Notifications"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Push Notifications
          </Typography>
          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enablePushNotifications}
                  onChange={handleSettingChange('enablePushNotifications')}
                />
              }
              label="Enable Push Notifications"
            />
            {!settings.enablePushNotifications && (
              <Button
                variant="outlined"
                onClick={requestPushPermission}
                sx={{ ml: 2 }}
              >
                Enable Browser Notifications
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Notification Schedule
          </Typography>
          <Box sx={{ mb: 3 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <TimePicker
                label="Notification Time"
                value={dayjs(`2024-01-01T${settings.notificationTime}`)}
                onChange={handleTimeChange}
                sx={{ mb: 2, width: '100%' }}
              />
            </LocalizationProvider>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableDailyNotifications}
                    onChange={handleSettingChange('enableDailyNotifications')}
                  />
                }
                label="Daily Notifications (for medicines expiring tomorrow)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableWeeklyNotifications}
                    onChange={handleSettingChange('enableWeeklyNotifications')}
                  />
                }
                label="Weekly Notifications (for medicines expiring this week)"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableMonthlyNotifications}
                    onChange={handleSettingChange('enableMonthlyNotifications')}
                  />
                }
                label="Monthly Notifications (for medicines expiring this month)"
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{ mt: 2 }}
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Notification History
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Medicine</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notificationHistory.map((notification) => (
              <TableRow key={notification.id}>
                <TableCell>
                  {new Date(notification.sentAt).toLocaleString()}
                </TableCell>
                <TableCell>{notification.medicine.name}</TableCell>
                <TableCell>{notification.type}</TableCell>
                <TableCell>{notification.channel}</TableCell>
                <TableCell>
                  <Typography
                    color={notification.status === 'success' ? 'success.main' : 'error.main'}
                  >
                    {notification.status}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Settings; 