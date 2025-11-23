import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TableChartIcon from '@mui/icons-material/TableChart';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BarChartIcon from '@mui/icons-material/BarChart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory' },
  { text: 'Items', icon: <Inventory2Icon />, path: '/items' },
  { text: 'Sales', icon: <PointOfSaleIcon />, path: '/sales' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders' },
  { text: 'Clients', icon: <BusinessCenterIcon />, path: '/clients' },
  { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { text: 'Suppliers', icon: <BusinessIcon />, path: '/suppliers' },
  { text: 'Income/Expense', icon: <AccountBalanceIcon />, path: '/finances' },
  { text: 'Charts', icon: <BarChartIcon />, path: '/charts' },
  { text: 'Excel Browser', icon: <TableChartIcon />, path: '/excel-browser' },
  { text: 'Sticker Generator', icon: <LocalOfferIcon />, path: '/stickers' },
];

// Mobile-friendly drawer width
const mobileDrawerWidth = 280;

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.95)',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          TrackApp
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                minHeight: { xs: 56, sm: 48 }, // Touch-friendly height on mobile
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 48, sm: 40 } }}>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: { xs: '0.95rem', sm: '0.875rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          ml: { xs: 0, sm: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'rgba(255, 255, 255, 0.2) !important',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              minWidth: 48,
              minHeight: 48,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div"
            sx={{ 
              fontSize: { xs: '0.9rem', sm: '1.25rem' },
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: { xs: 'calc(100vw - 100px)', sm: 'none' },
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            Store Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { xs: 0, sm: drawerWidth }, 
          flexShrink: { xs: 0, sm: 0 },
          display: { xs: 'none', sm: 'block' },
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: mobileDrawerWidth,
              maxWidth: '85vw',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          background: 'transparent',
          maxWidth: { xs: '100vw', sm: 'none' },
          overflowX: 'hidden',
          position: 'relative',
        }}
      >
        <Toolbar />
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
