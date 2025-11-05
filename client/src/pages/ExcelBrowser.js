import React, { useState } from 'react';
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
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import { excelBrowserAPI, inventoryAPI } from '../services/api';

function ExcelBrowser() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [error, setError] = useState(null);
  const [addingRows, setAddingRows] = useState(new Set());
  const [addingAll, setAddingAll] = useState(false);
  const [addAllProgress, setAddAllProgress] = useState({ done: 0, total: 0, success: 0, errors: 0 });

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      setError('Please select a valid Excel file (.xlsx or .xls)');
      event.target.value = '';
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setError(null);
    setData([]);
    setColumns([]);
    setSheets([]);
    setSelectedSheet('');

    // Auto-upload when file is selected
    await handleUpload(selectedFile);
  };

  const handleUpload = async (fileToUpload = null) => {
    const fileToProcess = fileToUpload || file;
    if (!fileToProcess) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setData([]);
    setColumns([]);
    setSheets([]);
    setSelectedSheet('');

    const formData = new FormData();
    formData.append('excel', fileToProcess);

    try {
      const response = await excelBrowserAPI.uploadAndParse(formData);
      
      console.log('Response:', response);
      console.log('Response.data:', response.data);
      
      if (response.data.error) {
        setError(response.data.error);
        return;
      }

      // Check response structure more carefully
      if (!response || !response.data) {
        console.error('No response data:', response);
        setError('No response received from server');
        return;
      }

      if (!response.data.sheets) {
        console.error('No sheets in response:', response.data);
        setError(`Server response missing sheets. Response keys: ${Object.keys(response.data || {}).join(', ')}`);
        return;
      }

      // Handle case where sheets might be an object instead of array
      let sheetsArray = response.data.sheets;
      
      if (!Array.isArray(sheetsArray)) {
        console.warn('Sheets is not an array, converting from object:', typeof sheetsArray, sheetsArray);
        
        // Try to convert object to array
        if (sheetsArray && typeof sheetsArray === 'object' && sheetsArray !== null) {
          const keys = Object.keys(sheetsArray);
          console.log('Object keys:', keys);
          
          if (keys.length > 0) {
            // Convert object to array - keys are sheet names
            const convertedArray = keys.map(key => {
              const value = sheetsArray[key];
              console.log(`Processing key "${key}":`, value);
              
              // Normalize the value to a sheet object
              if (value && typeof value === 'object') {
                // Value is an object - check what properties it has
                return {
                  name: value.name || key,
                  rowCount: value.rowCount !== undefined ? value.rowCount : (Array.isArray(value.data) ? value.data.length : (Array.isArray(value) ? value.length : 0)),
                  columns: Array.isArray(value.columns) ? value.columns : (value.columns ? [value.columns] : []),
                  data: Array.isArray(value.data) ? value.data : (Array.isArray(value) ? value : [])
                };
              } else if (Array.isArray(value)) {
                // Value is directly an array (data)
                return {
                  name: key,
                  rowCount: value.length,
                  columns: value.length > 0 ? Object.keys(value[0] || {}) : [],
                  data: value
                };
              } else {
                // Value is something else - create minimal sheet
                return {
                  name: key,
                  rowCount: 0,
                  columns: [],
                  data: []
                };
              }
            });
            
            console.log('Converted array:', convertedArray);
            
            if (convertedArray.length > 0) {
              sheetsArray = convertedArray;
              console.log('Successfully converted object to array!');
            } else {
              setError(`Could not convert sheets object to array. Keys: ${keys.join(', ')}`);
              return;
            }
          } else {
            setError(`Invalid sheets format. Empty object received.`);
            return;
          }
        } else {
          setError(`Invalid sheets format. Expected array but got ${typeof sheetsArray}`);
          return;
        }
      }

      // Set sheets (use the converted array)
      setSheets(sheetsArray);
      
      // Show first sheet (or first sheet with data)
      if (sheetsArray.length > 0) {
        const firstSheet = sheetsArray[0];
        setSelectedSheet(firstSheet.name || 'Sheet1');
        setData(Array.isArray(firstSheet.data) ? firstSheet.data : []);
        setColumns(Array.isArray(firstSheet.columns) ? firstSheet.columns : []);
      }

      setError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || err.message || 'Failed to parse Excel file');
      setFile(null);
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  const handleSheetChange = (sheetName) => {
    const sheet = sheets.find((s) => s && s.name === sheetName);
    if (sheet) {
      setSelectedSheet(sheetName);
      setData(Array.isArray(sheet.data) ? sheet.data : []);
      setColumns(Array.isArray(sheet.columns) ? sheet.columns : []);
    }
  };

  const handleAddToInventory = async (row, rowIndex) => {
    // Create a unique key for this row
    const rowKey = `${selectedSheet}-${rowIndex}`;
    
    // Check if already adding
    if (addingRows.has(rowKey)) {
      return;
    }

    setAddingRows(prev => new Set(prev).add(rowKey));

    try {
      // Map Excel row data to product format
      // Try to find values in the row (flexible column matching)
      const getValue = (variations, defaultValue = '') => {
        for (const variant of variations) {
          // Direct match
          if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
            return row[variant];
          }
          // Case-insensitive match
          const rowKey = Object.keys(row).find(k => 
            k && k.toString().toLowerCase() === variant.toLowerCase()
          );
          if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
            return row[rowKey];
          }
        }
        return defaultValue;
      };

      // Helper to safely parse numbers
      const safeParseFloat = (value, defaultValue = 0) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      const safeParseInt = (value, defaultValue = 0) => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Focus on the specific format: Product Code - Product Name - Product Barcode - Quantity - Cost Price - Final Price
      
      // Product Code (ignore for now, don't use for SKU - leave SKU empty)
      
      // Product Description → name field (use Product Description as the product name)
      let productName = getValue([
        'Product Description', 'product description', 'ProductDescription', 'Description', 'description',
        'תיאור פריט', 'תיאור' // Hebrew variations
      ], '');
      
      // Fallback to Product Name if Product Description is not found
      if (!productName || productName.trim() === '') {
        productName = getValue([
          'Product Name', 'product name', 'ProductName', 'Name', 'name', 'Product', 'product',
          'שם מוצר' // Hebrew variations
        ], '');
      }
      
      // Final fallback if name is still empty
      if (!productName || productName.trim() === '') {
        productName = `Product ${selectedSheet} Row ${rowIndex + 1}`;
      }

      // Product Barcode → description field
      const productBarcode = getValue([
        'Product Barcode', 'product barcode', 'ProductBarcode', 'Barcode', 'barcode',
        'ברקוד' // Hebrew
      ], '');

      // Quantity → stock_quantity
      const quantity = getValue([
        'Quantity', 'quantity', 'Qty', 'qty', 'Stock', 'stock', 'Stock Quantity',
        'כמות' // Hebrew
      ], '0');

      // Cost Price → cost
      const costPrice = getValue([
        'Cost Price', 'cost price', 'CostPrice', 'Cost', 'cost', 'Purchase Price', 'purchase price',
        'מחיר עלות', 'עלות' // Hebrew variations
      ], '0');

      // Final Price → price
      const finalPrice = getValue([
        'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
        'מחיר סופי', 'מחיר', 'מחיר לאחר הנחה' // Hebrew variations
      ], '0');

      // Generate SKU: last 4 digits are cost price padded with zeros
      const cost = safeParseFloat(costPrice, 0);
      const costPadded = Math.floor(cost).toString().padStart(4, '0'); // Last 4 digits: 0025 for 25
      
      // Create SKU prefix from product name (first 4 uppercase letters/numbers)
      const namePrefix = productName
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 4)
        .toUpperCase()
        .padEnd(4, 'X'); // Fill with X if name is too short
      
      const generatedSku = `${namePrefix}${costPadded}`;

      const productData = {
        name: productName.trim(), // Product Name → name
        description: productBarcode || '', // Product Barcode → description
        sku: generatedSku, // Generated SKU with cost price as last 4 digits
        category: '',
        price: safeParseFloat(finalPrice, 0), // Final Price → price
        cost: cost, // Cost Price → cost
        stock_quantity: safeParseInt(quantity, 0), // Quantity → stock_quantity
        min_stock_level: 10, // Default
        supplier_id: null,
        image_url: null,
      };

      console.log('Adding product to inventory:', productData);
      console.log('Row data:', row);
      console.log('Columns:', columns);

      // Add product to inventory - no validation, add regardless of missing data or price
      await inventoryAPI.create(productData);
      
      alert(`Product "${productData.name}" added to inventory successfully!`);
    } catch (err) {
      console.error('Error adding product to inventory:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to add product to inventory';
      alert(`Error: ${errorMsg}`);
    } finally {
      setAddingRows(prev => {
        const next = new Set(prev);
        next.delete(rowKey);
        return next;
      });
    }
  };

  const handleAddAllToInventory = async () => {
    if (!data || data.length === 0) {
      alert('No rows to add. Please select a sheet with data.');
      return;
    }

    if (addingAll) return;

    const confirmAdd = window.confirm(
      `Are you sure you want to add all ${data.length} item(s) from this sheet to the inventory?`
    );

    if (!confirmAdd) return;

    setAddingAll(true);
    setAddAllProgress({ done: 0, total: data.length, success: 0, errors: 0 });

    // Helper functions
    const getValue = (row, variations, defaultValue = '') => {
      for (const variant of variations) {
        if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
          return row[variant];
        }
        const rowKey = Object.keys(row).find(k => 
          k && k.toString().toLowerCase() === variant.toLowerCase()
        );
        if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
          return row[rowKey];
        }
      }
      return defaultValue;
    };

    const safeParseFloat = (value, defaultValue = 0) => {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    const safeParseInt = (value, defaultValue = 0) => {
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Product Description → name field
        let productName = getValue(row, [
          'Product Description', 'product description', 'ProductDescription', 'Description', 'description',
          'תיאור פריט', 'תיאור' // Hebrew variations
        ], '');
        
        if (!productName || productName.trim() === '') {
          productName = getValue(row, [
            'Product Name', 'product name', 'ProductName', 'Name', 'name', 'Product', 'product',
            'שם מוצר' // Hebrew variations
          ], '');
        }
        
        if (!productName || productName.trim() === '') {
          productName = `Product ${selectedSheet} Row ${i + 1}`;
        }

        // Product Barcode → description field
        const productBarcode = getValue(row, [
          'Product Barcode', 'product barcode', 'ProductBarcode', 'Barcode', 'barcode',
          'ברקוד' // Hebrew
        ], '');

        // Quantity → stock_quantity
        const quantity = getValue(row, [
          'Quantity', 'quantity', 'Qty', 'qty', 'Stock', 'stock', 'Stock Quantity',
          'כמות' // Hebrew
        ], '0');

        // Cost Price → cost
        const costPrice = getValue(row, [
          'Cost Price', 'cost price', 'CostPrice', 'Cost', 'cost', 'Purchase Price', 'purchase price',
          'מחיר עלות', 'עלות' // Hebrew variations
        ], '0');

        // Final Price → price
        const finalPrice = getValue(row, [
          'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
          'מחיר סופי', 'מחיר', 'מחיר לאחר הנחה' // Hebrew variations
        ], '0');

        // Generate SKU: last 4 digits are cost price padded with zeros
        const cost = safeParseFloat(costPrice, 0);
        const costPadded = Math.floor(cost).toString().padStart(4, '0');
        
        const namePrefix = productName
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 4)
          .toUpperCase()
          .padEnd(4, 'X');
        
        const generatedSku = `${namePrefix}${costPadded}`;

        const productData = {
          name: productName.trim(),
          description: productBarcode || '',
          sku: generatedSku,
          category: '',
          price: safeParseFloat(finalPrice, 0),
          cost: cost,
          stock_quantity: safeParseInt(quantity, 0),
          min_stock_level: 10,
          supplier_id: null,
          image_url: null,
        };

        await inventoryAPI.create(productData);
        successCount++;
        setAddAllProgress(prev => ({ ...prev, done: prev.done + 1, success: prev.success + 1 }));
      } catch (err) {
        console.error(`Error adding row ${i + 1} to inventory:`, err);
        errorCount++;
        setAddAllProgress(prev => ({ ...prev, done: prev.done + 1, errors: prev.errors + 1 }));
      }
    }

    setAddingAll(false);
    
    alert(
      `Import completed!\n\n` +
      `✅ Successfully added: ${successCount} product(s)\n` +
      `${errorCount > 0 ? `❌ Errors: ${errorCount} product(s)\n` : ''}` +
      `Total processed: ${data.length} row(s)`
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Excel File Browser
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upload an Excel file to view and browse its contents
        </Typography>
      </Box>

      {/* File Upload */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Select Excel File'}
            <input
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleFileSelect}
            />
          </Button>

          {fileName && !loading && (
            <Chip
              label={fileName}
              icon={<TableChartIcon />}
              onDelete={() => {
                setFile(null);
                setFileName('');
                setData([]);
                setColumns([]);
                setSheets([]);
                setSelectedSheet('');
                setError(null);
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
              }}
              color="primary"
              variant="outlined"
            />
          )}

          {loading && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              <Typography variant="body2">Parsing file...</Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!error && sheets.length > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            File parsed successfully! {sheets.reduce((sum, s) => sum + (s.rowCount || 0), 0)} total rows across {sheets.length} sheet(s).
          </Alert>
        )}
      </Paper>

      {/* Sheets Selection */}
      {sheets.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {sheets.length > 1 ? 'Select Sheet:' : 'Sheet:'}
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {sheets.map((sheet) => (
              <Chip
                key={sheet.name}
                label={`${sheet.name} (${sheet.rowCount || 0} rows)`}
                onClick={() => handleSheetChange(sheet.name)}
                color={selectedSheet === sheet.name ? 'primary' : 'default'}
                variant={selectedSheet === sheet.name ? 'filled' : 'outlined'}
                sx={{ cursor: sheets.length > 1 ? 'pointer' : 'default' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Data Display */}
      {sheets.length > 0 && selectedSheet && (
        <Paper>
          <Box p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSheet || 'Sheet Data'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {data.length} row(s), {columns.length} column(s)
              </Typography>
            </Box>
            {data.length > 0 && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddAllToInventory}
                disabled={addingAll}
                size="large"
              >
                {addingAll 
                  ? `Adding... (${addAllProgress.done}/${addAllProgress.total})` 
                  : `Add All ${data.length} Items to Inventory`}
              </Button>
            )}
          </Box>
          {addingAll && (
            <Box p={2} bgcolor="background.default">
              <Typography variant="body2" color="text.secondary">
                Progress: {addAllProgress.success} added, {addAllProgress.errors} errors
              </Typography>
            </Box>
          )}
          {(columns.length > 0 || data.length > 0) ? (
            <TableContainer sx={{ maxHeight: '70vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {/* Add to Inventory Header */}
                      <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper', width: 50 }}>
                        Action
                      </TableCell>
                      {/* Data Column Headers */}
                      {columns.length > 0 ? columns.map((column, index) => (
                        <TableCell key={index} sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>
                          {column || `Column ${index + 1}`}
                        </TableCell>
                      )) : (
                        data.length > 0 && Object.keys(data[0] || {}).map((key, index) => (
                          <TableCell key={index} sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>
                            {key || `Column ${index + 1}`}
                          </TableCell>
                        ))
                      )}
                    </TableRow>
                  </TableHead>
                <TableBody>
                  {data.length > 0 ? (
                    data.slice(0, 1000).map((row, rowIndex) => {
                      const rowKey = `${selectedSheet}-${rowIndex}`;
                      const isAdding = addingRows.has(rowKey);
                      return (
                        <TableRow key={rowIndex}>
                          {/* Add to Inventory Button Column */}
                          <TableCell sx={{ width: 50, padding: '8px' }}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleAddToInventory(row, rowIndex)}
                              disabled={isAdding}
                              title="Add to Inventory"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                          {/* Data Columns */}
                          {columns.length > 0 ? columns.map((column, colIndex) => (
                            <TableCell key={colIndex}>
                              {row[column] !== undefined && row[column] !== null && row[column] !== ''
                                ? String(row[column])
                                : ''}
                            </TableCell>
                          )) : (
                            Object.values(row).map((cell, colIndex) => (
                              <TableCell key={colIndex}>
                                {cell !== undefined && cell !== null && cell !== '' ? String(cell) : ''}
                              </TableCell>
                            ))
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell 
                        colSpan={(columns.length || 1) + 1} 
                        sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}
                      >
                        <Typography variant="body2">
                          No data rows found in this sheet.
                        </Typography>
                        {columns.length > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Columns: {columns.filter(c => c && c.trim()).join(', ') || `${columns.length} column${columns.length !== 1 ? 's' : ''}`}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box p={4} textAlign="center">
              <Typography variant="body1" color="text.secondary">
                This sheet appears to be completely empty.
              </Typography>
            </Box>
          )}
          {data.length > 1000 && (
            <Box p={2}>
              <Alert severity="info">
                Showing first 1000 rows of {data.length} total rows
              </Alert>
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default ExcelBrowser;
