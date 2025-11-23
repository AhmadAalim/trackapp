import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import { inventoryAPI } from '../services/api';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const searchInputRef = useRef(null);

  // Barcode scanner integration
  const handleBarcodeScan = useCallback((barcode) => {
    setScannerActive(true);
    setSearchTerm(barcode);
    // Auto-focus search field
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    // Clear scanner indicator after 2 seconds
    setTimeout(() => setScannerActive(false), 2000);
  }, []);

  useBarcodeScanner(handleBarcodeScan, {
    enabled: true,
    minLength: 3,
    maxLength: 50,
    timeout: 100,
  });

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryAPI.getLowStock();
      setAllProducts(response.data);
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setProducts(allProducts);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allProducts.filter((product) =>
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.category?.toLowerCase().includes(term)
    );
    setProducts(filtered);
  }, [searchTerm, allProducts]);

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
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <WarningIcon color="warning" sx={{ fontSize: 40 }} />
        <Box flexGrow={1}>
          <Typography variant="h4">Low Stock Items</Typography>
          <Typography variant="body2" color="text.secondary">
            Products that need restocking ({products.length} item{products.length !== 1 ? 's' : ''})
          </Typography>
        </Box>
        <TextField
          inputRef={searchInputRef}
          placeholder="Search... (or scan barcode)"
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
            endAdornment: scannerActive ? (
              <InputAdornment position="end">
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
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            minWidth: { xs: '100%', sm: 250 },
            '& .MuiOutlinedInput-root': {
              border: scannerActive ? '2px solid #007AFF' : undefined,
              boxShadow: scannerActive ? '0 0 0 3px rgba(0, 122, 255, 0.2)' : undefined,
              transition: 'all 0.3s ease',
            },
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Min Stock Level</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No low stock items found. All products are well stocked! 🎉
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const isCritical = product.stock_quantity === 0;
                
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
                          {product.name.charAt(0)}
                        </Avatar>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {product.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>₪{parseFloat(product.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          color: isCritical ? 'error.main' : 'warning.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {product.stock_quantity}
                      </Box>
                    </TableCell>
                    <TableCell>{product.min_stock_level}</TableCell>
                    <TableCell>
                      {isCritical ? (
                        <Chip label="Out of Stock" color="error" size="small" />
                      ) : (
                        <Chip label="Low Stock" color="warning" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default LowStock;

