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
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { salesAPI, inventoryAPI, employeesAPI } from '../services/api';
import { createFilterOptions } from '@mui/material/Autocomplete';

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
  const [showNotes, setShowNotes] = useState(false);

  const productFilterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) =>
      `${option?.name || ''} ${option?.description || ''} ${option?.sku || ''} ${option?.barcode || ''} ${option?.id || ''}`,
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
    setShowNotes(false);
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
      setShowNotes(!!sale.notes);
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

  const handleProductSelect = (index, product) => {
    const newItems = [...formData.items];

    if (product) {
      const productPrice = Number(product.price) || 0;
      const currentQuantity = Number(newItems[index]?.quantity) || 1;
      newItems[index] = {
        ...newItems[index],
        product_id: String(product.id),
        unit_price: parseFloat(productPrice.toFixed(2)),
        quantity: Math.max(1, currentQuantity),
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        product_id: '',
        unit_price: 0,
      };
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'quantity') {
      const parsed = parseInt(value, 10);
      newItems[index] = {
        ...newItems[index],
        quantity: Number.isNaN(parsed) ? 1 : Math.max(1, parsed),
      };
    } else if (field === 'unit_price') {
      const parsed = parseFloat(value);
      newItems[index] = {
        ...newItems[index],
        unit_price: Number.isNaN(parsed) ? 0 : Math.max(0, parseFloat(parsed.toFixed(2))),
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
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
      const itemsToSubmit = formData.items
        .filter((item) => item.product_id)
        .map((item) => ({
          product_id: parseInt(item.product_id, 10),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 0),
          unit_price: parseFloat(item.unit_price) || 0,
        }))
        .filter((item) => item.product_id && item.quantity > 0);

      if (itemsToSubmit.length === 0) {
        alert('Add at least one product before completing the sale.');
        return;
      }

      const data = {
        payment_method: formData.payment_method,
        payment_type: formData.payment_method,
        employee_id: formData.employee_id ? parseInt(formData.employee_id, 10) : null,
        notes: formData.notes,
        items: itemsToSubmit,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Payment Method
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={formData.payment_method}
                onChange={(_, value) => value && setFormData({ ...formData, payment_method: value })}
              >
                <ToggleButton value="cash">Cash</ToggleButton>
                <ToggleButton value="card">Card</ToggleButton>
                <ToggleButton value="other">Other</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField
              select
              label="Employee (optional)"
              size="small"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">No Employee</MenuItem>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2">Items</Typography>
              <Button onClick={addItem} startIcon={<AddIcon />} size="small" variant="outlined">
                Add Item
              </Button>
            </Box>

            {formData.items.map((item, index) => {
              const selectedProduct = products.find((p) => String(p.id) === String(item.product_id));

              return (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '2fr repeat(2, minmax(90px, 1fr)) auto' },
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Autocomplete
                    options={products}
                    value={selectedProduct || null}
                    onChange={(_, value) => handleProductSelect(index, value)}
                    filterOptions={productFilterOptions}
                    getOptionLabel={(option) =>
                      option
                        ? `${option.description || option.sku || '—'} — ${option.name}`
                        : ''
                    }
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input' && value) {
                        const normalized = value.trim().toLowerCase();
                        const barcodeMatch = products.find((p) =>
                          [p.description, p.sku, p.barcode]
                            .filter(Boolean)
                            .some((field) => String(field).toLowerCase() === normalized)
                        );
                        if (barcodeMatch) {
                          handleProductSelect(index, barcodeMatch);
                        }
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Product"
                        size="small"
                        placeholder="Scan or search barcode"
                      />
                    )}
                  />

                  <TextField
                    type="number"
                    label="Qty"
                    size="small"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    inputProps={{ min: 1, step: 1 }}
                  />

                  <TextField
                    type="number"
                    label="Price"
                    size="small"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                  />

                  {formData.items.length > 1 && (
                    <IconButton color="error" size="small" onClick={() => removeItem(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" color="text.secondary">
                Order Total
              </Typography>
              <Typography variant="h6">₪{calculateTotal().toFixed(2)}</Typography>
            </Box>

            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
              <Tooltip title={showNotes ? 'Hide note' : 'Add note'}>
                <IconButton
                  size="small"
                  onClick={() => setShowNotes((prev) => !prev)}
                  color={showNotes || formData.notes ? 'primary' : 'default'}
                >
                  <EditNoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {showNotes && (
              <TextField
                label="Sale Note"
                multiline
                minRows={2}
                maxRows={4}
                size="small"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            )}
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
