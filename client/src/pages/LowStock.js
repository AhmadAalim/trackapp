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
  Typography,
  Box,
  CircularProgress,
  Avatar,
  Chip,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { inventoryAPI } from '../services/api';

function LowStock() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  const fetchLowStockItems = async () => {
    try {
      const response = await inventoryAPI.getLowStock();
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching low stock items:', err);
    } finally {
      setLoading(false);
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
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <WarningIcon color="warning" sx={{ fontSize: 40 }} />
        <Box>
          <Typography variant="h4">Low Stock Items</Typography>
          <Typography variant="body2" color="text.secondary">
            Products that need restocking ({products.length} item{products.length !== 1 ? 's' : ''})
          </Typography>
        </Box>
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

