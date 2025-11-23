import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Employees from './pages/Employees';
import Suppliers from './pages/Suppliers';
import Finances from './pages/Finances';
import ExcelBrowser from './pages/ExcelBrowser';
import LowStock from './pages/LowStock';
import StickerGenerator from './pages/StickerGenerator';
import Charts from './pages/Charts';
import Items from './pages/Items';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#007AFF', // iOS blue
      light: '#5AC8FA',
      dark: '#0051D5',
    },
    secondary: {
      main: '#AF52DE', // iOS purple
      light: '#D0A5FF',
      dark: '#8E44AD',
    },
    background: {
      default: '#667eea',
      paper: 'rgba(255, 255, 255, 0.25)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '8px 16px',
          fontSize: '0.9375rem',
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(0, 118, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px 0 rgba(0, 118, 255, 0.25)',
          },
          '@media (max-width:600px)': {
            minHeight: 48,
            padding: '10px 20px',
            fontSize: '1rem',
          },
        },
        contained: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#007AFF',
          fontWeight: 600,
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#0051D5',
          },
          '&.MuiButton-colorPrimary': {
            color: '#007AFF',
            '&:hover': {
              color: '#0051D5',
            },
          },
          '&.MuiButton-colorSecondary': {
            color: '#AF52DE',
            '&:hover': {
              color: '#8E44AD',
            },
          },
        },
        outlined: {
          border: '1.5px solid rgba(255, 255, 255, 0.6)',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          color: 'rgba(255, 255, 255, 0.95)',
          fontWeight: 600,
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.25)',
            border: '1.5px solid rgba(255, 255, 255, 0.8)',
            color: 'rgba(255, 255, 255, 1)',
          },
        },
        text: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: 600,
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'rgba(255, 255, 255, 1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        },
        elevation1: {
          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
        },
        elevation2: {
          boxShadow: '0 6px 20px 0 rgba(31, 38, 135, 0.12)',
        },
        elevation3: {
          boxShadow: '0 8px 24px 0 rgba(31, 38, 135, 0.15)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
          color: 'rgba(0, 0, 0, 0.7)',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: 'rgba(0, 0, 0, 0.9)',
            transform: 'scale(1.05)',
          },
          '@media (max-width:600px)': {
            minWidth: 48,
            minHeight: 48,
          },
        },
        colorPrimary: {
          color: '#007AFF',
          '&:hover': {
            background: 'rgba(0, 122, 255, 0.2)',
            color: '#0051D5',
          },
        },
        colorSecondary: {
          color: '#AF52DE',
          '&:hover': {
            background: 'rgba(175, 82, 222, 0.2)',
            color: '#8E44AD',
          },
        },
        colorError: {
          color: '#FF3B30',
          '&:hover': {
            background: 'rgba(255, 59, 48, 0.2)',
            color: '#D70015',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          margin: { xs: 8, sm: 32 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          maxWidth: { xs: 'calc(100% - 16px)', sm: 600 },
          background: 'rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '20px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.2) !important',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: 'rgba(255, 255, 255, 0.25) !important',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontSize: '1rem',
            color: 'rgba(0, 0, 0, 0.87)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            },
            '&.Mui-focused': {
              background: 'rgba(255, 255, 255, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
            },
            '& input': {
              color: 'rgba(0, 0, 0, 0.87)',
              '&::placeholder': {
                color: 'rgba(0, 0, 0, 0.5)',
                opacity: 1,
              },
            },
            '& textarea': {
              color: 'rgba(0, 0, 0, 0.87)',
            },
            '@media (max-width:600px)': {
              fontSize: '16px',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(0, 0, 0, 0.7)',
            '&.Mui-focused': {
              color: 'rgba(0, 0, 0, 0.9)',
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          '& .MuiInputAdornment-root': {
            color: 'rgba(0, 0, 0, 0.6)',
            '& .MuiSvgIcon-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: { xs: '8px 4px', sm: '16px' },
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        head: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          margin: '4px 8px',
          transition: 'all 0.2s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          },
          '&.Mui-selected': {
            background: 'rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.35)',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: { xs: '8px 4px', sm: '16px' },
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'rgba(0, 0, 0, 0.87)',
        },
        head: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          color: 'rgba(0, 0, 0, 0.87)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'rgba(0, 0, 0, 0.87)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-focused': {
            background: 'rgba(255, 255, 255, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
          },
          '& .MuiSelect-select': {
            color: 'rgba(0, 0, 0, 0.87)',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: 'rgba(0, 0, 0, 0.7)',
            '&.Mui-focused': {
              color: 'rgba(0, 0, 0, 0.9)',
            },
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: 'rgba(0, 0, 0, 0.87)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
          },
          '&.Mui-selected': {
            background: 'rgba(0, 122, 255, 0.2)',
            color: '#007AFF',
            '&:hover': {
              background: 'rgba(0, 122, 255, 0.3)',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-checked': {
            color: '#007AFF',
          },
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          },
          '&.Mui-selected': {
            background: 'rgba(255, 255, 255, 0.4)',
            color: '#007AFF',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          },
        },
      },
    },
  },
  typography: {
    h4: {
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
          '@keyframes gradientShift': {
            '0%': {
              backgroundPosition: '0% 50%',
            },
            '50%': {
              backgroundPosition: '100% 50%',
            },
            '100%': {
              backgroundPosition: '0% 50%',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
          },
        }}
      />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/excel-browser" element={<ExcelBrowser />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/stickers" element={<StickerGenerator />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/items" element={<Items />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
