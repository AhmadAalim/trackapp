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
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 3,
        border: '1px solid',
        borderColor: (theme) => theme.palette.divider,
        transition: 'all 0.2s ease-in-out',
        outline: 'none',
        '&:hover': (theme) =>
          onClick
            ? {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                borderColor: theme.palette[color]?.main ?? theme.palette.primary.main,
              }
            : {},
        '&:focus-visible': (theme) =>
          onClick
            ? {
                boxShadow: 6,
                borderColor: theme.palette[color]?.main ?? theme.palette.primary.main,
              }
            : {},
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: (theme) => theme.palette[color]?.light ?? theme.palette.primary.light,
            color: (theme) => theme.palette[color]?.dark ?? theme.palette.primary.dark,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={1.5} mt={1}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: (theme) =>
                  stat.highlight
                    ? theme.palette[stat.highlight]?.main ?? theme.palette.text.primary
                    : theme.palette.text.primary,
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
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Sales"
            description="Monitor revenue trends and daily performance."
            color="success"
            icon={<SalesIcon sx={{ fontSize: 30 }} />}
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
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Suppliers"
            description="Review purchasing partners and relationships."
            color="info"
            icon={<BusinessIcon sx={{ fontSize: 30 }} />}
            onClick={() => navigate('/suppliers')}
            stats={[
              {
                label: 'Total Suppliers',
                value: formatNumber(stats?.totalSuppliers),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Employees"
            description="Track staff activity and availability."
            color="secondary"
            icon={<PeopleIcon sx={{ fontSize: 30 }} />}
            onClick={() => navigate('/employees')}
            stats={[
              {
                label: 'Active Employees',
                value: formatNumber(stats?.activeEmployees),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Products & Inventory"
            description="Jump to inventory for detailed stock control."
            color="primary"
            icon={<InventoryIcon sx={{ fontSize: 30 }} />}
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
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Finances"
            description="Track income, expenses, and cash flow."
            color="warning"
            icon={<AccountBalanceIcon sx={{ fontSize: 30 }} />}
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
