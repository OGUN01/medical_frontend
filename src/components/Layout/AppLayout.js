import React from 'react';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AddCircle as AddIcon,
  Settings as SettingsIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

function AppLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path === '/add') return 1;
    if (path === '/settings') return 2;
    return 0;
  };

  const handleNavigation = (newValue) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/add');
        break;
      case 2:
        navigate('/settings');
        break;
      default:
        navigate('/');
    }
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="primary"
            sx={{ mr: 2 }}
            onClick={() => navigate('/')}
          >
            <HospitalIcon />
          </IconButton>
          <Typography variant="h6" color="text.primary" sx={{ flexGrow: 1 }}>
            Medicine Expiry Tracker
          </Typography>

          {!isMobile && (
            <Stack direction="row" spacing={2}>
              <Button
                color="primary"
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/')}
                variant={isCurrentPath('/') ? 'contained' : 'text'}
              >
                Dashboard
              </Button>
              <Button
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/add')}
                variant={isCurrentPath('/add') ? 'contained' : 'text'}
              >
                Add Medicine
              </Button>
              <Button
                color="primary"
                startIcon={<SettingsIcon />}
                onClick={() => navigate('/settings')}
                variant={isCurrentPath('/settings') ? 'contained' : 'text'}
              >
                Settings
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, sm: 9 },
          pb: { xs: 7, sm: 3 },
          px: { xs: 2, sm: 3 },
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      {isMobile && (
        <Paper 
          sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} 
          elevation={3}
        >
          <BottomNavigation
            value={getCurrentValue()}
            onChange={(event, newValue) => handleNavigation(newValue)}
            showLabels
          >
            <BottomNavigationAction 
              label="Dashboard" 
              icon={<DashboardIcon />} 
            />
            <BottomNavigationAction 
              label="Add" 
              icon={<AddIcon />} 
            />
            <BottomNavigationAction 
              label="Settings" 
              icon={<SettingsIcon />} 
            />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}

export default AppLayout; 