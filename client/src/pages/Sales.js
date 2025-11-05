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
  Typography,
  Box,
  CircularProgress,
  MenuItem,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { salesAPI, inventoryAPI, employeesAPI } from '../services/api';

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [viewSale, setViewSale] = useState(null);
  const [formData, setFormData] = useState({
    payment_method: 'cash',
    employee_id: '',
    notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
  });

  useEffect(() => {
    fetchSales();
    fetchProducts();
    fetchEmployees();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll();
      setSales(response.data);
    } catch (err) {
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleOpen = () => {
    setFormData({
      payment_method: 'cash',
      employee_id: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    });
    setEditingSaleId(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSaleId(null);
  };

  const handleEditSale = async (id) => {
    try {
      const response = await salesAPI.getById(id);
      const sale = response.data;
      setEditingSaleId(id);
      setFormData({
        payment_method: sale.payment_method || 'cash',
        employee_id: sale.employee_id || '',
        notes: sale.notes || '',
        items: (sale.items || []).map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });
      setOpen(true);
    } catch (err) {
      console.error('Error loading sale for edit:', err);
      alert('Failed to load sale for editing');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Delete this sale? This will revert stock for its items.')) return;
    try {
      await salesAPI.delete(id);
      fetchSales();
    } catch (err) {
      console.error('Error deleting sale:', err);
      const msg = err?.response?.data?.error || err.message || 'Failed to delete sale';
      alert(`Error: ${msg}`);
    }
  };

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      product_id: productId,
      unit_price: product ? product.price : 0,
    };
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, unit_price: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0),
      0
    );
  };

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        items: formData.items
          .filter((item) => item.product_id)
          .map((item) => ({
            product_id: parseInt(item.product_id),
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
          })),
        employee_id: formData.employee_id ? parseInt(formData.employee_id) : null,
      };
      if (editingSaleId) {
        await salesAPI.update(editingSaleId, data);
      } else {
        await salesAPI.create(data);
      }
      fetchSales();
      handleClose();
    } catch (err) {
      console.error('Error saving sale:', err);
      const msg = err?.response?.data?.error || err.message || 'Error saving sale';
      alert(`Error: ${msg}`);
    }
  };

  const handleViewSale = async (id) => {
    try {
      const response = await salesAPI.getById(id);
      setViewSale(response.data);
    } catch (err) {
      console.error('Error fetching sale:', err);
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
        <Typography variant="h4">Sales</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          New Sale
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Total</TableCell>
                <TableCell>Payment Method</TableCell>
              <TableCell>Employee</TableCell>
              <TableCell>Items</TableCell>
                <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                <TableCell>₪{parseFloat(sale.total_amount).toFixed(2)}</TableCell>
                <TableCell>{sale.payment_method}</TableCell>
                <TableCell>{sale.employee_name || 'N/A'}</TableCell>
                <TableCell>{sale.item_count || 0}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleViewSale(sale.id)} title="View">
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleEditSale(sale.id)} title="Edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteSale(sale.id)} title="Delete">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingSaleId ? 'Edit Sale' : 'New Sale'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              select
              label="Payment Method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              fullWidth
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              select
              label="Employee"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="h6">Items</Typography>
            {formData.items.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  select
                  label="Product"
                  value={item.product_id}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  sx={{ flex: 2 }}
                >
                  <MenuItem value="">Select Product</MenuItem>
                  {products.map((prod) => (
                    <MenuItem key={prod.id} value={prod.id}>
                      {prod.name} (₪{parseFloat(prod.price).toFixed(2)})
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  label="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  type="number"
                  label="Price"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  sx={{ flex: 1 }}
                />
                {formData.items.length > 1 && (
                  <Button onClick={() => removeItem(index)} color="error">
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button onClick={addItem} startIcon={<AddIcon />}>
              Add Item
            </Button>

            <Typography variant="h6">Total: ₪{calculateTotal().toFixed(2)}</Typography>

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Complete Sale
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewSale} onClose={() => setViewSale(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Sale Details</DialogTitle>
        <DialogContent>
          {viewSale && (
            <Box>
              <Typography><strong>Date:</strong> {new Date(viewSale.sale_date).toLocaleString()}</Typography>
              <Typography><strong>Total:</strong> ₪{parseFloat(viewSale.total_amount).toFixed(2)}</Typography>
              <Typography><strong>Payment Method:</strong> {viewSale.payment_method}</Typography>
              {viewSale.items && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>Items:</Typography>
                  {viewSale.items.map((item) => (
                    <Box key={item.id} sx={{ p: 1 }}>
                      <Typography>
                        {item.product_name} - Qty: {item.quantity} × ₪{parseFloat(item.unit_price).toFixed(2)} = ₪{parseFloat(item.total_price).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSale(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Sales;
