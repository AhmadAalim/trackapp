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
  InputAdornment,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import Alert from '@mui/material/Alert';
import { inventoryAPI } from '../services/api';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [formData, setFormData] = useState({
    name: '', // Product Name
    description: '', // Product Barcode
    sku: '', // Leave empty for now
    category: '',
    price: '', // Final Price
    cost: '', // Cost Price
    stock_quantity: '', // Quantity
    min_stock_level: '',
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await inventoryAPI.getAll();
      console.log(`Fetched ${response.data.length} products`);
      
      // Ensure all products have id field
      const productsWithId = response.data.map(product => {
        if (!product.id) {
          console.warn('Product missing id:', product);
        }
        return product;
      });
      
      setProducts(productsWithId);
      setFilteredProducts(productsWithId);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (product = null) => {
    if (product) {
      // Debug: Log product data to ensure it has id
      console.log('Opening edit dialog for product:', product);
      
      if (!product.id) {
        console.error('Product missing id field:', product);
        alert('Error: Product ID is missing. Please refresh the page and try again.');
        return;
      }
      
      setEditing(product.id);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        cost: product.cost?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        min_stock_level: product.min_stock_level?.toString() || '',
        image_url: product.image_url || '',
      });
      setImagePreview(product.image_url ? `http://localhost:5001${product.image_url}` : null);
    } else {
      setEditing(null);
      setFormData({
        name: '',
        description: '',
        sku: '',
        category: '',
        price: '',
        cost: '',
        stock_quantity: '',
        min_stock_level: '',
        image_url: '',
      });
      setImagePreview(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setImagePreview(null);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (jpg, png, gif, webp)');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    // Show loading state
    const originalButton = event.target;
    originalButton.disabled = true;

    // For mobile camera, use file directly
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await inventoryAPI.uploadImage(formData);
      if (response.data && response.data.imageUrl) {
        setFormData({ ...formData, image_url: response.data.imageUrl });
        setImagePreview(`http://localhost:5001${response.data.imageUrl}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to upload image';
      alert(`Error: ${errorMsg}`);
    } finally {
      originalButton.disabled = false;
      // Reset input to allow re-uploading same file
      event.target.value = '';
    }
  };


  const handleSubmit = async () => {
    try {
      if (editing && (!editing || editing === null || editing === undefined)) {
        console.error('No product ID found for editing');
        alert('Error: Cannot update product without an ID. Please try again.');
        return;
      }

      if (!formData.name || formData.name.trim() === '') {
        alert('Error: Product name is required');
        return;
      }

      // Generate SKU: last 4 digits are cost price padded with zeros
      const cost = parseFloat(formData.cost) || 0;
      const costPadded = Math.floor(cost).toString().padStart(4, '0'); // Last 4 digits: 0025 for 25
      
      // Create SKU prefix from product name (first 4 uppercase letters/numbers)
      const namePrefix = (formData.name || 'PROD')
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 4)
        .toUpperCase()
        .padEnd(4, 'X'); // Fill with X if name is too short
      
      const generatedSku = `${namePrefix}${costPadded}`;

      const data = {
        name: formData.name,
        description: formData.description, // Product Barcode
        sku: generatedSku, // Generated SKU with cost price as last 4 digits
        category: '',
        price: parseFloat(formData.price) || 0, // Final Price
        cost: cost, // Cost Price
        stock_quantity: parseInt(formData.stock_quantity) || 0, // Quantity
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        supplier_id: null,
        image_url: formData.image_url || null,
      };

      console.log('Submitting product:', { editing, data });

      if (editing) {
        const response = await inventoryAPI.update(editing, data);
        console.log('Update response:', response.data);
      } else {
        const response = await inventoryAPI.create(data);
        console.log('Create response:', response.data);
      }
      
      // Refresh products list
      await fetchProducts();
      handleClose();
    } catch (err) {
      console.error('Error saving product:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Error saving product';
      alert(`Error: ${errorMsg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await inventoryAPI.delete(id);
        fetchProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Error deleting product');
      }
    }
  };

  const handleDeleteAll = async () => {
    // First confirmation
    const firstConfirm = window.confirm(
      `⚠️ WARNING: This will delete ALL ${products.length} product(s) from the database.\n\n` +
      `This action cannot be undone!\n\n` +
      `Are you absolutely sure you want to continue?`
    );
    
    if (!firstConfirm) return;

    // Second confirmation with typing requirement
    const confirmText = 'DELETE ALL';
    const userInput = window.prompt(
      `⚠️ FINAL WARNING: You are about to permanently delete ALL products!\n\n` +
      `Type "${confirmText}" (in all caps) to confirm:`
    );

    if (userInput !== confirmText) {
      alert('Deletion cancelled. The confirmation text did not match.');
      return;
    }

    try {
      console.log('Calling deleteAll API...');
      console.log('Current products count:', products.length);
      
      const response = await inventoryAPI.deleteAll();
      console.log('Delete all response:', response);
      console.log('Response status:', response?.status);
      console.log('Response data:', response?.data);
      
      if (response && response.data) {
        const deletedCount = response.data.count !== undefined ? response.data.count : 0;
        const message = response.data.message || `Successfully deleted ${deletedCount} product(s)`;
        
        alert(`✅ ${message}`);
        
        // Refresh the product list immediately
        await fetchProducts();
      } else {
        throw new Error('Invalid response from server - no data received');
      }
    } catch (err) {
      console.error('Error deleting all products:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Full error:', err);
      
      let errorMsg = 'Failed to delete all products';
      if (err.response?.status === 404) {
        errorMsg = 'Delete endpoint not found (404). The route may not be registered correctly.';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(`Error: ${errorMsg}\n\nPlease check the browser console for more details.`);
    }
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setImportMessage({ type: 'error', text: 'Please select a valid Excel file (.xlsx or .xls)' });
      event.target.value = '';
      return;
    }

    setImporting(true);
    setImportMessage(null);

    const formData = new FormData();
    formData.append('excel', file);

    try {
      const response = await inventoryAPI.importExcel(formData);
      
      console.log('Import response:', response.data);
      
      const successCount = response.data.success || 0;
      const errors = response.data.errors || [];
      
      setImportMessage({
        type: 'success',
        text: response.data.message || `Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}`,
        errors: errors
      });

      // Force refresh product list - wait a bit for database to update
      setTimeout(async () => {
        console.log('Refreshing product list after Excel import...');
        await fetchProducts();
        console.log('Product list refreshed - products should now be editable');
      }, 1000);

      // Clear file input
      event.target.value = '';
    } catch (err) {
      console.error('Error importing Excel:', err);
      console.error('Error details:', err.response?.data);
      setImportMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to import products from Excel'
      });
    } finally {
      setImporting(false);
      // Clear message after 10 seconds (longer for errors)
      setTimeout(() => setImportMessage(null), 10000);
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Inventory</Typography>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {/* Search Bar */}
          <TextField
            placeholder="Search products..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          {/* Import Excel Button */}
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={importing}
            sx={{ position: 'relative' }}
          >
            {importing ? 'Importing...' : 'Import Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleExcelImport}
              disabled={importing}
            />
          </Button>

          {/* Delete All Button */}
          {products.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={handleDeleteAll}
            >
              Delete All
            </Button>
          )}

          {/* Add Product Button */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Import Message */}
      {importMessage && (
        <Alert 
          severity={importMessage.type} 
          onClose={() => setImportMessage(null)}
          sx={{ mb: 2 }}
        >
          {importMessage.text}
          {importMessage.errors && importMessage.errors.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" component="div">
                Errors ({importMessage.errors.length}):
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.875rem' }}>
                {importMessage.errors.slice(0, 5).map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
                {importMessage.errors.length > 5 && (
                  <li>... and {importMessage.errors.length - 5} more errors</li>
                )}
              </Box>
            </Box>
          )}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {searchTerm ? 'No products found matching your search.' : 'No products found. Add a product to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <Avatar
                        src={`http://localhost:5001${product.image_url}`}
                        alt={product.name}
                        sx={{ width: 56, height: 56 }}
                        variant="rounded"
                      />
                    ) : (
                      <Avatar sx={{ width: 56, height: 56 }} variant="rounded">
                        {product.name.charAt(0)}
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {product.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>{product.sku || '-'}</TableCell>
                  <TableCell>{product.category || '-'}</TableCell>
                  <TableCell>₪{parseFloat(product.price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        color: product.stock_quantity <= product.min_stock_level ? 'error.main' : 'inherit',
                      }}
                    >
                      {product.stock_quantity}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpen(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(product.id)}>
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
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {/* Image Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {imagePreview ? (
                <Avatar
                  src={imagePreview}
                  alt="Product preview"
                  sx={{ width: 120, height: 120 }}
                  variant="rounded"
                />
              ) : (
                <Avatar sx={{ width: 120, height: 120 }} variant="rounded">
                  No Image
                </Avatar>
              )}
              <label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CameraAltIcon />}
                  fullWidth
                >
                  Take Photo or Upload Image
                </Button>
              </label>
            </Box>

            <TextField
              label="Product Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              helperText="Required field"
            />
            <TextField
              label="Product Barcode"
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              helperText="Enter the product barcode"
            />
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Cost Price"
                type="number"
                fullWidth
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                helperText="Purchase/cost price"
              />
              <TextField
                label="Final Price"
                type="number"
                fullWidth
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                helperText="Selling price"
              />
            </Box>
            <TextField
              label="Minimum Stock Level"
              type="number"
              fullWidth
              value={formData.min_stock_level}
              onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
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

export default Inventory;

