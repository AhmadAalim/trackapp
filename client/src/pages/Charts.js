import React, { useEffect, useMemo, useState } from 'react';
import { Container, Paper, Typography, Box, Grid, CircularProgress, Alert, Stack, Divider } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { salesAPI, financesAPI } from '../services/api';

const currencyFormatter = (value) => {
  const numeric = Number(value) || 0;
  return `₪${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const currencyTooltipFormatter = (value) => {
  const numeric = Number(value) || 0;
  return `₪${numeric.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
});

const CHART_COLORS = [
  '#1E88E5',
  '#43A047',
  '#FB8C00',
  '#E53935',
  '#8E24AA',
  '#00ACC1',
  '#FDD835',
  '#6D4C41',
];

const SummaryStatCard = ({ title, value, caption, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      borderRadius: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}
  >
    <Typography variant="subtitle2" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h5" sx={{ color: color || 'text.primary' }}>
      {value}
    </Typography>
    {caption ? (
      <Typography variant="body2" color="text.secondary">
        {caption}
      </Typography>
    ) : null}
  </Paper>
);

const ChartCard = ({ title, subtitle, children, hasData, emptyMessage }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      height: '100%',
      borderRadius: 2,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Divider />
      <Box sx={{ flexGrow: 1, minHeight: 260, position: 'relative' }}>
        {hasData ? (
          children
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              textAlign: 'center',
              px: 2,
            }}
          >
            <Typography variant="body2">{emptyMessage || 'No data available yet.'}</Typography>
          </Box>
        )}
      </Box>
    </Stack>
  </Paper>
);

