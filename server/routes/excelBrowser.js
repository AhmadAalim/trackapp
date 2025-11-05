module.exports = (upload) => {
  const express = require('express');
  const XLSX = require('xlsx');
  const fs = require('fs');
  const router = express.Router();

  // Parse Excel file and return all sheets with data
  router.post('/parse', upload.single('excel'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file provided' });
    }

    try {
      // Read Excel file
      const workbook = XLSX.readFile(req.file.path);

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Excel file has no sheets' });
      }

      // Explicitly create an array - ensure it stays an array
      const sheets = [];
      const sheetsArray = [];

      // Process each sheet - SIMPLE approach
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) return;

        // Get the range to know dimensions
        const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;
        
        let sheetData = {
          name: sheetName,
          rowCount: 0,
          columns: ['Column 1'],
          data: [],
        };
        
        if (!range) {
          // Empty sheet - use default structure
          sheetsArray.push(sheetData);
          return;
        }

        // SIMPLE: Parse as JSON with headers (first row = headers)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '', // Empty cells become empty strings
          raw: false, // Convert to strings
          blankrows: false, // Skip completely blank rows
        });

        // Extract columns from first row keys
        let columns = [];
        if (jsonData.length > 0) {
          columns = Object.keys(jsonData[0]);
        } else {
          // No data rows, but check if first row has headers
          const firstRowArray = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '',
            blankrows: false 
          });
          if (firstRowArray.length > 0 && Array.isArray(firstRowArray[0])) {
            columns = firstRowArray[0].map((cell, idx) => 
              cell && String(cell).trim() ? String(cell).trim() : `Column ${idx + 1}`
            );
          }
        }

        // If still no columns, generate them from range
        if (columns.length === 0) {
          const totalCols = range.e.c - range.s.c + 1;
          columns = Array.from({ length: Math.max(totalCols, 1) }, (_, i) => `Column ${i + 1}`);
        }

        // Create sheet object
        sheetData = {
          name: sheetName,
          rowCount: jsonData.length,
          columns: Array.isArray(columns) ? columns : [],
          data: Array.isArray(jsonData) ? jsonData : [],
        };
        
        // Push to array using Array.push method
        sheetsArray.push(sheetData);
      });

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      // Calculate total rows - use sheetsArray which is guaranteed to be an array
      const totalRows = sheetsArray.reduce((sum, sheet) => sum + (sheet.rowCount || 0), 0);

      // Final check - ensure it's an array
      if (!Array.isArray(sheetsArray)) {
        console.error('ERROR: sheetsArray is not an array!', typeof sheetsArray, sheetsArray);
        return res.status(500).json({ error: 'Internal error: Could not create sheets array' });
      }

      const responseData = {
        success: true,
        message: 'Excel file parsed successfully',
        sheets: sheetsArray, // Explicitly use the array
        totalSheets: sheetsArray.length,
        totalRows: totalRows,
      };

      // Double-check before sending
      if (!Array.isArray(responseData.sheets)) {
        console.error('ERROR: responseData.sheets is not an array right before sending!', typeof responseData.sheets);
        return res.status(500).json({ error: 'Internal error: Response data is invalid' });
      }

      console.log('Sending response:', {
        sheetsCount: responseData.sheets.length,
        totalRows: responseData.totalRows,
        sheetsIsArray: Array.isArray(responseData.sheets),
        sheetsType: typeof responseData.sheets,
        sheetsConstructor: responseData.sheets.constructor?.name
      });

      res.json(responseData);
    } catch (error) {
      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error parsing Excel file:', error);
      res.status(500).json({ error: error.message || 'Failed to parse Excel file' });
    }
  });

  return router;
};


