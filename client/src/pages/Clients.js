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
  Chip,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import { clientsAPI } from '../services/api';

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    initial_balance: '',
  });
  const [transactionData, setTransactionData] = useState({
    transaction_type: 'charge',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getAll();
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (id) => {
    try {
      const response = await clientsAPI.getById(id);
      return response.data;
    } catch (err) {
      console.error('Error fetching client details:', err);
      return null;
    }
  };

  const handleOpen = (client = null) => {
    if (client) {
      setEditing(client.id);
      setFormData({
        name: client.name || '',
        contact_person: client.contact_person || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        notes: client.notes || '',
        initial_balance: '',
      });
    } else {
      setEditing(null);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
        initial_balance: '',
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
      if (!formData.name.trim()) {
        alert('Client name is required');
        return;
      }

      const data = {
        name: formData.name.trim(),
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
      };

      if (!editing && formData.initial_balance) {
        data.initial_balance = parseFloat(formData.initial_balance) || 0;
      }

      if (editing) {
        await clientsAPI.update(editing, data);
      } else {
        await clientsAPI.create(data);
      }
      fetchClients();
      handleClose();
    } catch (err) {
      console.error('Error saving client:', err);
      const msg = err?.response?.data?.error || err.message || 'Error saving client';
      alert(`Error: ${msg}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client? All transactions will also be deleted.')) {
      try {
        await clientsAPI.delete(id);
        fetchClients();
      } catch (err) {
        console.error('Error deleting client:', err);
        alert('Error deleting client');
      }
    }
  };

  const handleOpenTransactionDialog = (client) => {
    setSelectedClient(client);
    setTransactionData({
      transaction_type: 'charge',
      amount: '',
      description: '',
    });
    setTransactionDialogOpen(true);
  };

  const handleCloseTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setSelectedClient(null);
  };

  const handleSubmitTransaction = async () => {
    try {
      if (!transactionData.amount || parseFloat(transactionData.amount) <= 0) {
        alert('Please enter a valid amount greater than 0');
        return;
      }

      await clientsAPI.addTransaction(selectedClient.id, transactionData);
      fetchClients();
      handleCloseTransactionDialog();
      
      // Refresh client details if viewing
      if (viewClient && viewClient.id === selectedClient.id) {
        const updated = await fetchClientDetails(selectedClient.id);
        if (updated) setViewClient(updated);
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      const msg = err?.response?.data?.error || err.message || 'Error adding transaction';
      alert(`Error: ${msg}`);
    }
  };

  const handleViewClient = async (client) => {
    const details = await fetchClientDetails(client.id);
    if (details) {
      setViewClient(details);
      setViewDialogOpen(true);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await clientsAPI.deleteTransaction(transactionId);
        fetchClients();
        
        // Refresh client details if viewing
        if (viewClient) {
          const updated = await fetchClientDetails(viewClient.id);
          if (updated) setViewClient(updated);
        }
      } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('Error deleting transaction');
      }
    }
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance) || 0;
    return `₪${Math.abs(num).toFixed(2)}`;
  };

  const getBalanceColor = (balance) => {
    const num = parseFloat(balance) || 0;
    if (num > 0) return 'error'; // Client owes money (red)
    if (num < 0) return 'success'; // Overpaid (green)
    return 'default'; // Zero balance
  };

  const getBalanceLabel = (balance) => {
    const num = parseFloat(balance) || 0;
    if (num > 0) return 'Owes';
    if (num < 0) return 'Overpaid';
    return 'Paid';
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

  const totalBalance = clients.reduce((sum, client) => sum + (parseFloat(client.balance) || 0), 0);
  const clientsWithBalance = clients.filter((c) => parseFloat(c.balance) !== 0);

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
        <Box>
          <Typography 
            variant="h4"
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            Clients
          </Typography>
          {/* Clients page - Track restaurant balances and transactions */}
          <Typography variant="body2" color="text.secondary">
            {clients.length} client{clients.length !== 1 ? 's' : ''} • 
            Total outstanding: <strong>{formatBalance(totalBalance)}</strong>
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          fullWidth={{ xs: true, sm: false }}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Add Client
        </Button>
      </Box>

      {clientsWithBalance.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {clientsWithBalance.length} client{clientsWithBalance.length !== 1 ? 's have' : ' has'} outstanding balances totaling {formatBalance(totalBalance)}
        </Alert>
      )}

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
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>Contact</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>Phone</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }} align="right">Balance</TableCell>
              <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No clients found. Add a client to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => {
                const balance = parseFloat(client.balance) || 0;
                return (
                  <TableRow key={client.id}>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      <Typography fontWeight={500}>{client.name}</Typography>
                      {client.contact_person && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {client.contact_person}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', md: 'table-cell' } }}>
                      {client.email || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, display: { xs: 'none', lg: 'table-cell' } }}>
                      {client.phone || '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      <Chip
                        label={`${getBalanceLabel(balance)} ${formatBalance(balance)}`}
                        color={getBalanceColor(balance)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewClient(client)} 
                        title="View Details"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenTransactionDialog(client)} 
                        title="Add Transaction"
                        sx={{ minWidth: 44, minHeight: 44 }}
                        color="primary"
                      >
                        <AttachMoneyIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpen(client)} 
                        title="Edit"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(client.id)} 
                        title="Delete"
                        sx={{ minWidth: 44, minHeight: 44 }}
                      >
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

      {/* Create/Edit Client Dialog */}
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
          {editing ? 'Edit Client' : 'Add Client'}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 1.5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Client Name *"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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
              minRows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            {!editing && (
              <TextField
                label="Initial Balance (optional)"
                type="number"
                fullWidth
                value={formData.initial_balance}
                onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                helperText="Positive for charges (client owes), negative for payments"
              />
            )}
            <TextField
              label="Notes"
              fullWidth
              multiline
              minRows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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

      {/* Add Transaction Dialog */}
      <Dialog 
        open={transactionDialogOpen} 
        onClose={handleCloseTransactionDialog} 
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
          Add Transaction - {selectedClient?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 1.5 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Current Balance: <strong>{formatBalance(selectedClient?.balance || 0)}</strong>
            </Alert>
            <FormControl fullWidth>
              <InputLabel>Transaction Type</InputLabel>
              <Select
                value={transactionData.transaction_type}
                label="Transaction Type"
                onChange={(e) => setTransactionData({ ...transactionData, transaction_type: e.target.value })}
              >
                <MenuItem value="charge">
                  <Box display="flex" alignItems="center" gap={1}>
                    <AttachMoneyIcon fontSize="small" />
                    Charge (Client owes)
                  </Box>
                </MenuItem>
                <MenuItem value="payment">
                  <Box display="flex" alignItems="center" gap={1}>
                    <PaymentIcon fontSize="small" />
                    Payment (Client pays)
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount *"
              type="number"
              fullWidth
              value={transactionData.amount}
              onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
              required
              inputProps={{ min: 0, step: 0.01 }}
              helperText={transactionData.transaction_type === 'charge' 
                ? 'This will increase the balance (client owes more)'
                : 'This will decrease the balance (client pays)'}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={transactionData.description}
              onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
              placeholder="e.g., Order #123, Monthly payment, etc."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: 1 }}>
          <Button 
            onClick={handleCloseTransactionDialog}
            fullWidth={{ xs: true, sm: false }}
            sx={{ m: 0 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitTransaction} 
            variant="contained"
            fullWidth={{ xs: true, sm: false }}
            sx={{ m: 0 }}
            startIcon={transactionData.transaction_type === 'charge' ? <AttachMoneyIcon /> : <PaymentIcon />}
          >
            Add {transactionData.transaction_type === 'charge' ? 'Charge' : 'Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Client Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
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
          {viewClient?.name} - Details
        </DialogTitle>
        <DialogContent sx={{ pt: { xs: 2, sm: 1.5 } }}>
          {viewClient && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Client Info */}
              <Box>
                <Typography variant="h6" gutterBottom>Client Information</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {viewClient.contact_person && (
                    <Typography><strong>Contact:</strong> {viewClient.contact_person}</Typography>
                  )}
                  {viewClient.email && (
                    <Typography><strong>Email:</strong> {viewClient.email}</Typography>
                  )}
                  {viewClient.phone && (
                    <Typography><strong>Phone:</strong> {viewClient.phone}</Typography>
                  )}
                  {viewClient.address && (
                    <Typography><strong>Address:</strong> {viewClient.address}</Typography>
                  )}
                  {viewClient.notes && (
                    <Typography><strong>Notes:</strong> {viewClient.notes}</Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Balance Summary */}
              <Box>
                <Typography variant="h6" gutterBottom>Balance Summary</Typography>
                <Chip
                  label={`${getBalanceLabel(viewClient.balance)} ${formatBalance(viewClient.balance)}`}
                  color={getBalanceColor(viewClient.balance)}
                  sx={{ fontSize: '1.1rem', fontWeight: 600, p: 2 }}
                />
              </Box>

              <Divider />

              {/* Transactions */}
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Transaction History</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleOpenTransactionDialog(viewClient);
                    }}
                  >
                    Add Transaction
                  </Button>
                </Box>
                {viewClient.transactions && viewClient.transactions.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewClient.transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={transaction.transaction_type === 'charge' ? 'Charge' : 'Payment'}
                                color={transaction.transaction_type === 'charge' ? 'error' : 'success'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {formatBalance(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              {transaction.description || '-'}
                              {transaction.related_order_number && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  Order: {transaction.related_order_number}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                title="Delete Transaction"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No transactions yet. Add a transaction to track balance changes.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2 } }}>
          <Button 
            onClick={() => setViewDialogOpen(false)}
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

export default Clients;

