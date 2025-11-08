import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import CategoryIcon from '@mui/icons-material/Category';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import NumbersIcon from '@mui/icons-material/Numbers';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { BrowserMultiFormatReader, BrowserCodeReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { inventoryAPI } from '../services/api';

const DEFAULT_API_BASE = 'http://localhost:5001/api';
const API_ROOT = (process.env.REACT_APP_API_URL || DEFAULT_API_BASE).replace(/\/api\/?$/, '');

const formatCurrency = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 'N/A';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch (error) {
    return `₪${numericValue.toFixed(2)}`;
  }
};

const formatNumber = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return 'N/A';
  }
  return numericValue.toLocaleString();
};

const buildImageUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${API_ROOT}${path.startsWith('/') ? path : `/${path}`}`;
};

const DetailRow = ({ label, value, icon: IconComponent }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {IconComponent ? <IconComponent fontSize="small" color="action" /> : null}
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
    <Typography variant="body2" fontWeight={500}>
      {value}
    </Typography>
  </Box>
);

function Items() {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  const theme = useTheme();
  const fullScreenScanner = useMediaQuery(theme.breakpoints.down('sm'));

  const hasActiveSearch = useMemo(() => activeSearch.trim().length > 0, [activeSearch]);
  const totalMatches = products.length;

  const fetchProducts = useCallback(
    async (searchTerm) => {
      setLoading(true);
      setError(null);
      try {
        const trimmedTerm = searchTerm.trim();
        const response = await inventoryAPI.getAll(trimmedTerm ? trimmedTerm : undefined);
        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to fetch items';
        setError(message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      await fetchProducts(activeSearch);
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [activeSearch, fetchProducts]);

  const handleSearch = () => {
    setActiveSearch(searchInput);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchInput('');
    if (hasActiveSearch) {
      setActiveSearch('');
    }
  };

  const handleOpenScanner = () => {
    setScannerError(null);
    setScannerOpen(true);
  };

  const handleScannerClose = useCallback(() => {
    setScannerOpen(false);
  }, []);

  const statusMessage = useMemo(() => {
    if (loading) {
      return hasActiveSearch
        ? 'Searching for products...'
        : 'Loading product catalog...';
    }
    if (error) {
      return 'Unable to load items right now.';
    }
    if (totalMatches === 0) {
      return hasActiveSearch
        ? 'No products matched the search criteria.'
        : 'No products found in the catalog.';
    }
    return hasActiveSearch
      ? `${totalMatches} product${totalMatches === 1 ? '' : 's'} matched your search.`
      : `Showing ${totalMatches} product${totalMatches === 1 ? '' : 's'} from the catalog.`;
  }, [loading, error, totalMatches, hasActiveSearch]);

  useEffect(() => {
    if (!scannerOpen) {
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
        } catch (resetError) {
          console.error('Scanner reset error:', resetError);
        }
        codeReaderRef.current = null;
      }
      const videoElement = videoRef.current;
      if (videoElement) {
        const stream = videoElement.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (videoElement.srcObject) {
          videoElement.srcObject = null;
        }
      }
      return undefined;
    }

    let cancelled = false;
    setScannerError(null);

    const startScanner = async () => {
      try {
        const codeReader = new BrowserMultiFormatReader();
        codeReaderRef.current = codeReader;

        let videoInputDevices = [];
        try {
          videoInputDevices = await BrowserCodeReader.listVideoInputDevices();
        } catch (deviceError) {
          console.warn('Default device enumeration failed, trying mediaDevices fallback:', deviceError);
          if (navigator.mediaDevices?.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoInputDevices = devices.filter((device) => device.kind === 'videoinput');
          } else {
            throw new Error('Camera enumeration is not supported by this browser.');
          }
        }
        if (cancelled) {
          return;
        }

        if (!videoInputDevices || videoInputDevices.length === 0) {
          throw new Error('No camera devices detected. Connect a camera and try again.');
        }

        const environmentDevice =
          videoInputDevices.find((device) => /back|rear|environment/i.test(device.label)) ||
          videoInputDevices[videoInputDevices.length - 1];

        await codeReader.decodeFromVideoDevice(
          environmentDevice?.deviceId,
          videoRef.current,
          (result, err) => {
            if (cancelled) {
              return;
            }

            if (result) {
              const text = result.getText().trim();
              if (text) {
                setSearchInput(text);
                setActiveSearch(text);
              }
              handleScannerClose();
            } else if (err && !(err instanceof NotFoundException)) {
              console.error('Barcode scan error:', err);
              setScannerError(err.message || 'Unable to read the barcode. Please try again.');
            }
          }
        );
      } catch (scanError) {
        console.error('Failed to start barcode scanner:', scanError);
        if (!cancelled) {
          setScannerError(
            scanError.message || 'Unable to access the camera. Check permissions and try again.'
          );
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
        } catch (resetError) {
          console.error('Scanner reset error:', resetError);
        }
        codeReaderRef.current = null;
      }
      const videoElement = videoRef.current;
      if (videoElement) {
        const stream = videoElement.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
        if (videoElement.srcObject) {
          videoElement.srcObject = null;
        }
      }
    };
  }, [scannerOpen, handleScannerClose]);

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 3,
        }}
      >
        <Typography variant="h4">Items</Typography>
        <Typography variant="body2" color="text.secondary">
          Look up any product by name, barcode, SKU, special code, or category to review its store location, costs, pricing guidance, and sticker price. This page is view-only.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            p: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
            fullWidth
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by product name, barcode, SKU, special code, or category"
            label="Find a product"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton aria-label="clear search" onClick={handleClear} edge="end">
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            }}
          />
          <Button
            variant="contained"
            size="large"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            sx={{ minWidth: { sm: 160 }, width: { xs: '100%', sm: 'auto' } }}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={handleOpenScanner}
            startIcon={<QrCodeScannerIcon />}
            sx={{ minWidth: { sm: 160 }, width: { xs: '100%', sm: 'auto' } }}
          >
            Scan Barcode
          </Button>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {statusMessage}
          </Typography>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : totalMatches === 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            p: { xs: 3, md: 5 },
            textAlign: 'center',
          }}
        >
          <Inventory2Icon color="disabled" sx={{ fontSize: 56, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {hasActiveSearch ? 'No matches found' : 'Inventory is empty'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {hasActiveSearch
              ? 'Try adjusting the name, barcode, SKU, special code, or category you entered.'
              : 'Once products are added to the inventory, they will appear here.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => {
            const costValue = product.cost ?? product.cost_price;
            const finalPriceValue =
              product.final_price ?? product.finalPrice ?? product.recommended_price;
            const sellingPriceValue = product.price ?? product.selling_price ?? product.sticker_price;
            const stockQuantity = product.stock_quantity ?? product.quantity;
            const minStockLevel = product.min_stock_level ?? product.min_stock ?? 0;
            const isLowStock =
              typeof stockQuantity === 'number' &&
              typeof minStockLevel === 'number' &&
              stockQuantity <= minStockLevel;

            const imageUrl = buildImageUrl(product.image_url);

            return (
              <Grid item xs={12} md={6} key={product.id || `${product.name}-${product.sku || 'unknown'}`}>
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    p: 2.5,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2.5,
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 160 },
                      flexShrink: 0,
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                    }}
                  >
                    {imageUrl ? (
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={product.name || 'Product'}
                        sx={{
                          width: '100%',
                          height: 160,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                      />
                    ) : (
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: '100%',
                          height: 160,
                          fontSize: 48,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                          color: 'text.secondary',
                          border: (theme) => `1px dashed ${theme.palette.divider}`,
                        }}
                      >
                        {product.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                    )}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Stack spacing={1.5}>
                      <Box>
                        <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>
                          {product.name || 'Unnamed product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Last updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'Unknown'}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Chip
                          icon={<NumbersIcon />}
                          label={product.sku ? `SKU: ${product.sku}` : 'SKU unavailable'}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<QrCodeScannerIcon />}
                          label={product.description ? `Barcode: ${product.description}` : 'Barcode unavailable'}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<CategoryIcon />}
                          label={product.category ? `Location: ${product.category}` : 'Location not set'}
                          variant="outlined"
                          size="small"
                        />
                        <Chip
                          icon={<Inventory2Icon />}
                          label={`Stock: ${formatNumber(stockQuantity ?? 'N/A')}`}
                          color={isLowStock ? 'warning' : 'default'}
                          variant={isLowStock ? 'filled' : 'outlined'}
                          size="small"
                        />
                      </Stack>

                      <Divider />

                      <Stack spacing={1.25}>
                        <DetailRow
                          label="Store location (category)"
                          value={product.category || 'Not specified'}
                          icon={CategoryIcon}
                        />
                        <DetailRow
                          label="Cost price"
                          value={formatCurrency(costValue)}
                          icon={PriceCheckIcon}
                        />
                        <DetailRow
                          label="Recommended selling price"
                          value={formatCurrency(finalPriceValue)}
                          icon={PriceCheckIcon}
                        />
                        <DetailRow
                          label="Sticker price"
                          value={formatCurrency(sellingPriceValue)}
                          icon={PriceCheckIcon}
                        />
                        <DetailRow
                          label="Quantity on hand"
                          value={formatNumber(stockQuantity)}
                          icon={Inventory2Icon}
                        />
                        <DetailRow
                          label="Minimum stock level"
                          value={formatNumber(minStockLevel)}
                          icon={Inventory2Icon}
                        />
                      </Stack>
                    </Stack>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={scannerOpen}
        onClose={handleScannerClose}
        fullScreen={fullScreenScanner}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Scan Barcode</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              playsInline
              muted
              sx={{
                width: '100%',
                borderRadius: 2,
                backgroundColor: 'black',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                minHeight: 260,
                objectFit: 'cover',
              }}
            />
            <Typography variant="body2" color="text.secondary">
              Align the barcode within the frame. The search box will fill automatically once the
              code is detected.
            </Typography>
            {scannerError && <Alert severity="warning">{scannerError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleScannerClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Items;