function Charts() {
  const [sales, setSales] = useState([]);
  const [finances, setFinances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [salesResponse, financesResponse] = await Promise.all([
          salesAPI.getAll(),
          financesAPI.getAll(),
        ]);

        if (!isMounted) return;
        setSales(Array.isArray(salesResponse.data) ? salesResponse.data : []);
        setFinances(Array.isArray(financesResponse.data) ? financesResponse.data : []);
      } catch (err) {
        if (!isMounted) return;
        const message = err.response?.data?.error || err.message || 'Failed to load charts data';
        setError(message);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const salesTrendData = useMemo(() => {
    const byMonth = new Map();

    sales.forEach((sale) => {
      const dateString = sale.sale_date || sale.saleDate || sale.created_at;
      const total = Number(sale.total_amount ?? sale.totalAmount ?? 0) || 0;
      if (!dateString) return;

      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = monthLabelFormatter.format(date);

      if (!byMonth.has(key)) {
        byMonth.set(key, { key, label, sales: 0 });
      }
      byMonth.get(key).sales += total;
    });

    return Array.from(byMonth.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12);
  }, [sales]);

  const incomeExpenseByMonth = useMemo(() => {
    const byMonth = new Map();

    finances.forEach((record) => {
      const dateString = record.expense_date || record.expenseDate || record.created_at;
      const amount = Number(record.amount ?? 0) || 0;
      if (!dateString || amount <= 0) return;

      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = monthLabelFormatter.format(date);

      if (!byMonth.has(key)) {
        byMonth.set(key, { key, label, income: 0, expense: 0 });
      }

      if (record.type === 'income') {
        byMonth.get(key).income += amount;
      } else if (record.type === 'expense') {
        byMonth.get(key).expense += amount;
      }
    });

    return Array.from(byMonth.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12);
  }, [finances]);

  const expenseCategoryData = useMemo(() => {
    const totals = new Map();

    finances.forEach((record) => {
      if (record.type !== 'expense') return;
      const amount = Number(record.amount ?? 0) || 0;
      if (amount <= 0) return;
      const category = record.category || 'Uncategorized';
      totals.set(category, (totals.get(category) || 0) + amount);
    });

    const sorted = Array.from(totals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    if (sorted.length <= 6) {
      return sorted;
    }

    const topFive = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    return [...topFive, { name: 'Other', value: otherTotal }];
  }, [finances]);

  const hasSalesData = salesTrendData.some((entry) => entry.sales > 0);
  const hasIncomeExpenseData = incomeExpenseByMonth.some(
    (entry) => entry.income > 0 || entry.expense > 0
  );
  const hasExpenseCategoryData = expenseCategoryData.some((entry) => entry.value > 0);

  const salesSummary = useMemo(() => {
    if (!Array.isArray(sales) || sales.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        averageOrder: 0,
        latestSaleDate: null,
        salesByMethod: [],
      };
    }

    let totalRevenue = 0;
    const methodTotals = new Map();
    let latestSaleDate = null;

    sales.forEach((sale) => {
      const total = Number(sale.total_amount ?? sale.totalAmount ?? 0) || 0;
      totalRevenue += total;
      const paymentMethod = (sale.payment_method || sale.paymentMethod || 'Unknown').toLowerCase();
      methodTotals.set(paymentMethod, (methodTotals.get(paymentMethod) || 0) + total);

      const dateString = sale.sale_date || sale.saleDate || sale.created_at;
      const date = dateString ? new Date(dateString) : null;
      if (date && !Number.isNaN(date.getTime())) {
        if (!latestSaleDate || date > latestSaleDate) {
          latestSaleDate = date;
        }
      }
    });

    const orderCount = sales.length;
    const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;
    const salesByMethod = Array.from(methodTotals.entries()).map(([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount,
    }));

    return { totalRevenue, orderCount, averageOrder, latestSaleDate, salesByMethod };
  }, [sales]);

  const financesSummary = useMemo(() => {
    if (!Array.isArray(finances) || finances.length === 0) {
      return {
        totalIncome: 0,
        totalExpense: 0,
        net: 0,
        lastRecordDate: null,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let lastRecordDate = null;

    finances.forEach((record) => {
      const amount = Number(record.amount ?? 0) || 0;
      if (amount <= 0) return;
      if (record.type === 'income') {
        totalIncome += amount;
      } else if (record.type === 'expense') {
        totalExpense += amount;
      }

      const dateString = record.expense_date || record.expenseDate || record.created_at;
      const date = dateString ? new Date(dateString) : null;
      if (date && !Number.isNaN(date.getTime())) {
        if (!lastRecordDate || date > lastRecordDate) {
          lastRecordDate = date;
        }
      }
    });

    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      lastRecordDate,
    };
  }, [finances]);

  const salesPaymentMethodData = useMemo(() => {
    const data = salesSummary.salesByMethod
      .map((entry) => ({
        name: entry.method,
        value: entry.amount,
      }))
      .filter((entry) => entry.value > 0);

    return data;
  }, [salesSummary.salesByMethod]);
  const hasSalesPaymentMethodData = salesPaymentMethodData.some((entry) => entry.value > 0);

  const formatDateTime = (date) => {
    if (!date) return 'No records yet';
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  return (
    <Container maxWidth="xl">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Charts &amp; Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize performance from sales activity and income/expense records.
          </Typography>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40vh',
            }}
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <SummaryStatCard
                    title="Total Sales Revenue"
                    value={currencyTooltipFormatter(salesSummary.totalRevenue)}
                    caption={`Orders: ${salesSummary.orderCount.toLocaleString()}`}
                    color="#1E88E5"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <SummaryStatCard
                    title="Average Order Value"
                    value={currencyTooltipFormatter(salesSummary.averageOrder)}
                    caption={`Last sale: ${formatDateTime(salesSummary.latestSaleDate)}`}
                    color="#43A047"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <SummaryStatCard
                    title="Income Recorded"
                    value={currencyTooltipFormatter(financesSummary.totalIncome)}
                    caption={financesSummary.lastRecordDate ? `Last entry: ${formatDateTime(financesSummary.lastRecordDate)}` : 'No income/expense records yet'}
                    color="#00ACC1"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <SummaryStatCard
                    title="Net Income"
                    value={currencyTooltipFormatter(financesSummary.net)}
                    caption={`Expenses: ${currencyTooltipFormatter(financesSummary.totalExpense)}`}
                    color={financesSummary.net >= 0 ? '#43A047' : '#E53935'}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Sales Trend"
                subtitle="Monthly total revenue over the last 12 months"
                hasData={hasSalesData}
                emptyMessage="Sales data is not available yet. Create sales to see this chart."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={currencyFormatter} width={80} />
                    <Tooltip formatter={(value) => currencyTooltipFormatter(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#1E88E5"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Income vs Expense"
                subtitle="Monthly breakdown across all income and expense records"
                hasData={hasIncomeExpenseData}
                emptyMessage="Income and expense data is not available yet. Add records to see this chart."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeExpenseByMonth} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={currencyFormatter} width={80} />
                    <Tooltip formatter={(value) => currencyTooltipFormatter(value)} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#43A047" />
                    <Bar dataKey="expense" name="Expense" fill="#E53935" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Expense Composition"
                subtitle="Total expenses grouped by category"
                hasData={hasExpenseCategoryData}
                emptyMessage="There are no recorded expenses yet. Add expenses to see this chart."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => currencyTooltipFormatter(value)} />
                    <Legend />
                    <Pie
                      data={expenseCategoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Sales by Payment Method"
                subtitle="Distribution of sales revenue by payment method"
                hasData={hasSalesPaymentMethodData}
                emptyMessage="Sales do not yet have payment method details."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip formatter={(value) => currencyTooltipFormatter(value)} />
                    <Legend />
                    <Pie
                      data={salesPaymentMethodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {salesPaymentMethodData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <ChartCard
                title="Net Position"
                subtitle="Net income (income minus expenses) per month"
                hasData={hasIncomeExpenseData}
                emptyMessage="Net position is unavailable until income or expense records exist."
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={incomeExpenseByMonth.map((item) => ({
                      ...item,
                      net: item.income - item.expense,
                    }))}
                    margin={{ top: 16, right: 24, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={currencyFormatter} width={80} />
                    <Tooltip formatter={(value) => currencyTooltipFormatter(value)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="net"
                      name="Net Income"
                      stroke="#8E24AA"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Container>
  );
}

export default Charts;

