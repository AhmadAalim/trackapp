import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import Finances from './pages/Finances';
import ExcelBrowser from './pages/ExcelBrowser';
import LowStock from './pages/LowStock';
import StickerGenerator from './pages/StickerGenerator';
import Charts from './pages/Charts';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/excel-browser" element={<ExcelBrowser />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/stickers" element={<StickerGenerator />} />
            <Route path="/charts" element={<Charts />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
