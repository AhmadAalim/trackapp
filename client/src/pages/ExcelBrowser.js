import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
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
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [failedItemsDialogOpen, setFailedItemsDialogOpen] = useState(false);
  const [failedItems, setFailedItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const applyParsedResult = useCallback((payload = {}, options = {}) => {
    const {
      fileName: overrideFileName,
      clearFile = false,
      historyEntry = null,
      historyId,
    } = options;

    const sheetsArray = Array.isArray(payload?.sheets) ? payload.sheets : [];
    setSheets(sheetsArray);

    if (sheetsArray.length > 0) {
      const initialSheet =
        sheetsArray.find((sheet) => Array.isArray(sheet?.data) && sheet.data.length > 0) ??
        sheetsArray[0];
      const sheetName = initialSheet?.name || sheetsArray[0]?.name || '';
      setSelectedSheet(sheetName);
      setData(Array.isArray(initialSheet?.data) ? initialSheet.data : []);
      setColumns(Array.isArray(initialSheet?.columns) ? initialSheet.columns : []);
    } else {
      setSelectedSheet('');
      setData([]);
      setColumns([]);
    }

    if (typeof overrideFileName === 'string') {
      setFileName(overrideFileName);
    }

    if (clearFile) {
      setFile(null);
    }

    if (historyEntry && historyEntry.id) {
      setSelectedHistoryId(historyEntry.id);
    } else if (historyId) {
      setSelectedHistoryId(historyId);
    }

    setError(null);
  }, []);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await excelBrowserAPI.getHistory();
      const historyItems = Array.isArray(response?.data?.history) ? response.data.history : [];
      setHistory(historyItems);
      setHistoryError(null);
    } catch (err) {
      console.error('Error fetching Excel history:', err);
      setHistoryError(err.response?.data?.error || err.message || 'Failed to load history');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const recentHistory = useMemo(() => history, [history]);
  const totalRows = data.length;
  const totalSheets = sheets.length;
  const totalSummary = `Sheets: ${totalSheets} • Rows: ${totalRows}`;
  const parsedSummary = !error && sheets.length > 0
    ? `Parsed ${sheets.reduce((sum, s) => sum + (s.rowCount || 0), 0)} rows in ${sheets.length} sheet(s)`
    : '';

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
    setSelectedHistoryId(null);

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
      const responseData = response?.data || {};

      if (responseData.error) {
        setError(responseData.error);
        return;
      }

      applyParsedResult(responseData, {
        fileName: fileToProcess.name,
        historyEntry: responseData.historyEntry,
      });

      if (Array.isArray(responseData.history)) {
        setHistory(responseData.history);
      } else if (responseData.historyEntry) {
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== responseData.historyEntry.id);
          return [responseData.historyEntry, ...filtered].slice(0, 20);
        });
      }

      setHistoryError(null);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || err.message || 'Failed to parse Excel file');
      setFile(null);
      setFileName('');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistoryEntry = useCallback(
    async (entry) => {
      if (!entry || !entry.id) return;

      setSelectedHistoryId(entry.id);
      setLoading(true);
      setError(null);
      setData([]);
      setColumns([]);
      setSheets([]);
      setSelectedSheet('');
      setFile(null);

      try {
        const response = await excelBrowserAPI.getHistoryEntry(entry.id);
        const responseData = response?.data || {};

        if (responseData.error) {
          setError(responseData.error);
          return;
        }

        const mergedEntry = responseData.historyEntry || entry;

        applyParsedResult(responseData, {
          fileName: entry.originalName,
          clearFile: true,
          historyEntry: mergedEntry,
          historyId: entry.id,
        });

        setHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== mergedEntry.id);
          return [mergedEntry, ...filtered];
        });
        setHistoryError(null);
      } catch (err) {
        console.error('Error loading history entry:', err);
        setError(err.response?.data?.error || err.message || 'Failed to load saved Excel file');
      } finally {
        setLoading(false);
      }
    },
    [applyParsedResult]
  );

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
        'מחיר עלות', 'עלות', 'מחיר לאחר הנחה' // Hebrew variations
      ], '0');

      // Final Price → price
      const finalPrice = getValue([
        'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
        'מחיר סופי', 'מחיר לצרכן', 'צרכן' // Hebrew variations
      ], '0');

      // Generate SKU: last 4 digits are cost price padded with zeros
      const cost = safeParseFloat(costPrice, 0);

      const productData = {
        name: productName.trim(), // Product Name → name
        description: productBarcode || '', // Product Barcode → description
        sku: '', // Let backend generate SKU with cost/final format
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

    // Track ALL original rows with their row numbers
    const parsedRows = [];
    const originalRowMap = new Map(); // Maps merged key to original row indices

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

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
        'מחיר עלות', 'עלות', 'מחיר לאחר הנחה' // Hebrew variations
      ], '0');

      // Final Price → price
      const finalPrice = getValue(row, [
        'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
        'מחיר סופי', 'מחיר לצרכן', 'צרכן' // Hebrew variations
      ], '0');

      const cost = safeParseFloat(costPrice, 0);

      const productData = {
        name: productName.trim(),
        description: productBarcode || '',
        sku: '',
        category: '',
        price: safeParseFloat(finalPrice, 0),
        cost: cost,
        stock_quantity: safeParseInt(quantity, 0),
        min_stock_level: 10,
        supplier_id: null,
        image_url: null,
        originalRowNumber: i + 1, // Track original row number
        originalRowData: row, // Keep original row data
      };

      parsedRows.push({ productData, originalIndex: i });
    }

    // Merge duplicates by barcode while tracking which rows were merged
    const mergedByBarcode = new Map();
    const uniqueItems = [];
    const mergedRowsTracker = new Map(); // Track which original rows were merged

    parsedRows.forEach(({ productData, originalIndex }) => {
      const key = (productData.description || '').replace(/\s+/g, '').toLowerCase();
      if (key) {
        if (!mergedByBarcode.has(key)) {
          mergedByBarcode.set(key, { ...productData });
          mergedRowsTracker.set(key, [originalIndex]);
        } else {
          const existing = mergedByBarcode.get(key);
          existing.stock_quantity += productData.stock_quantity;
          if (!existing.name && productData.name) existing.name = productData.name;
          if (!existing.description && productData.description) existing.description = productData.description;
          if (!existing.cost && productData.cost) existing.cost = productData.cost;
          if (!existing.price && productData.price) existing.price = productData.price;
          mergedByBarcode.set(key, existing);
          mergedRowsTracker.get(key).push(originalIndex);
        }
      } else {
        uniqueItems.push(productData);
      }
    });

    const itemsToUpload = [...mergedByBarcode.values(), ...uniqueItems];
    const totalOriginalRows = data.length;

    setAddAllProgress({ done: 0, total: itemsToUpload.length, success: 0, errors: 0 });

    let successCount = 0;
    let errorCount = 0;
    const failedItemsList = [];
    const successfullyAddedKeys = new Set(); // Track which merged keys were successfully added

    for (let i = 0; i < itemsToUpload.length; i++) {
      const productData = itemsToUpload[i];
      const key = (productData.description || '').replace(/\s+/g, '').toLowerCase();
      
      try {
        await inventoryAPI.create(productData);
        successCount++;
        if (key) {
          successfullyAddedKeys.add(key);
        }
        setAddAllProgress(prev => ({ ...prev, done: prev.done + 1, success: prev.success + 1 }));
      } catch (err) {
        console.error(`Error adding aggregated item ${i + 1} to inventory:`, err);
        errorCount++;
        setAddAllProgress(prev => ({ ...prev, done: prev.done + 1, errors: prev.errors + 1 }));
        
        // Collect failed item with error message
        const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
        failedItemsList.push({
          ...productData,
          error: errorMessage,
          originalIndex: i,
          isMerged: key && mergedRowsTracker.has(key) && mergedRowsTracker.get(key).length > 1,
          mergedRowCount: key && mergedRowsTracker.has(key) ? mergedRowsTracker.get(key).length : 0,
        });
      }
    }

    // Now find ALL items that weren't successfully added
    // This includes items that were merged but the merged item failed
    const allFailedItems = [...failedItemsList];
    
    // Add items that were merged but the merged item failed
    mergedRowsTracker.forEach((originalIndices, key) => {
      if (!successfullyAddedKeys.has(key)) {
        // The merged item failed, so all original rows that were merged are "failed"
        originalIndices.forEach(originalIndex => {
          const parsedRow = parsedRows[originalIndex];
          if (parsedRow) {
            // Check if already in failedItemsList
            const alreadyAdded = allFailedItems.some(item => 
              item.originalRowNumber === parsedRow.productData.originalRowNumber
            );
            if (!alreadyAdded) {
              allFailedItems.push({
                ...parsedRow.productData,
                error: `Merged with ${originalIndices.length} other item(s) - merged item failed to add`,
                originalIndex: originalIndex,
                isMerged: true,
                mergedRowCount: originalIndices.length,
              });
            }
          }
        });
      }
    });

    // Also track items that were successfully merged (to show in summary)
    const mergedSuccessfully = [];
    mergedRowsTracker.forEach((originalIndices, key) => {
      if (successfullyAddedKeys.has(key) && originalIndices.length > 1) {
        mergedSuccessfully.push({
          key,
          count: originalIndices.length,
          originalIndices,
        });
      }
    });

    setAddingAll(false);

    // Calculate totals
    const totalMergedRows = mergedSuccessfully.reduce((sum, m) => sum + m.count, 0);
    const totalFailedRows = allFailedItems.length;
    const totalSuccessRows = successCount;

    // Always show the dialog if there are any failed items OR if items were merged
    if (allFailedItems.length > 0) {
      setFailedItems(allFailedItems);
      setFailedItemsDialogOpen(true);
      
      alert(
        `Import Summary:\n\n` +
        `📊 Total rows in Excel: ${totalOriginalRows}\n` +
        `✅ Successfully added: ${totalSuccessRows} product(s)\n` +
        `${totalMergedRows > 0 ? `🔄 Merged duplicates: ${totalMergedRows} row(s) into ${mergedSuccessfully.length} product(s)\n` : ''}` +
        `❌ Failed/Not added: ${totalFailedRows} item(s)\n\n` +
        `A dialog will open showing all items that weren't added.`
      );
    } else if (totalMergedRows > 0) {
      // Show info about merged items even if all succeeded
      alert(
        `Import completed!\n\n` +
        `📊 Total rows in Excel: ${totalOriginalRows}\n` +
        `✅ Successfully added: ${totalSuccessRows} product(s)\n` +
        `🔄 Merged duplicates: ${totalMergedRows} row(s) into ${mergedSuccessfully.length} product(s)\n` +
        `Total unique items after merging: ${itemsToUpload.length}`
      );
    } else {
      alert(
        `Import completed!\n\n` +
        `✅ Successfully added: ${totalSuccessRows} product(s)\n` +
        `Total processed: ${itemsToUpload.length} item(s)`
      );
    }
  };

  const handleEditFailedItem = (index) => {
    setEditingItemIndex(index);
  };

  const handleRetryFailedItem = async (index) => {
    const item = failedItems[index];
    try {
      await inventoryAPI.create(item);
      // Remove from failed items list
      const updated = failedItems.filter((_, i) => i !== index);
      setFailedItems(updated);
      alert(`Product "${item.name}" added successfully!`);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      // Update error message
      const updated = [...failedItems];
      updated[index] = { ...updated[index], error: errorMessage };
      setFailedItems(updated);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleRetryAllFailedItems = async () => {
    if (failedItems.length === 0) return;
    
    const confirmRetry = window.confirm(
      `Retry adding all ${failedItems.length} failed item(s)?`
    );
    if (!confirmRetry) return;

    const itemsToRetry = [...failedItems];
    const stillFailed = [];
    let successCount = 0;

    for (let i = 0; i < itemsToRetry.length; i++) {
      const item = itemsToRetry[i];
      try {
        await inventoryAPI.create(item);
        successCount++;
      } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
        stillFailed.push({ ...item, error: errorMessage });
      }
    }

    setFailedItems(stillFailed);
    
    if (stillFailed.length === 0) {
      setFailedItemsDialogOpen(false);
      alert(`All items added successfully!`);
    } else {
      alert(
        `Retry completed!\n\n` +
        `✅ Successfully added: ${successCount} product(s)\n` +
        `❌ Still failed: ${stillFailed.length} product(s)`
      );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 0, px: { xs: 1.5, sm: 2 } }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        gap={0.75}
        mb={0.5}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.1 }}
          >
            Excel File Browser
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalSummary}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon fontSize="small" />}
            disabled={loading}
            size="small"
            sx={{ px: 1.5, py: 0.5 }}
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
              icon={<TableChartIcon fontSize="small" />}
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
              size="small"
              title={fileName}
              sx={{
                maxWidth: 240,
                '& .MuiChip-label': {
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
            />
          )}

          {loading && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <CircularProgress size={18} />
              <Typography variant="caption">Parsing file...</Typography>
            </Box>
          )}

          {parsedSummary && (
              <Chip
                label={parsedSummary}
                color="success"
                variant="outlined"
                size="small"
                sx={{
                  ml: { xs: 0, sm: 0.25 },
                  '& .MuiChip-label': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                }}
              />
          )}
        </Box>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          mb: 1.5,
          borderRadius: 2,
          p: 1,
        }}
      >
        <Box display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between" gap={1}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}
            >
              Recent Excel Files
            </Typography>
            {historyLoading && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading…
                </Typography>
              </Box>
            )}
          </Box>

          {historyError && !historyLoading && (
            <Alert
              severity="warning"
              sx={{ mb: 0, py: 0.5, '.MuiAlert-message': { py: 0 } }}
            >
              {historyError}
            </Alert>
          )}

          {!historyLoading && !historyError && recentHistory.length === 0 && (
            <Typography variant="caption" color="text.secondary">
              Upload an Excel file to start building your recent files list.
            </Typography>
          )}

          {recentHistory.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
              }}
            >
              {recentHistory.map((entry) => {
                const isSelected = selectedHistoryId === entry.id;
                const uploadedLabel = entry.uploadedAt
                  ? new Date(entry.uploadedAt).toLocaleString()
                  : '';
                return (
                  <Chip
                    key={entry.id}
                    size="small"
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    label={entry.originalName || 'Untitled file'}
                    onClick={() => handleSelectHistoryEntry(entry)}
                    title={`${entry.originalName || 'Untitled file'}
${uploadedLabel ? `Uploaded: ${uploadedLabel}` : ''}
Sheets: ${entry.sheetCount ?? 0} • Rows: ${entry.totalRows ?? 0}`}
                    sx={{
                      maxWidth: 240,
                      cursor: 'pointer',
                      '& .MuiChip-label': {
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      },
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Box>
      </Paper>

      {error && (
        <Chip
          color="error"
          variant="outlined"
          size="small"
          label={error}
          onDelete={() => setError(null)}
          title={error}
          sx={{
            mb: 0.5,
            maxWidth: '100%',
            '& .MuiChip-label': {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
          }}
        />
      )}

      {/* Data Display */}
      {sheets.length > 0 && selectedSheet && (
        <Paper>
          <Box p={0.75} display="flex" flexDirection="column" gap={1.25}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1.25}
            >
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, mb: 0 }}
                >
                  {selectedSheet || 'Sheet Data'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
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
                  size="small"
                  sx={{ px: 1.5, py: 0.5 }}
                >
                  {addingAll 
                    ? `Adding... (${addAllProgress.done}/${addAllProgress.total})` 
                  : `Add All ${data.length} Items`}
                </Button>
              )}
            </Box>

            {sheets.length > 0 && (
              <Box
                display="flex"
                alignItems="center"
                gap={0.75}
                flexWrap="wrap"
                sx={{
                  maxWidth: '100%',
                  overflowX: 'auto',
                  pb: 0.5,
                  '&::-webkit-scrollbar': { height: 6 },
                  '&::-webkit-scrollbar-thumb': { borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.2)' },
                }}
              >
                {sheets.length > 1 && (
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    Sheets:
                  </Typography>
                )}
                {sheets.map((sheet) => (
                  <Chip
                    key={sheet.name}
                    size="small"
                    label={`${sheet.name}${sheet.rowCount ? ` (${sheet.rowCount})` : ''}`}
                    onClick={() => handleSheetChange(sheet.name)}
                    color={selectedSheet === sheet.name ? 'primary' : 'default'}
                    variant={selectedSheet === sheet.name ? 'filled' : 'outlined'}
                    sx={{ cursor: sheets.length > 1 ? 'pointer' : 'default' }}
                  />
                ))}
              </Box>
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

      {/* Failed Items Dialog */}
      <Dialog
        open={failedItemsDialogOpen}
        onClose={() => setFailedItemsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Failed Items ({failedItems.length})
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRetryAllFailedItems}
              disabled={failedItems.length === 0}
            >
              Retry All
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Row #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Description/Barcode</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Error/Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {failedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No failed items
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  failedItems.map((item, index) => {
                    const isEditing = editingItemIndex === index;
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {item.originalRowNumber || index + 1}
                            {item.isMerged && item.mergedRowCount > 1 && (
                              <Chip
                                label={`Merged (${item.mergedRowCount})`}
                                size="small"
                                color="warning"
                                sx={{ ml: 0.5 }}
                              />
                            )}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              fullWidth
                              value={item.name || ''}
                              onChange={(e) => {
                                const updated = [...failedItems];
                                updated[index] = { ...updated[index], name: e.target.value };
                                setFailedItems(updated);
                              }}
                            />
                          ) : (
                            item.name || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              fullWidth
                              value={item.description || ''}
                              onChange={(e) => {
                                const updated = [...failedItems];
                                updated[index] = { ...updated[index], description: e.target.value };
                                setFailedItems(updated);
                              }}
                            />
                          ) : (
                            item.description || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={item.price || 0}
                              onChange={(e) => {
                                const updated = [...failedItems];
                                updated[index] = { ...updated[index], price: parseFloat(e.target.value) || 0 };
                                setFailedItems(updated);
                              }}
                            />
                          ) : (
                            `₪${(item.price || 0).toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={item.cost || 0}
                              onChange={(e) => {
                                const updated = [...failedItems];
                                updated[index] = { ...updated[index], cost: parseFloat(e.target.value) || 0 };
                                setFailedItems(updated);
                              }}
                            />
                          ) : (
                            `₪${(item.cost || 0).toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              value={item.stock_quantity || 0}
                              onChange={(e) => {
                                const updated = [...failedItems];
                                updated[index] = { ...updated[index], stock_quantity: parseInt(e.target.value) || 0 };
                                setFailedItems(updated);
                              }}
                            />
                          ) : (
                            item.stock_quantity || 0
                          )}
                        </TableCell>
                        <TableCell>
                          <Alert 
                            severity={item.isMerged ? "warning" : "error"} 
                            sx={{ py: 0.5, fontSize: '0.75rem' }}
                          >
                            {item.error || 'Unknown error'}
                            {item.isMerged && item.mergedRowCount > 1 && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                This item was merged with {item.mergedRowCount - 1} other item(s) with the same barcode
                              </Typography>
                            )}
                          </Alert>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            {isEditing ? (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setEditingItemIndex(null);
                                }}
                                title="Save"
                              >
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditFailedItem(index)}
                                title="Edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleRetryFailedItem(index)}
                              title="Retry"
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFailedItemsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ExcelBrowser;
