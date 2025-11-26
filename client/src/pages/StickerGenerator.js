import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const stickerSizes = {
  '40x30': {
    label: '40 × 30 mm',
    widthCm: 4,
    heightCm: 3,
    columns: { xs: 1, sm: 2, md: 3, lg: 4 },
    barcodeWidth: 1.2,
    barcodeHeight: 50,
    fontSize: 12,
    nameFontSize: '0.75rem',
    skuFontSize: '0.65rem',
    priceFontSize: '0.7rem',
  },
  '15x30': {
    label: '15 × 30 mm',
    widthCm: 3,
    heightCm: 1.5,
    columns: { xs: 2, sm: 4, md: 6, lg: 8 },
    barcodeWidth: 0.8,
    barcodeHeight: 30,
    fontSize: 10,
    nameFontSize: '0.6rem',
    skuFontSize: '0.55rem',
    priceFontSize: '0.6rem',
  },
  '12x30': {
    label: '12 × 30 mm (Niimbot D110)',
    widthCm: 1.2,
    heightCm: 3,
    columns: { xs: 2, sm: 4, md: 6, lg: 8 },
    barcodeWidth: 0.7,
    barcodeHeight: 25,
    fontSize: 9,
    nameFontSize: '0.55rem',
    skuFontSize: '0.5rem',
    priceFontSize: '0.55rem',
  },
  '12x40': {
    label: '12 × 40 mm (Niimbot D110)',
    widthCm: 1.2,
    heightCm: 4,
    columns: { xs: 2, sm: 4, md: 6, lg: 8 },
    barcodeWidth: 0.7,
    barcodeHeight: 35,
    fontSize: 9,
    nameFontSize: '0.55rem',
    skuFontSize: '0.5rem',
    priceFontSize: '0.55rem',
  },
  '15x50': {
    label: '15 × 50 mm (Niimbot D110)',
    widthCm: 1.5,
    heightCm: 5,
    columns: { xs: 2, sm: 3, md: 5, lg: 6 },
    barcodeWidth: 0.9,
    barcodeHeight: 40,
    fontSize: 10,
    nameFontSize: '0.6rem',
    skuFontSize: '0.55rem',
    priceFontSize: '0.65rem',
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
  const [scannerActive, setScannerActive] = useState(false);
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
    ignoreInputs: false, // Allow scanning even when search field is focused
  });

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

  // Expand selected products by stock quantity for sticker generation
  const stickersToGenerate = useMemo(() => {
    const stickers = [];
    selectedProducts.forEach((product) => {
      const stockQuantity = Number(product.stock_quantity ?? 0);
      const quantity = stockQuantity > 0 ? stockQuantity : 1; // At least 1 sticker even if stock is 0
      for (let i = 0; i < quantity; i++) {
        stickers.push({
          ...product,
          stickerIndex: i + 1, // Track which sticker number this is (1, 2, 3, etc.)
        });
      }
    });
    return stickers;
  }, [selectedProducts]);

  const totalProducts = products.length;
  const filteredCount = filteredProducts.length;
  const selectedCount = selectedProducts.length;
  const totalStickers = stickersToGenerate.length;

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
    if (totalStickers === 0) {
      alert('No stickers to print. Selected products have no stock quantity.');
      return;
    }
    window.print();
  };

  const formatStickerText = () => {
    return selectedProducts
      .map((product) => {
        const price = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
        const barcode = product.description || 'N/A';
        const stockQuantity = Number(product.stock_quantity ?? 0);
        const quantity = stockQuantity > 0 ? stockQuantity : 1;
        return `${product.name} (${quantity}x) | SKU: ${product.sku || 'N/A'} | Barcode: ${barcode} | ₪${price}`;
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
    <Container 
      maxWidth="xl"
      sx={{ 
        px: { xs: 0, sm: 2 },
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
      }}
    >
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
            max-width: ${stickerSizes[selectedSize].widthCm}cm !important;
            max-height: ${stickerSizes[selectedSize].heightCm}cm !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sticker-card svg {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
      <Box 
        className="no-print" 
        mb={3} 
        display="flex" 
        flexDirection={{ xs: 'column', md: 'row' }} 
        gap={{ xs: 1.5, md: 1 }} 
        alignItems={{ xs: 'stretch', md: 'center' }}
        flexWrap="wrap"
      >
        <Box sx={{ flexGrow: 1, minWidth: { xs: '100%', md: '200px' } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            Sticker Generator
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Total products: {totalProducts} • Showing: {filteredCount} • Selected: {selectedCount} • Stickers to print: {totalStickers}
          </Typography>
        </Box>
        <TextField
          inputRef={searchInputRef}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search... (or scan barcode)"
          size="small"
          sx={{ 
            minWidth: { xs: '100%', sm: 180, md: 200 },
            maxWidth: { xs: '100%', md: 250 },
            '& .MuiOutlinedInput-root': {
              border: scannerActive ? '2px solid #007AFF' : undefined,
              boxShadow: scannerActive ? '0 0 0 3px rgba(0, 122, 255, 0.2)' : undefined,
              transition: 'all 0.3s ease',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
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
              </InputAdornment>
            ) : undefined,
          }}
        />
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<SelectAllIcon />} 
          onClick={selectAll}
          sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
        >
          Select All
        </Button>
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<ClearAllIcon />} 
          onClick={clearSelection}
          sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
        >
          Clear
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('40x30')}
          sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
        >
          40×30
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('15x30')}
          sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
        >
          15×30
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('12x30')}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 1.5, sm: 2 },
          }}
          title="Print 12×30mm stickers for Niimbot D110"
        >
          12×30 (D110)
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('12x40')}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 1.5, sm: 2 },
          }}
          title="Print 12×40mm stickers for Niimbot D110"
        >
          12×40 (D110)
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('15x50')}
          sx={{ 
            minWidth: 'auto', 
            px: { xs: 1.5, sm: 2 },
          }}
          title="Print 15×50mm stickers for Niimbot D110"
        >
          15×50 (D110)
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          size="small"
          startIcon={<ShareIcon />} 
          onClick={handleShare}
          sx={{ minWidth: 'auto', px: { xs: 1.5, sm: 2 } }}
        >
          Share
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
        {stickersToGenerate.map((product, index) => {
          const barcodeValue = product.description || product.sku || '';
          const sellingPrice = Number(product.price ?? product.selling_price ?? 0).toFixed(2);
          const sizeConfig = stickerSizes[selectedSize];

          return (
            <Paper
              key={`sticker-${product.id}-${product.stickerIndex || index}`}
              elevation={3}
              sx={{
                p: { xs: 0.5, sm: 1 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: sizeConfig.heightCm * 28,
                width: '100%',
                overflow: 'hidden',
                boxSizing: 'border-box',
              }}
              className="sticker-card"
            >
              {/* Product Name */}
              <Typography 
                sx={{ 
                  fontWeight: 600, 
                  textAlign: 'center', 
                  fontSize: sizeConfig.nameFontSize,
                  lineHeight: 1.2,
                  mb: 0.5,
                  px: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  maxWidth: '100%',
                }}
              >
                {product.name}
              </Typography>
              
              {/* Barcode - Responsive to sticker size */}
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  flex: 1,
                  my: 0.5,
                  minHeight: sizeConfig.barcodeHeight * 0.8,
                }}
              >
                {barcodeValue ? (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      overflow: 'hidden',
                      '& svg': {
                        maxWidth: '100%',
                        height: 'auto',
                      },
                    }}
                  >
                    <Barcode
                      value={barcodeValue}
                      width={sizeConfig.barcodeWidth}
                      height={sizeConfig.barcodeHeight}
                      displayValue={false}
                      fontSize={sizeConfig.fontSize}
                      margin={1}
                      format="CODE128"
                    />
                  </Box>
                ) : (
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: sizeConfig.skuFontSize }}
                  >
                    No barcode
                  </Typography>
                )}
              </Box>
              
              {/* SKU and Price */}
              <Box 
                mt={0.5} 
                width="100%" 
                display="flex" 
                justifyContent="space-between"
                alignItems="center"
                sx={{ px: 0.5 }}
              >
                <Typography 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: sizeConfig.skuFontSize,
                    lineHeight: 1,
                  }}
                >
                  {product.sku || 'N/A'}
                </Typography>
                <Typography 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: sizeConfig.priceFontSize,
                    lineHeight: 1,
                  }}
                >
                  ₪{sellingPrice}
                </Typography>
              </Box>
            </Paper>
          );
        })}
        {stickersToGenerate.length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedProducts.length === 0 
                ? 'No products selected. Use the table above to choose which stickers to generate.'
                : 'Selected products have no stock quantity. Please select products with stock to generate stickers.'}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default StickerGenerator;

