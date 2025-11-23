import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  PointOfSale as SalesIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../services/api';

const formatCurrency = (value) => {
  const numberValue = Number(value ?? 0);
  if (Number.isNaN(numberValue)) {
    return '₪0.00';
  }

  return `₪${numberValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value) => {
  const numberValue = Number(value ?? 0);
  if (Number.isNaN(numberValue)) {
    return '0';
  }

  return numberValue.toLocaleString();
};

const SectionCard = ({ title, description, icon, color = 'primary', stats = [], onClick }) => {
  const handleKeyDown = (event) => {
    if (!onClick) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Paper
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      sx={{
        p: { xs: 2, sm: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 1.5, sm: 2 },
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        minHeight: { xs: 140, sm: 'auto' },
        '&:hover': onClick
          ? {
              transform: { xs: 'none', sm: 'translateY(-6px) scale(1.02)' },
              boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
              background: 'rgba(255, 255, 255, 0.35)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
            }
          : {},
        '&:focus-visible': onClick
          ? {
              boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.6)',
            }
          : {},
        '&:active': onClick ? { transform: 'scale(0.98)' } : {},
      }}
    >
      <Box display="flex" alignItems="center" gap={{ xs: 1.5, sm: 2 }}>
        <Box
          sx={{
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
            color: (theme) => theme.palette[color]?.main ?? theme.palette.primary.main,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' },
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={{ xs: 1, sm: 1.5 }} mt={{ xs: 0.5, sm: 1 }}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ gap: 1 }}
          >
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {stat.label}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: (theme) =>
                  stat.highlight
                    ? theme.palette[stat.highlight]?.main ?? theme.palette.text.primary
                    : theme.palette.text.primary,
                textAlign: 'right',
                wordBreak: 'break-word',
              }}
            >
              {stat.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await reportsAPI.getDashboard();
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        px: { xs: 0, sm: 2 },
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.5rem', sm: '2.125rem' },
          fontWeight: 600,
          px: { xs: 1, sm: 0 },
        }}
      >
        Dashboard
      </Typography>
      <Grid container spacing={{ xs: 1.5, sm: 3 }} sx={{ width: '100%', mx: 0 }}>
        <Grid item xs={12} sm={6} md={6}>
          <SectionCard
            title="Sales"
            description="Monitor revenue trends and daily performance."
            color="success"
            icon={<SalesIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />}
            onClick={() => navigate('/sales')}
            stats={[
              {
                label: "Today's Sales",
                value: formatCurrency(stats?.todaySales),
              },
              {
                label: 'Monthly Sales',
                value: formatCurrency(stats?.monthlySales),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <SectionCard
            title="Suppliers"
            description="Review purchasing partners and relationships."
            color="info"
            icon={<BusinessIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />}
            onClick={() => navigate('/suppliers')}
            stats={[
              {
                label: 'Total Suppliers',
                value: formatNumber(stats?.totalSuppliers),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <SectionCard
            title="Employees"
            description="Track staff activity and availability."
            color="secondary"
            icon={<PeopleIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />}
            onClick={() => navigate('/employees')}
            stats={[
              {
                label: 'Active Employees',
                value: formatNumber(stats?.activeEmployees),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <SectionCard
            title="Products & Inventory"
            description="Jump to inventory for detailed stock control."
            color="primary"
            icon={<InventoryIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />}
            onClick={() => navigate('/inventory')}
            stats={[
              {
                label: 'Total Products',
                value: formatNumber(stats?.totalProducts),
              },
              {
                label: 'Low Stock Items',
                value: formatNumber(stats?.lowStockItems),
                highlight: stats?.lowStockItems > 0 ? 'warning' : 'success',
              },
              {
                label: 'Inventory Value',
                value: formatCurrency(stats?.inventoryValue),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <SectionCard
            title="Finances"
            description="Track income, expenses, and cash flow."
            color="warning"
            icon={<AccountBalanceIcon sx={{ fontSize: { xs: 28, sm: 30 } }} />}
            onClick={() => navigate('/finances')}
            stats={[
              {
                label: 'Total Income',
                value: formatCurrency(stats?.totalIncome),
              },
              {
                label: 'Total Expenses',
                value: formatCurrency(stats?.totalExpenses),
              },
              {
                label: 'Net Amount',
                value: formatCurrency(stats?.netAmount),
                highlight: (stats?.netAmount ?? 0) >= 0 ? 'success' : 'error',
              },
            ]}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
