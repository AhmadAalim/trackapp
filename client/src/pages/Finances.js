import React, { useEffect, useMemo, useState } from 'react';
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
  CircularProgress,
  Chip,
  Grid,
  MenuItem,
  Tooltip,
  Alert,
} from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { employeesAPI, financesAPI } from '../services/api';

const EMPLOYEE_WITHDRAWAL_CATEGORY = 'Employee Withdrawal';

const incomeCategoryOptions = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Other Income', label: 'Other Income' },
];

const expenseCategoryOptions = [
  { value: 'Rent', label: 'Rent' },
  { value: 'Cost of Goods (COGS)', label: 'Cost of Goods (COGS)' },
  {
    value: 'Utilities',
    label: 'Utilities (Electricity, Trash Removal, Water, Internet, Cellular Data)',
  },
  { value: 'Accountant', label: 'Accountant' },
  {
    value: 'Maintenance Items',
    label: 'Maintenance Items (Cleaning products, Coffee capsules, Water bottles)',
  },
  { value: EMPLOYEE_WITHDRAWAL_CATEGORY, label: 'Employee Withdrawal' },
  { value: 'Other', label: 'Other' },
];

function Finances() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [recordType, setRecordType] = useState(null); // 'income' or 'expense'
  const [editing, setEditing] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpenses: 0, netAmount: 0 });
  const [employees, setEmployees] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [showTotals, setShowTotals] = useState({
    income: false,
    expenses: false,
    net: false,
  });
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    employee_id: '',
  });

  useEffect(() => {
    fetchRecords();
    fetchStats();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleOpen = (type, record = null) => {
    setRecordType(type);
    if (record) {
      setEditing(record.id);
      setEditingRecord(record);
      setFormData({
        category: record.category || '',
        amount:
          record.amount !== undefined && record.amount !== null
            ? String(record.amount)
            : '',
        description: record.description || '',
        expense_date: record.expense_date || new Date().toISOString().split('T')[0],
        employee_id:
          record.employee_id !== undefined && record.employee_id !== null
            ? String(record.employee_id)
            : '',
      });
      setShowDescription(Boolean(record.description));
    } else {
      setEditing(null);
      setEditingRecord(null);
      setFormData({
        category: '',
        amount: '',
        description: '',
        expense_date: new Date().toISOString().split('T')[0],
        employee_id: '',
      });
      setShowDescription(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setEditingRecord(null);
    setRecordType(null);
    setShowDescription(false);
  };

  const handleCategoryChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
      employee_id:
        recordType === 'expense' && value === EMPLOYEE_WITHDRAWAL_CATEGORY
          ? prev.employee_id
          : '',
    }));
  };

  const handleSubmit = async () => {
    try {
      const isEmployeeWithdrawal =
        recordType === 'expense' && formData.category === EMPLOYEE_WITHDRAWAL_CATEGORY;

      const employeeIdForSubmission = (() => {
        if (!isEmployeeWithdrawal || !formData.employee_id) {
          return null;
        }
        const parsed = parseInt(formData.employee_id, 10);
        return Number.isNaN(parsed) ? null : parsed;
      })();

      const data = {
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description,
        expense_date: formData.expense_date,
        type: recordType,
        employee_id: employeeIdForSubmission,
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

  const handleDelete = async (id, record) => {
    // Prevent deleting sales records (they're managed in Sales page)
    if (record && record.category === 'Sales' && record.payment_method !== undefined) {
      alert('Sales records cannot be deleted from this page. Please manage them in the Sales page.');
      return;
    }
    
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

  const categoryOptions = useMemo(
    () => (recordType === 'expense' ? expenseCategoryOptions : incomeCategoryOptions),
    [recordType]
  );

  const effectiveCategoryOptions = useMemo(() => {
    if (!formData.category) {
      return categoryOptions;
    }

    const exists = categoryOptions.some((option) => option.value === formData.category);
    return exists
      ? categoryOptions
      : [...categoryOptions, { value: formData.category, label: formData.category }];
  }, [categoryOptions, formData.category]);

  const employeeOptions = useMemo(
    () =>
      employees.map((employee) => ({
        value: String(employee.id),
        label: employee.name || `Employee #${employee.id}`,
      })),
    [employees]
  );

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach((employee) => {
      map[employee.id] = employee.name;
    });
    return map;
  }, [employees]);

  const isEmployeeWithdrawalCategory =
    recordType === 'expense' && formData.category === EMPLOYEE_WITHDRAWAL_CATEGORY;

  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const selectedEmployee = useMemo(() => {
    if (!formData.employee_id) {
      return null;
    }
    return (
      employees.find(
        (employee) => String(employee.id) === String(formData.employee_id)
      ) || null
    );
  }, [employees, formData.employee_id]);

  const originalWithdrawalAmount = useMemo(() => {
    if (
      !editingRecord ||
      editingRecord.type !== 'expense' ||
      editingRecord.category !== EMPLOYEE_WITHDRAWAL_CATEGORY
    ) {
      return 0;
    }

    const editingEmployeeId =
      editingRecord.employee_id !== undefined && editingRecord.employee_id !== null
        ? String(editingRecord.employee_id)
        : '';
    const editingMonth = editingRecord.expense_date
      ? editingRecord.expense_date.slice(0, 7)
      : currentMonthKey;

    if (
      editingEmployeeId !== String(formData.employee_id || '') ||
      editingMonth !== currentMonthKey
    ) {
      return 0;
    }

    const parsed = parseFloat(editingRecord.amount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [editingRecord, formData.employee_id, currentMonthKey]);

  const selectedEmployeeAllowance =
    Number(selectedEmployee?.monthly_allowance ?? selectedEmployee?.salary ?? 0) || 0;
  const selectedEmployeeWithdrawn = Number(selectedEmployee?.total_withdrawn || 0);
  const adjustedWithdrawn = Math.max(selectedEmployeeWithdrawn - originalWithdrawalAmount, 0);
  const remainingAllowance = Math.max(selectedEmployeeAllowance - adjustedWithdrawn, 0);

  const amountNumber = parseFloat(formData.amount);
  const amountIsNumber = !Number.isNaN(amountNumber);
  const amountIsPositive = amountIsNumber && amountNumber > 0;
  const projectedRemaining = amountIsNumber
    ? Math.max(remainingAllowance - amountNumber, 0)
    : remainingAllowance;
  const withdrawalExceedsAllowance =
    isEmployeeWithdrawalCategory && amountIsNumber && amountNumber > remainingAllowance + 0.0001;

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

  const amountValueProvided = formData.amount !== '';
  const noAllowanceRemaining =
    isEmployeeWithdrawalCategory && formData.employee_id && remainingAllowance <= 0;
  const amountHasGeneralError = amountValueProvided && (!amountIsNumber || amountNumber <= 0);
  const amountHasWithdrawalError =
    isEmployeeWithdrawalCategory && formData.employee_id && withdrawalExceedsAllowance;
  const amountError = amountHasGeneralError || amountHasWithdrawalError || noAllowanceRemaining;
  const amountHelperText = (() => {
    if (amountHasGeneralError) {
      return 'Enter a positive amount.';
    }
    if (isEmployeeWithdrawalCategory) {
      if (!formData.employee_id) {
        return 'Select an employee to see allowance details.';
      }
      if (noAllowanceRemaining) {
        return 'No allowance remaining for this employee this month.';
      }
      if (withdrawalExceedsAllowance) {
        return `Amount exceeds remaining allowance of ${formatCurrency(remainingAllowance)}.`;
      }
      const afterText =
        amountIsNumber && amountNumber > 0
          ? ` • After withdrawal: ${formatCurrency(projectedRemaining)}`
          : '';
      return `Remaining allowance: ${formatCurrency(remainingAllowance)}${afterText}`;
    }
    return undefined;
  })();

  const withdrawalAlertSeverity = (() => {
    if (!isEmployeeWithdrawalCategory) {
      return 'info';
    }
    if (!formData.employee_id) {
      return 'info';
    }
    if (withdrawalExceedsAllowance) {
      return 'error';
    }
    if (remainingAllowance <= 0) {
      return 'error';
    }
    return 'info';
  })();

  const withdrawalAlertMessage = (() => {
    if (!isEmployeeWithdrawalCategory) {
      return '';
    }
    if (!formData.employee_id) {
      return 'Select an employee to see allowance details before recording the withdrawal.';
    }
    const employeeName = selectedEmployee?.name || 'This employee';
    const baseDetails = `${employeeName} • Allowance: ${formatCurrency(
      selectedEmployeeAllowance
    )} • Withdrawn this month: ${formatCurrency(adjustedWithdrawn)} • Remaining: ${formatCurrency(
      remainingAllowance
    )}`;
    if (withdrawalExceedsAllowance) {
      return `${baseDetails}. Requested ${formatCurrency(
        amountNumber
      )} exceeds the remaining allowance. Reduce the amount.`;
    }
    if (remainingAllowance <= 0) {
      return `${baseDetails}. No allowance remaining for additional withdrawals this month.`;
    }
    if (amountIsNumber && amountNumber > 0) {
      return `${baseDetails} • After this withdrawal: ${formatCurrency(projectedRemaining)}.`;
    }
    return baseDetails;
  })();

  const maskCurrency = (value) => {
    const formatted = formatCurrency(value);
    return '*'.repeat(formatted.length);
  };

  const renderMaskedValue = (value, visible) => (visible ? formatCurrency(value) : maskCurrency(value));

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
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" sx={{ flexGrow: 1 }}>
                {renderMaskedValue(stats.totalIncome, showTotals.income)}
              </Typography>
              <IconButton
                aria-label={showTotals.income ? 'Hide total income' : 'Show total income'}
                size="small"
                color="inherit"
                onClick={() =>
                  setShowTotals((prev) => ({
                    ...prev,
                    income: !prev.income,
                  }))
                }
              >
                {showTotals.income ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, backgroundColor: 'error.light', color: 'white' }}>
            <Typography variant="h6" gutterBottom>
              Total Expenses
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" sx={{ flexGrow: 1 }}>
                {renderMaskedValue(stats.totalExpenses, showTotals.expenses)}
              </Typography>
              <IconButton
                aria-label={showTotals.expenses ? 'Hide total expenses' : 'Show total expenses'}
                size="small"
                color="inherit"
                onClick={() =>
                  setShowTotals((prev) => ({
                    ...prev,
                    expenses: !prev.expenses,
                  }))
                }
              >
                {showTotals.expenses ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Box>
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
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h4" sx={{ flexGrow: 1 }}>
                {renderMaskedValue(stats.netAmount, showTotals.net)}
              </Typography>
              <IconButton
                aria-label={showTotals.net ? 'Hide net amount' : 'Show net amount'}
                size="small"
                color="inherit"
                onClick={() =>
                  setShowTotals((prev) => ({
                    ...prev,
                    net: !prev.net,
                  }))
                }
              >
                {showTotals.net ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No records found. Add income or expense records to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const employeeName =
                  record.employee_name ||
                  (record.employee_id ? employeeMap[record.employee_id] : null);
                
                // Check if this is a sale record (sales have category 'Sales' and come from sales table)
                const isSale = record.category === 'Sales' && record.payment_method !== undefined;
                // Use a unique key that includes the source to avoid conflicts
                const recordKey = isSale ? `sale-${record.id}` : `expense-${record.id}`;

                return (
                  <TableRow key={recordKey}>
                    <TableCell>
                      <Chip
                        label={record.type === 'income' ? 'Income' : 'Expense'}
                        color={record.type === 'income' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {record.category}
                      {isSale && (
                        <Chip
                          label="Sale"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{employeeName || '-'}</TableCell>
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
                    <TableCell>
                      {isSale && record.payment_method ? (
                        <Box>
                          <Typography variant="body2">{record.description || '-'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Payment: {record.payment_method}
                          </Typography>
                        </Box>
                      ) : (
                        record.description || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {record.expense_date
                        ? new Date(record.expense_date).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {isSale ? (
                        <Tooltip title="Sales are managed in the Sales page">
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" disabled>
                              <EditIcon />
                            </IconButton>
                            <IconButton size="small" disabled>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Tooltip>
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(record.type, record)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(record.id, record)}>
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
              label={recordType === 'expense' ? 'Expense Category' : 'Income Category'}
              fullWidth
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              SelectProps={{
                native: false,
              }}
              helperText={
                recordType === 'expense'
                  ? 'What is the expense for?'
                  : 'Select a category or type your own below'
              }
              required
              disabled={!recordType}
            >
              {effectiveCategoryOptions.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </TextField>
            {isEmployeeWithdrawalCategory && (
              <TextField
                select
                label="Employee"
                fullWidth
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                SelectProps={{ native: false }}
                required
                disabled={employeeOptions.length === 0}
                helperText={
                  employeeOptions.length === 0
                    ? 'Add employees in the Employees section before recording a withdrawal.'
                    : formData.employee_id
                      ? `Allowance: ${formatCurrency(
                          selectedEmployeeAllowance
                        )} • Withdrawn: ${formatCurrency(adjustedWithdrawn)} • Remaining: ${formatCurrency(
                          remainingAllowance
                        )}`
                      : 'Select the employee who received the withdrawal.'
                }
              >
                {employeeOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    No employees available
                  </MenuItem>
                ) : (
                  employeeOptions.map((employee) => (
                    <MenuItem key={employee.value} value={employee.value}>
                      {employee.label}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              inputProps={{ step: '0.01', min: '0' }}
              required
              error={amountError}
              helperText={amountHelperText}
            />
            {isEmployeeWithdrawalCategory && withdrawalAlertMessage && (
              <Alert severity={withdrawalAlertSeverity} sx={{ mt: 1 }}>
                {withdrawalAlertMessage}
              </Alert>
            )}
            <Box display="flex" justifyContent="flex-end">
              <Tooltip title={showDescription ? 'Hide notes' : 'Add notes'}>
                <IconButton
                  aria-label={showDescription ? 'Hide notes' : 'Add notes'}
                  onClick={() => {
                    setShowDescription((prev) => {
                      if (prev) {
                        setFormData((current) => ({ ...current, description: '' }));
                      }
                      return !prev;
                    });
                  }}
                  color={showDescription ? 'primary' : 'default'}
                  sx={{ alignSelf: 'flex-end' }}
                >
                  <NoteAltIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {showDescription && (
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description or notes"
              />
            )}
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
            disabled={
              !formData.category ||
              !formData.amount ||
              !amountIsPositive ||
              (isEmployeeWithdrawalCategory &&
                (employeeOptions.length === 0 || !formData.employee_id || withdrawalExceedsAllowance))
            }
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

