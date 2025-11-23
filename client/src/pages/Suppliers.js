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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { suppliersAPI } from '../services/api';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersAPI.getAll();
      setSuppliers(response.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (supplier = null) => {
    if (supplier) {
      setEditing(supplier.id);
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await suppliersAPI.update(editing, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      fetchSuppliers();
      handleClose();
    } catch (err) {
      console.error('Error saving supplier:', err);
      alert('Error saving supplier');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await suppliersAPI.delete(id);
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        alert('Error deleting supplier');
      }
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
          Suppliers
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          fullWidth={{ xs: true, sm: false }}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Add Supplier
        </Button>
      </Box>

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
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Name</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Contact Person</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Email</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Phone</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', xl: 'table-cell' } }}>Address</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{supplier.name}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>{supplier.contact_person}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{supplier.email}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>{supplier.phone}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', xl: 'table-cell' } }}>{supplier.address}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpen(supplier)}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(supplier.id)}
                    sx={{ minWidth: 44, minHeight: 44 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open} 
        onClose={handleClose} 
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
        <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {editing ? 'Edit Supplier' : 'Add Supplier'}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 2 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              label="Contact Person"
              fullWidth
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              label="Phone"
              fullWidth
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
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
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Suppliers;
