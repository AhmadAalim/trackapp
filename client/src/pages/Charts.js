import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';

function Charts() {
  return (
    <Container maxWidth="xl">
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px solid',
            borderColor: (theme) => theme.palette.divider,
          }}
        >
          <BarChartIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Charts & Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This page is ready for charts and data visualizations.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Charts will be added soon.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

export default Charts;

