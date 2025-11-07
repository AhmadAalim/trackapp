import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';
import Barcode from 'react-barcode';
import { inventoryAPI } from '../services/api';

const stickerSizes = {
  '40x30': {
    label: '40 × 30 mm',
    widthCm: 4,
    heightCm: 3,
    columns: { xs: 1, sm: 2, md: 3, lg: 4 },
  },
  '15x30': {
    label: '15 × 30 mm',
    widthCm: 3,
    heightCm: 1.5,
    columns: { xs: 2, sm: 4, md: 6, lg: 8 },
  },
};

const StickerGenerator = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [shareStatus, setShareStatus] = useState(null);
  const [selectedSize, setSelectedSize] = useState('40x30');
  const [selectionInitialized, setSelectionInitialized] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await inventoryAPI.getAll();
        setProducts(response.data || []);
      } catch (err) {
        console.error('Failed to fetch products for stickers:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter((product) => {
      const barcode = product.description || '';
      return (
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        barcode?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  const selectableProductIds = useMemo(
    () => filteredProducts.map((product) => product.id).filter(Boolean),
    [filteredProducts]
  );

  const selectedProducts = useMemo(() => {
    if (selectedIds.length === 0) {
      return [];
    }
    const selectedSet = new Set(selectedIds);
    return filteredProducts.filter((product) => product.id && selectedSet.has(product.id));
  }, [filteredProducts, selectedIds]);
  const totalProducts = products.length;
  const filteredCount = filteredProducts.length;
  const selectedCount = selectedProducts.length;

  const toggleSelection = (id) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds([...selectableProductIds]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  useEffect(() => {
    const currentIds = filteredProducts.map((product) => product.id).filter(Boolean);
    if (!selectionInitialized) {
      setSelectedIds(currentIds);
      setSelectionInitialized(true);
      return;
    }
    setSelectedIds((prev) => {
      if (prev.length === 0) {
        return prev;
      }
      const currentSet = new Set(currentIds);
      const filteredSelection = prev.filter((id) => currentSet.has(id));
      return filteredSelection;
    });
  }, [filteredProducts, selectionInitialized]);

  const handlePrint = (sizeKey) => {
    setSelectedSize(sizeKey);
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to print stickers.');
      return;
    }
    window.print();
  };

  const formatStickerText = () => {
    return selectedProducts
      .map((product) => {
        const price = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
        const barcode = product.description || 'N/A';
        return `${product.name} | SKU: ${product.sku || 'N/A'} | Barcode: ${barcode} | ₪${price}`;
      })
      .join('\n');
  };

  const handleShare = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to share stickers.');
      return;
    }

    const textToShare = formatStickerText();

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Product Stickers',
          text: textToShare,
        });
        setShareStatus({ type: 'success', message: 'Stickers shared successfully!' });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToShare);
        setShareStatus({ type: 'info', message: 'Sticker details copied to clipboard.' });
      } else {
        setShareStatus({
          type: 'warning',
          message: 'Sharing is not supported on this device. Please copy manually.',
        });
      }
    } catch (err) {
      console.error('Failed to share stickers:', err);
      setShareStatus({ type: 'error', message: 'Failed to share stickers. Please try again.' });
    }

    setTimeout(() => setShareStatus(null), 5000);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #sticker-print-area, #sticker-print-area * {
            visibility: visible;
          }
          #sticker-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 16px;
          }
          .no-print {
            display: none !important;
          }
          .sticker-card {
            width: ${stickerSizes[selectedSize].widthCm}cm !important;
            min-height: ${stickerSizes[selectedSize].heightCm}cm !important;
          }
        }
      `}</style>
      <Box className="no-print" mb={3} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">
            Sticker Generator
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total products: {totalProducts} • Showing: {filteredCount} • Selected: {selectedCount}
          </Typography>
        </Box>
        <TextField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, SKU, barcode or category"
          size="small"
          sx={{ minWidth: 240 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" startIcon={<SelectAllIcon />} onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outlined" startIcon={<ClearAllIcon />} onClick={clearSelection}>
          Clear Selection
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('40x30')}
        >
          Print 40 × 30 mm
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('15x30')}
        >
          Print 15 × 30 mm
        </Button>
        <Button variant="contained" color="secondary" startIcon={<ShareIcon />} onClick={handleShare}>
          Share Stickers
        </Button>
      </Box>

      {shareStatus && (
        <Alert severity={shareStatus.type} className="no-print" sx={{ mb: 2 }}>
          {shareStatus.message}
        </Alert>
      )}

      <Paper className="no-print" sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedIds.length > 0 && selectedIds.length < selectableProductIds.length}
                    checked={selectableProductIds.length > 0 && selectedIds.length === selectableProductIds.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAll();
                      } else {
                        clearSelection();
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Barcode</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Selling Price (₪)</TableCell>
                <TableCell align="right">Stock</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => {
                const barcode = product.description || '';
                const sellingPrice = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
                return (
                  <TableRow key={product.id} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                          checked={product.id ? selectedIds.includes(product.id) : false}
                          onChange={() => toggleSelection(product.id)}
                      />
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{barcode || '-'}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell align="right">₪{sellingPrice}</TableCell>
                    <TableCell align="right">{product.stock_quantity ?? 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box
        id="sticker-print-area"
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: `repeat(${stickerSizes[selectedSize].columns.xs}, 1fr)`,
            sm: `repeat(${stickerSizes[selectedSize].columns.sm}, 1fr)`,
            md: `repeat(${stickerSizes[selectedSize].columns.md}, 1fr)`,
            lg: `repeat(${stickerSizes[selectedSize].columns.lg}, 1fr)`,
          },
        }}
      >
        {selectedProducts.map((product) => {
          const barcodeValue = product.description || product.sku || '';
          const sellingPrice = Number(product.price ?? product.selling_price ?? 0).toFixed(2);

          return (
            <Paper
              key={`sticker-${product.id}`}
              elevation={3}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: stickerSizes[selectedSize].heightCm * 28,
                width: '100%',
              }}
              className="sticker-card"
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
                {product.name}
              </Typography>
              {barcodeValue ? (
                <Barcode
                  value={barcodeValue}
                  width={1.5}
                  height={60}
                  displayValue
                  fontSize={14}
                  margin={4}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  No barcode
                </Typography>
              )}
              <Box mt={1} width="100%" display="flex" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  SKU: {product.sku || 'N/A'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  ₪{sellingPrice}
                </Typography>
              </Box>
            </Paper>
          );
        })}
        {selectedProducts.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No products selected. Use the table above to choose which stickers to generate.
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default StickerGenerator;

