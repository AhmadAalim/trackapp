import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Tabs,
  Tab,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SearchIcon from '@mui/icons-material/Search';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import Alert from '@mui/material/Alert';
import { inventoryAPI } from '../services/api';
import GenerateStickersButton from '../components/GenerateStickersButton';

const DELETE_ALL_PASSWORD = process.env.REACT_APP_DELETE_ALL_PASSWORD || '1111';

const calculateFinalPrice = (cost) => {
  const numericCost = Number(cost) || 0;
  const finalPrice = numericCost * 1.18 * 1.3;
  return Number(finalPrice.toFixed(2));
};

function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [failedImportRows, setFailedImportRows] = useState([]);
  const [retryingRowIndex, setRetryingRowIndex] = useState(null);
  const [retryAllLoading, setRetryAllLoading] = useState(false);
  const [retryFeedback, setRetryFeedback] = useState(null);
  const [restockList, setRestockList] = useState([]);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const totalProducts = products.length;
  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          Number(product.stock_quantity ?? 0) <= Number(product.min_stock_level ?? 10)
      ),
    [products]
  );

  const filterProductsBySearch = useCallback(
    (items) => {
      if (!searchTerm) {
        return items;
      }

      const lowerSearch = searchTerm.toLowerCase();
      return items.filter((product) =>
        product.name?.toLowerCase().includes(lowerSearch) ||
        (product.sku && product.sku.toLowerCase().includes(lowerSearch)) ||
        (product.category && product.category.toLowerCase().includes(lowerSearch)) ||
        (product.description && product.description.toLowerCase().includes(lowerSearch))
      );
    },
    [searchTerm]
  );

  const applyFilters = useCallback(
    (items) => {
      if (!Array.isArray(items)) {
        return [];
      }

      return items.filter((product) => {
        if (categoryFilter !== 'all') {
          if ((product.category || '').trim() !== categoryFilter) {
            return false;
          }
        }

        if (stockFilter !== 'all') {
          const quantity = Number(product.stock_quantity ?? 0);
          const minLevel = Number(product.min_stock_level ?? 10);

          if (stockFilter === 'low' && quantity > minLevel) {
            return false;
          }

          if (stockFilter === 'inStock' && quantity <= minLevel) {
            return false;
          }

          if (stockFilter === 'outOfStock' && quantity > 0) {
            return false;
          }
        }

        return true;
      });
    },
    [categoryFilter, stockFilter]
  );

  const applySorting = useCallback(
    (items) => {
      if (!Array.isArray(items)) {
        return [];
      }

      const sorted = [...items];

      switch (sortOption) {
        case 'nameDesc':
          sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
          break;
        case 'stockAsc':
          sorted.sort(
            (a, b) => Number(a.stock_quantity ?? 0) - Number(b.stock_quantity ?? 0)
          );
          break;
        case 'stockDesc':
          sorted.sort(
            (a, b) => Number(b.stock_quantity ?? 0) - Number(a.stock_quantity ?? 0)
          );
          break;
        case 'priceAsc':
          sorted.sort(
            (a, b) =>
              Number(a.price ?? a.selling_price ?? 0) -
              Number(b.price ?? b.selling_price ?? 0)
          );
          break;
        case 'priceDesc':
          sorted.sort(
            (a, b) =>
              Number(b.price ?? b.selling_price ?? 0) -
              Number(a.price ?? a.selling_price ?? 0)
          );
          break;
        case 'nameAsc':
        default:
          sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
      }

      return sorted;
    },
    [sortOption]
  );

  const filteredAllProducts = useMemo(
    () => applySorting(applyFilters(filterProductsBySearch(products))),
    [products, filterProductsBySearch, applyFilters, applySorting]
  );

  const restockProducts = useMemo(
    () =>
      restockList
        .map((productId) => products.find((product) => product.id === productId))
        .filter(Boolean),
    [restockList, products]
  );

  const categoryOptions = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      const category = (product.category || '').trim();
      if (category) {
        set.add(category);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredRestockProducts = useMemo(
    () => applySorting(applyFilters(filterProductsBySearch(restockProducts))),
    [restockProducts, filterProductsBySearch, applyFilters, applySorting]
  );

  const filteredLowStockProducts = useMemo(
    () => applySorting(applyFilters(filterProductsBySearch(lowStockProducts))),
    [lowStockProducts, filterProductsBySearch, applyFilters, applySorting]
  );

  const totalRestockProducts = restockProducts.length;

  const displayedProducts = useMemo(() => {
    if (activeTab === 'lowStock') {
      return filteredLowStockProducts;
    }
    if (activeTab === 'restock') {
      return filteredRestockProducts;
    }
    return filteredAllProducts;
  }, [activeTab, filteredAllProducts, filteredLowStockProducts, filteredRestockProducts]);
  const displayedProductsCount = displayedProducts.length;
  const totalItemsInTab = useMemo(() => {
    if (activeTab === 'lowStock') {
      return lowStockProducts.length;
    }
    if (activeTab === 'restock') {
      return totalRestockProducts;
    }
    return totalProducts;
  }, [activeTab, lowStockProducts.length, totalRestockProducts, totalProducts]);
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
    setRestockList((prev) => {
      const validIds = prev.filter((id) =>
        products.some((product) => product.id === id)
      );
      return validIds.length === prev.length ? prev : validIds;
    });
  }, [products]);

  const restockSet = useMemo(() => new Set(restockList), [restockList]);

  const handleToggleRestock = useCallback(
    (productId) => {
      if (!productId) return;
      setRestockList((prev) =>
        prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
      );
    },
    []
  );

  const handleExportRestockList = useCallback(() => {
    if (restockProducts.length === 0) {
      alert('Your restock list is empty. Add products before exporting.');
      return;
    }

    const exportData = restockProducts.map((product, index) => {
      const costValue = Number(product.cost ?? product.cost_price ?? 0);
      const finalPriceValue =
        product.final_price !== undefined && product.final_price !== null
          ? Number(product.final_price)
          : calculateFinalPrice(costValue);
      const sellingPriceValue = Number(product.price ?? product.selling_price ?? 0);

      return {
        '#': index + 1,
        Name: product.name || '',
        Barcode: product.description || '',
        SKU: product.sku || '',
        Category: product.category || '',
        'Cost Price': costValue,
        'Final Price': finalPriceValue,
        'Selling Price': sellingPriceValue,
        Stock: Number(product.stock_quantity ?? 0),
        'Minimum Stock Level': Number(product.min_stock_level ?? 10),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Restock List');

    const fileName = `Restock_List_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [restockProducts]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await inventoryAPI.uploadImage(uploadData);
      if (response.data && response.data.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          image_url: response.data.imageUrl,
        }));
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

      const cost = parseFloat(formData.cost) || 0;
      const sellingPrice = parseFloat(formData.price) || 0;

      const data = {
        name: formData.name,
        description: formData.description, // Product Barcode
        sku: editing ? (formData.sku || null) : null,
        category: '',
        price: sellingPrice, // Selling price (sticker)
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

    // Require password confirmation
    const passwordInput = window.prompt(
      `⚠️ FINAL WARNING: Deleting all products is irreversible.\n\n` +
      `Enter the delete password to continue:`
    );

    if (passwordInput === null) {
      alert('Deletion cancelled.');
      return;
    }

    if (passwordInput !== DELETE_ALL_PASSWORD) {
      alert('Deletion cancelled. Incorrect password.');
      return;
    }

    try {
      console.log('🗑️ Calling deleteAll API...');
      console.log('Current products count:', products.length);
      
      if (products.length === 0) {
        alert('No products to delete.');
        return;
      }
      
      const response = await inventoryAPI.deleteAll();
      console.log('✅ Delete all response:', response);
      console.log('Response status:', response?.status);
      console.log('Response data:', response?.data);
      
      if (response && response.data) {
        const deletedCount = response.data.count !== undefined ? response.data.count : 0;
        const message = response.data.message || `Successfully deleted ${deletedCount} product(s)`;
        
        alert(`✅ ${message}`);
        
        // Clear the products state immediately
        setProducts([]);
        
        // Refresh the product list to confirm
        await fetchProducts();
      } else {
        throw new Error('Invalid response from server - no data received');
      }
    } catch (err) {
      console.error('❌ Error deleting all products:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      console.error('Full error:', err);
      
      let errorMsg = 'Failed to delete all products';
      if (err.response?.status === 404) {
        errorMsg = 'Delete endpoint not found (404). The route may not be registered correctly.';
      } else if (err.response?.status === 400) {
        errorMsg = err.response.data?.error || 'Invalid request. Please check server logs.';
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      alert(`❌ Error: ${errorMsg}\n\nPlease check the browser console for more details.`);
    }
  };

  // eslint-disable-next-line no-unused-vars
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
    setRetryFeedback(null);
    setFailedImportRows([]);

    const formData = new FormData();
    formData.append('excel', file);

    try {
      const response = await inventoryAPI.importExcel(formData);
      
      console.log('Import response:', response.data);
      
      const successCount = response.data.success || 0;
      const errors = response.data.errors || [];
      const failedRows = response.data.failedRows || [];
      
      setImportMessage({
        type: 'success',
        text: response.data.message || `Successfully imported ${successCount} product${successCount !== 1 ? 's' : ''}`,
        errors: errors
      });

      setFailedImportRows(failedRows);
      if (failedRows.length > 0) {
        setRetryFeedback({
          type: 'warning',
          text: `${failedRows.length} row${failedRows.length !== 1 ? 's' : ''} failed to import. Review details below to retry.`,
        });
      }

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
      const failedRows = err.response?.data?.failedRows || [];
      if (failedRows.length > 0) {
        setFailedImportRows(failedRows);
        setRetryFeedback({
          type: 'error',
          text: `${failedRows.length} row${failedRows.length !== 1 ? 's' : ''} failed to import. Review details below to retry.`,
        });
      }
      setImportMessage({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Failed to import products from Excel'
      });
    } finally {
      setImporting(false);
      // Clear message after 10 seconds (longer for errors)
      setTimeout(() => setImportMessage(null), 10000);
      setTimeout(() => setRetryFeedback(null), 15000);
    }
  };

  const normalizeProductPayload = (product) => ({
    ...product,
    price: Number(product.price) || 0,
    cost: Number(product.cost) || 0,
    stock_quantity: Number(product.stock_quantity) || 0,
    min_stock_level: Number(product.min_stock_level) || 10,
  });

  const handleRetryFailedRow = async (row, index) => {
    setRetryingRowIndex(index);
    setRetryFeedback(null);
    try {
      const payload = normalizeProductPayload(row.product || {});
      await inventoryAPI.create(payload);
      setFailedImportRows((prev) => prev.filter((_, i) => i !== index));
      setRetryFeedback({ type: 'success', text: `Row ${row.rowNumber} imported successfully.` });
      await fetchProducts();
    } catch (err) {
      console.error('Retry failed row error:', err);
      setRetryFeedback({
        type: 'error',
        text: err.response?.data?.error || err.message || `Failed to import row ${row.rowNumber}.`,
      });
    } finally {
      setRetryingRowIndex(null);
      setTimeout(() => setRetryFeedback(null), 10000);
    }
  };

  const handleRetryAllFailedRows = async () => {
    if (failedImportRows.length === 0) return;
    setRetryAllLoading(true);
    setRetryFeedback(null);

    const remaining = [];
    let successCount = 0;
    const errors = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const row of failedImportRows) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await inventoryAPI.create(normalizeProductPayload(row.product || {}));
        successCount += 1;
      } catch (err) {
        console.error('Retry all row error:', err);
        errors.push(`Row ${row.rowNumber}: ${err.response?.data?.error || err.message}`);
        remaining.push(row);
      }
    }

    setFailedImportRows(remaining);
    if (successCount > 0) {
      await fetchProducts();
    }

    if (remaining.length === 0) {
      setRetryFeedback({
        type: 'success',
        text: `Successfully re-imported ${successCount} row${successCount !== 1 ? 's' : ''}.`,
      });
    } else {
      setRetryFeedback({
        type: 'warning',
        text: `${successCount} row${successCount !== 1 ? 's' : ''} re-imported successfully, ${remaining.length} still failing. Last errors: ${errors.slice(0, 3).join(' | ')}`,
      });
    }

    setRetryAllLoading(false);
    setTimeout(() => setRetryFeedback(null), 12000);
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
        <Box>
          <Typography variant="h4">Inventory</Typography>
          <Typography variant="body2" color="text.secondary">
          {(() => {
            if (activeTab === 'lowStock') {
              return `Low stock products: ${lowStockProducts.length}`;
            }
            if (activeTab === 'restock') {
              return `Restock list: ${totalRestockProducts} item${totalRestockProducts === 1 ? '' : 's'}`;
            }
            return `Total products: ${totalProducts}`;
          })()}
          {searchTerm && displayedProductsCount !== totalItemsInTab &&
            ` • Showing ${displayedProductsCount} match${displayedProductsCount === 1 ? '' : 'es'}`}
          </Typography>
        </Box>
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

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Stock Status</InputLabel>
            <Select
              value={stockFilter}
              label="Stock Status"
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <MenuItem value="all">All Stock Levels</MenuItem>
              <MenuItem value="low">Low / At Minimum</MenuItem>
              <MenuItem value="inStock">Above Minimum</MenuItem>
              <MenuItem value="outOfStock">Out of Stock</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortOption}
              label="Sort By"
              onChange={(e) => setSortOption(e.target.value)}
            >
              <MenuItem value="nameAsc">Name (A → Z)</MenuItem>
              <MenuItem value="nameDesc">Name (Z → A)</MenuItem>
              <MenuItem value="stockAsc">Stock (Low → High)</MenuItem>
              <MenuItem value="stockDesc">Stock (High → Low)</MenuItem>
              <MenuItem value="priceAsc">Price (Low → High)</MenuItem>
              <MenuItem value="priceDesc">Price (High → Low)</MenuItem>
            </Select>
          </FormControl>

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

          {activeTab === 'restock' && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportRestockList}
              disabled={restockProducts.length === 0}
            >
              Export Restock List
            </Button>
          )}

          <GenerateStickersButton />

          {/* Add Product Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Product
        </Button>
      </Box>

      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          <Tab
            label={`All Products (${totalProducts})`}
            value="all"
          />
          <Tab
            label={`Low Stock (${lowStockProducts.length})`}
            value="lowStock"
            sx={lowStockProducts.length > 0 ? { color: (theme) => theme.palette.error.main } : undefined}
          />
          <Tab
            label={`Restock List (${totalRestockProducts})`}
            value="restock"
          />
        </Tabs>
      </Paper>
      </Box>

      {activeTab === 'lowStock' && (
        <Alert
          severity={lowStockProducts.length === 0 ? 'success' : 'warning'}
          sx={{ mb: 3 }}
        >
          {lowStockProducts.length === 0
            ? 'Great news! All products are above their minimum stock levels.'
            : 'These items are at or below their minimum stock levels. Consider reordering soon.'}
        </Alert>
      )}

      {activeTab === 'restock' && (
        <Alert
          severity={totalRestockProducts === 0 ? 'info' : 'warning'}
          sx={{ mb: 3 }}
        >
          {totalRestockProducts === 0
            ? 'Use the plus icon next to a product to add it to your restock list.'
            : 'This is your restock list. Export or order these items to replenish inventory.'}
        </Alert>
      )}

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

      {retryFeedback && (
        <Alert
          severity={retryFeedback.type}
          onClose={() => setRetryFeedback(null)}
          sx={{ mb: 2 }}
        >
          {retryFeedback.text}
        </Alert>
      )}

      {failedImportRows.length > 0 && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="h6">Failed Import Rows</Typography>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleRetryAllFailedRows}
              disabled={retryAllLoading}
              startIcon={retryAllLoading ? <CircularProgress color="inherit" size={16} /> : null}
            >
              {retryAllLoading ? 'Retrying…' : 'Retry All Failed'}
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Barcode</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Error</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedImportRows.map((row, idx) => (
                  <TableRow key={`${row.rowNumber}-${row.product?.sku || idx}`} hover>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.product?.name || '-'}</TableCell>
                    <TableCell>{row.product?.description || '-'}</TableCell>
                    <TableCell>{row.product?.sku || '-'}</TableCell>
                    <TableCell>{row.product?.stock_quantity ?? '-'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {row.error}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleRetryFailedRow(row, idx)}
                        disabled={retryingRowIndex === idx || retryAllLoading}
                        startIcon={retryingRowIndex === idx ? <CircularProgress size={14} /> : null}
                      >
                        {retryingRowIndex === idx ? 'Retrying…' : 'Retry'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
              <TableCell>Cost Price</TableCell>
              <TableCell>Final Price</TableCell>
              <TableCell>Selling Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedProductsCount === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {searchTerm
                      ? 'No products found matching your search.'
                      : activeTab === 'lowStock'
                        ? 'No low stock items found.'
                        : activeTab === 'restock'
                          ? 'No products in your restock list yet.'
                          : 'No products found. Add a product to get started.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayedProducts.map((product) => {
                const costValue = Number(product.cost ?? product.cost_price ?? 0);
                const finalPriceValue = product.final_price !== undefined && product.final_price !== null
                  ? Number(product.final_price)
                  : calculateFinalPrice(costValue);
                const sellingPriceValue = Number(product.price ?? product.selling_price ?? 0);
                const isInRestock = restockSet.has(product.id);

                return (
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
                          {product.name?.charAt(0) || '-'}
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
                    <TableCell>₪{costValue.toFixed(2)}</TableCell>
                    <TableCell>₪{finalPriceValue.toFixed(2)}</TableCell>
                    <TableCell>₪{sellingPriceValue.toFixed(2)}</TableCell>
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
                  <Tooltip title={isInRestock ? 'Remove from restock list' : 'Add to restock list'}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleRestock(product.id)}
                        color={isInRestock ? 'primary' : 'default'}
                      >
                        {isInRestock ? <RemoveCircleOutlineIcon /> : <PlaylistAddIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <IconButton size="small" onClick={() => handleOpen(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
                );
              })
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

