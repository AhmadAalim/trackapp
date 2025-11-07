import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import QRCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import { stickersAPI } from '../services/api';

const SIZE_OPTIONS = [
  { value: '30x40', label: '30 × 40 mm' },
  { value: '15x30', label: '15 × 30 mm' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF (Printable)' },
  { value: 'zpl', label: 'ZPL (Thermal Printer)' },
];

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const GenerateStickersButton = () => {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState('30x40');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleOpen = () => {
    setError(null);
    setSuccessMessage(null);
    setOpen(true);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await stickersAPI.generate({ size, format });
      const contentType = format === 'pdf' ? 'application/pdf' : 'text/plain';
      const extension = format === 'pdf' ? 'pdf' : 'zpl';
      const blob = new Blob([response.data], { type: contentType });
      downloadBlob(blob, `stickers-${size}.${extension}`);
      setSuccessMessage(`Stickers generated successfully as ${extension.toUpperCase()}.`);
    } catch (err) {
      console.error('Failed to generate stickers:', err);
      const message = err.response?.data?.error || err.message || 'Failed to generate stickers.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<QRCode2Icon />}
        onClick={handleOpen}
      >
        Generate Stickers
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Generate Stickers</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Choose the sticker size and output format. The system will generate one sticker per item based on the current inventory quantity.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {successMessage && <Alert severity="success">{successMessage}</Alert>}
            <FormControl fullWidth size="small">
              <InputLabel id="sticker-size-label">Sticker Size</InputLabel>
              <Select
                labelId="sticker-size-label"
                value={size}
                label="Sticker Size"
                onChange={(event) => setSize(event.target.value)}
              >
                {SIZE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="sticker-format-label">Output Format</InputLabel>
              <Select
                labelId="sticker-format-label"
                value={format}
                label="Output Format"
                onChange={(event) => setFormat(event.target.value)}
              >
                {FORMAT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            variant="contained"
            startIcon={loading ? <CircularProgress color="inherit" size={18} /> : <PrintIcon />}
            disabled={loading}
          >
            {loading ? 'Generating…' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GenerateStickersButton;

