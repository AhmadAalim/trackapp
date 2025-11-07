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
  CircularProgress,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { employeesAPI } from '../services/api';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    hire_date: '',
    status: 'active',
    monthlyAllowance: '0',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (employee = null) => {
    if (employee) {
      setEditing(employee.id);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        hire_date: employee.hire_date || '',
        status: employee.status || 'active',
        monthlyAllowance: employee.monthly_allowance !== undefined && employee.monthly_allowance !== null
          ? String(parseFloat(employee.monthly_allowance))
          : employee.salary !== undefined && employee.salary !== null
            ? String(parseFloat(employee.salary))
            : '0',
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: '',
        hire_date: '',
        status: 'active',
        monthlyAllowance: '0',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      const { monthlyAllowance, ...rest } = formData;
      const payload = {
        ...rest,
        monthly_allowance: parseFloat(monthlyAllowance) || 0,
      };

      if (editing) {
        await employeesAPI.update(editing, payload);
      } else {
        await employeesAPI.create(payload);
      }
      fetchEmployees();
      handleClose();
    } catch (err) {
      console.error('Error saving employee:', err);
      alert('Error saving employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeesAPI.delete(id);
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
        alert('Error deleting employee');
      }
    }
  };

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
        <Typography variant="h4">Employees</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Employee
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Monthly Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{employee.phone}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₪{parseFloat(employee.balance_remaining ?? (employee.monthly_allowance || 0)).toFixed(2)} remaining
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Withdrawn: ₪{parseFloat(employee.total_withdrawn || 0).toFixed(2)} / Allowance: ₪{parseFloat(employee.monthly_allowance || employee.salary || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Resets monthly
                  </Typography>
                </TableCell>
                <TableCell>{employee.status}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpen(employee)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(employee.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Position"
              fullWidth
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
            <TextField
              label="Hire Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
            />
            <TextField
              select
              label="Status"
              fullWidth
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            <TextField
              label="Monthly Balance Allowance (₪)"
              type="number"
              fullWidth
              value={formData.monthlyAllowance}
              onChange={(e) => setFormData({ ...formData, monthlyAllowance: e.target.value })}
              helperText="Set the monthly amount available for withdrawals"
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Employees;
