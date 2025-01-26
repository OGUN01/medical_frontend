import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './components/Dashboard';
import AddMedicine from './components/AddMedicine';
import Settings from './components/Settings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#007bff',
      light: '#4dabf5'
    },
    divider: '#e0e0e0'
  },
  shape: {
    borderRadius: 8
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add" element={<AddMedicine />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
