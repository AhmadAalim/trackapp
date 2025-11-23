import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StoreIcon from '@mui/icons-material/Store';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LanguageIcon from '@mui/icons-material/Language';
import { ordersAPI, inventoryAPI, employeesAPI } from '../services/api';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'preparing', label: 'Preparing', color: 'warning' },
  { value: 'ready', label: 'Ready', color: 'primary' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const ORDER_SOURCES = {
  manual: { label: 'Manual', icon: null },
  instagram: { label: 'Instagram', icon: <InstagramIcon fontSize="small" /> },
  whatsapp: { label: 'WhatsApp', icon: <WhatsAppIcon fontSize="small" /> },
  website: { label: 'Website', icon: <LanguageIcon fontSize="small" /> },
};

function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [viewOrder, setViewOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [formData, setFormData] = useState({
    order_type: 'pickup',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    payment_method: 'cash',
    notes: '',
    source: 'manual',
    employee_id: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }],
  });
  const [showNotes, setShowNotes] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState('');
  const autocompleteRefs = useRef({});

  const productFilterOptions = createFilterOptions({
    matchFrom: 'any',
    stringify: (option) =>
      `${option?.name || ''} ${option?.description || ''} ${option?.sku || ''} ${option?.barcode || ''} ${option?.id || ''}`,
  });

  useEffect(() => {
    fetchOrders();
    fetchProducts();
    fetchEmployees();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.order_type = typeFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      
      const response = await ordersAPI.getAll(params);
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, typeFilter, sourceFilter]);

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
      order_type: 'pickup',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      delivery_address: '',
      payment_method: 'cash',
      notes: '',
      source: 'manual',
      employee_id: '',
      items: [{ product_id: '', quantity: 1, unit_price: 0 }],
    });
    setEditingOrderId(null);
    setShowNotes(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingOrderId(null);
  };

  const handleEditOrder = async (id) => {
    try {
      const response = await ordersAPI.getById(id);
      const order = response.data;
      setEditingOrderId(id);
      setFormData({
        order_type: order.order_type || 'pickup',
        customer_name: order.customer_name || '',
        customer_phone: order.customer_phone || '',
        customer_email: order.customer_email || '',
        delivery_address: order.delivery_address || '',
        payment_method: order.payment_method || 'cash',
        notes: order.notes || '',
        source: order.source || 'manual',
        employee_id: order.employee_id || '',
        items: (order.items || []).map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      });
      setShowNotes(!!order.notes);
      setOpen(true);
    } catch (err) {
      console.error('Error loading order for edit:', err);
      alert('Failed to load order for editing');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return;
    try {
      await ordersAPI.delete(id);
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      const msg = err?.response?.data?.error || err.message || 'Failed to delete order';
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

  // Helper to find product by barcode
  const findProductByBarcode = useCallback((barcode) => {
    return products.find((p) =>
      [p.description, p.sku, p.barcode, String(p.id)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase() === barcode.toLowerCase())
    );
  }, [products]);

  // Barcode scanner integration for Orders
  const handleBarcodeScan = useCallback((barcode) => {
    if (!open) return;
    
    setScannerActive(true);
    setLastScannedBarcode(barcode);
    
    const barcodeMatch = findProductByBarcode(barcode);

    if (barcodeMatch) {
      const emptyIndex = formData.items.findIndex((item) => !item.product_id);
      const targetIndex = emptyIndex !== -1 ? emptyIndex : formData.items.length - 1;
      
      handleProductSelect(targetIndex, barcodeMatch);
      
      if (emptyIndex === -1) {
        addItem();
      }
    }

    setTimeout(() => {
      setScannerActive(false);
      setLastScannedBarcode('');
    }, 2000);
  }, [open, findProductByBarcode, formData.items]);

  useBarcodeScanner(handleBarcodeScan, {
    enabled: open,
    minLength: 3,
    maxLength: 50,
    timeout: 100,
  });

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
        alert('Add at least one product before creating the order.');
        return;
      }

      if (!formData.customer_name.trim()) {
        alert('Customer name is required.');
        return;
      }

      if (formData.order_type === 'delivery' && !formData.delivery_address.trim()) {
        alert('Delivery address is required for delivery orders.');
        return;
      }

      const data = {
        order_type: formData.order_type,
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone || null,
        customer_email: formData.customer_email || null,
        delivery_address: formData.order_type === 'delivery' ? formData.delivery_address.trim() : null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        source: formData.source,
        employee_id: formData.employee_id ? parseInt(formData.employee_id, 10) : null,
        items: itemsToSubmit,
      };

      if (editingOrderId) {
        await ordersAPI.update(editingOrderId, data);
      } else {
        await ordersAPI.create(data);
      }
      fetchOrders();
      handleClose();
    } catch (err) {
      console.error('Error saving order:', err);
      const msg = err?.response?.data?.error || err.message || 'Error saving order';
      alert(`Error: ${msg}`);
    }
  };

  const handleViewOrder = async (id) => {
    try {
      const response = await ordersAPI.getById(id);
      setViewOrder(response.data);
    } catch (err) {
      console.error('Error fetching order:', err);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const statusObj = ORDER_STATUSES.find((s) => s.value === status);
    return statusObj?.color || 'default';
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

  const filteredOrders = orders;

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
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        mb={{ xs: 2, sm: 3 }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        sx={{ px: { xs: 1, sm: 0 }, width: '100%' }}
      >
        <Typography 
          variant="h4"
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          Orders
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleOpen}
          fullWidth={{ xs: true, sm: false }}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          New Order
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {ORDER_STATUSES.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Order Type</InputLabel>
            <Select
              value={typeFilter}
              label="Order Type"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="pickup">Pickup</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Source</InputLabel>
            <Select
              value={sourceFilter}
              label="Source"
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <MenuItem value="all">All Sources</MenuItem>
              {Object.entries(ORDER_SOURCES).map(([key, value]) => (
                <MenuItem key={key} value={key}>
                  {value.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <TableContainer 
        component={Paper}
        sx={{
          maxHeight: { xs: '60vh', sm: 'none' },
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          width: '100%',
          maxWidth: '100%',
          mx: { xs: 1, sm: 0 },
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Order #</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Customer</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Type</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Source</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Date</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No orders found. Create a new order to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontFamily: 'monospace', fontWeight: 600 }}>
                    {order.order_number}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {order.customer_name}
                    {order.customer_phone && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {order.customer_phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {order.order_type === 'delivery' ? (
                      <Chip icon={<LocalShippingIcon />} label="Delivery" size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip icon={<StoreIcon />} label="Pickup" size="small" color="secondary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    <Select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      size="small"
                      sx={{ minWidth: 120 }}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                          {status.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 600 }}>
                    ₪{parseFloat(order.total_amount).toFixed(2)}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                    {ORDER_SOURCES[order.source] && (
                      <Chip
                        icon={ORDER_SOURCES[order.source].icon}
                        label={ORDER_SOURCES[order.source].label}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewOrder(order.id)} 
                      title="View"
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditOrder(order.id)} 
                      title="Edit"
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleDeleteOrder(order.id)} 
                      title="Delete"
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Order Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={{ xs: true, sm: false }}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {editingOrderId ? 'Edit Order' : 'New Order'}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 1.5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Order Type */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Order Type
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={formData.order_type}
                onChange={(_, value) => value && setFormData({ ...formData, order_type: value })}
                fullWidth={{ xs: true, sm: false }}
                sx={{ 
                  '& .MuiToggleButton-root': {
                    minHeight: 44,
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  }
                }}
              >
                <ToggleButton value="pickup" startIcon={<StoreIcon />}>Pickup</ToggleButton>
                <ToggleButton value="delivery" startIcon={<LocalShippingIcon />}>Delivery</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Customer Information */}
            <TextField
              label="Customer Name *"
              size="small"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Customer Phone"
              size="small"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              fullWidth
            />

            <TextField
              label="Customer Email"
              size="small"
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              fullWidth
            />

            {formData.order_type === 'delivery' && (
              <TextField
                label="Delivery Address *"
                size="small"
                multiline
                minRows={2}
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                fullWidth
                required
              />
            )}

            {/* Source */}
            <FormControl size="small" fullWidth>
              <InputLabel>Source</InputLabel>
              <Select
                value={formData.source}
                label="Source"
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              >
                {Object.entries(ORDER_SOURCES).map(([key, value]) => (
                  <MenuItem key={key} value={key}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {value.icon}
                      {value.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Payment Method */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Payment Method
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={formData.payment_method}
                onChange={(_, value) => value && setFormData({ ...formData, payment_method: value })}
                fullWidth={{ xs: true, sm: false }}
                sx={{ 
                  '& .MuiToggleButton-root': {
                    minHeight: 44,
                    fontSize: { xs: '0.875rem', sm: '0.875rem' },
                  }
                }}
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

            {/* Items */}
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
                    ref={(el) => {
                      if (el) autocompleteRefs.current[index] = el;
                    }}
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
                        const barcodeMatch = findProductByBarcode(normalized);
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
                        placeholder={scannerActive && lastScannedBarcode && index === 0 ? `Scanned: ${lastScannedBarcode}` : "Scan or search barcode"}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: scannerActive && index === 0 ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                background: 'rgba(0, 122, 255, 0.2)',
                                color: '#007AFF',
                                mr: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: '#007AFF',
                                  animation: 'pulse 1s infinite',
                                  '@keyframes pulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.5 },
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                                Scanner
                              </Typography>
                            </Box>
                          ) : params.InputProps.endAdornment,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            border: scannerActive && index === 0 ? '2px solid #007AFF' : undefined,
                            boxShadow: scannerActive && index === 0 ? '0 0 0 3px rgba(0, 122, 255, 0.2)' : undefined,
                            transition: 'all 0.3s ease',
                          },
                        }}
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
                    <IconButton 
                      color="error" 
                      size="small" 
                      onClick={() => removeItem(index)}
                      sx={{ minWidth: 44, minHeight: 44 }}
                    >
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
                  sx={{ minWidth: 44, minHeight: 44 }}
                  color={showNotes || formData.notes ? 'primary' : 'default'}
                >
                  <EditNoteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {showNotes && (
              <TextField
                label="Order Notes"
                multiline
                minRows={2}
                maxRows={4}
                size="small"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about the order (e.g., Instagram message, special instructions)"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button 
            onClick={handleClose}
            fullWidth={{ xs: true, sm: false }}
            sx={{ m: 0 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            fullWidth={{ xs: true, sm: false }}
            sx={{ m: 0 }}
          >
            {editingOrderId ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog 
        open={!!viewOrder} 
        onClose={() => setViewOrder(null)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={{ xs: true, sm: false }}
        PaperProps={{
          sx: {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: '90vh' },
          }
        }}
      >
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {viewOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                  {viewOrder.order_number}
                </Typography>
                <Chip 
                  label={ORDER_STATUSES.find(s => s.value === viewOrder.status)?.label || viewOrder.status}
                  color={getStatusColor(viewOrder.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                <Typography>{viewOrder.customer_name}</Typography>
                {viewOrder.customer_phone && (
                  <Typography variant="body2" color="text.secondary">Phone: {viewOrder.customer_phone}</Typography>
                )}
                {viewOrder.customer_email && (
                  <Typography variant="body2" color="text.secondary">Email: {viewOrder.customer_email}</Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Order Type</Typography>
                {viewOrder.order_type === 'delivery' ? (
                  <Chip icon={<LocalShippingIcon />} label="Delivery" size="small" color="primary" variant="outlined" />
                ) : (
                  <Chip icon={<StoreIcon />} label="Pickup" size="small" color="secondary" variant="outlined" />
                )}
                {viewOrder.delivery_address && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Address: {viewOrder.delivery_address}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Source</Typography>
                {ORDER_SOURCES[viewOrder.source] && (
                  <Chip
                    icon={ORDER_SOURCES[viewOrder.source].icon}
                    label={ORDER_SOURCES[viewOrder.source].label}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {viewOrder.items && viewOrder.items.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Items</Typography>
                  {viewOrder.items.map((item) => (
                    <Box key={item.id} sx={{ p: 1, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography fontWeight={500}>
                        {item.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Qty: {item.quantity} × ₪{parseFloat(item.unit_price).toFixed(2)} = ₪{parseFloat(item.total_price).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Total</Typography>
                <Typography variant="h6">₪{parseFloat(viewOrder.total_amount).toFixed(2)}</Typography>
              </Box>

              {viewOrder.notes && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                  <Typography variant="body2">{viewOrder.notes}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body2">
                  {new Date(viewOrder.created_at).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button 
            onClick={() => setViewOrder(null)}
            fullWidth={{ xs: true, sm: false }}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Orders;


