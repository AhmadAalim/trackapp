import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  MenuItem,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { financesAPI } from '../services/api';

function Finances() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState(null); // 'income' or 'expense'
  const [editing, setEditing] = useState(null);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, netAmount: 0 });
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, []);

  const fetchRecords = async () => {
    try {
      const response = await financesAPI.getAll();
      setRecords(response.data);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await financesAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleOpen = (type, record = null) => {
    setRecordType(type);
    if (record) {
      setEditing(record.id);
      setFormData({
        category: record.category || '',
        amount: record.amount || '',
        description: record.description || '',
        expense_date: record.expense_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setEditing(null);
      setFormData({
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setRecordType(null);
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        type: recordType,
        amount: parseFloat(formData.amount),
      };

      if (editing) {
        await financesAPI.update(editing, data);
      } else {
        await financesAPI.create(data);
      }
      fetchRecords();
      fetchStats();
      handleClose();
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Error saving record');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await financesAPI.delete(id);
        fetchRecords();
        fetchStats();
      } catch (err) {
        console.error('Error deleting record:', err);
        alert('Error deleting record');
      }
    }
  };

  const commonCategories = [
    'Salary',
    'Sales',
    'Investment',
    'Other Income',
    'Rent',
    'Utilities',
    'Supplies',
    'Marketing',
    'Transportation',
    'Other Expense',
  ];

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Income/Expense Tracker</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddCircleIcon />}
            onClick={() => handleOpen('income')}
            sx={{ minWidth: 140 }}
          >
            Add Income
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<RemoveCircleIcon />}
            onClick={() => handleOpen('expense')}
            sx={{ minWidth: 140 }}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'success.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Total Income
            </Typography>
            <Typography variant="h4">
              ₪{parseFloat(stats.totalIncome || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'error.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Total Expenses
            </Typography>
            <Typography variant="h4">
              ₪{parseFloat(stats.totalExpenses || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: stats.netAmount >= 0 ? 'primary.light' : 'warning.light',
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Net Amount
            </Typography>
            <Typography variant="h4">
              ₪{parseFloat(stats.netAmount || 0).toFixed(2)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No records found. Add income or expense records to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <Chip
                      label={record.type === 'income' ? 'Income' : 'Expense'}
                      color={record.type === 'income' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: record.type === 'income' ? 'success.main' : 'error.main',
                        fontWeight: 'bold',
                      }}
                    >
                      {record.type === 'income' ? '+' : '-'}₪
                      {parseFloat(record.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>{record.description || '-'}</TableCell>
                  <TableCell>
                    {record.expense_date
                      ? new Date(record.expense_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(record.type, record)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(record.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing
            ? `Edit ${recordType === 'income' ? 'Income' : 'Expense'}`
            : `Add ${recordType === 'income' ? 'Income' : 'Expense'}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              select
              label="Category"
              fullWidth
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              SelectProps={{
                native: false,
              }}
              helperText="Select a category or type your own below"
              required
            >
              {commonCategories
                .filter((cat) =>
                  recordType === 'income'
                    ? ['Salary', 'Sales', 'Investment', 'Other Income'].includes(cat)
                    : !['Salary', 'Sales', 'Investment', 'Other Income'].includes(cat)
                )
                .map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Or Enter Custom Category"
              fullWidth
              value={!commonCategories.includes(formData.category) ? formData.category : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setFormData({ ...formData, category: e.target.value });
                }
              }}
              placeholder="Type a custom category here"
              helperText="If the category you need is not in the list above, type it here"
            />
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              inputProps={{ step: '0.01', min: '0' }}
              required
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description or notes"
            />
            <TextField
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.category || !formData.amount}
            color={recordType === 'income' ? 'success' : 'error'}
          >
            {editing ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Finances;

