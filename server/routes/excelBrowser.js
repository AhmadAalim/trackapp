module.exports = (upload) => {
  const express = require('express');
  const XLSX = require('xlsx');
  const fs = require('fs');
  const path = require('path');
  const router = express.Router();

  const HISTORY_DIR = path.join(__dirname, '..', 'excel_history');
  const HISTORY_FILE = path.join(HISTORY_DIR, 'excelHistory.json');
  const HISTORY_LIMIT = 20;

  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }

  const loadHistory = () => {
    try {
      if (!fs.existsSync(HISTORY_FILE)) {
        return [];
      }
      const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load Excel history:', error);
      return [];
    }
  };

  const saveHistory = (entries) => {
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save Excel history:', error);
    }
  };

  const recordHistory = (entry) => {
    const history = loadHistory();
    const filtered = history.filter((item) => item.id !== entry.id);
    filtered.unshift(entry);
    const trimmed = filtered.slice(0, HISTORY_LIMIT);
    saveHistory(trimmed);
    return trimmed;
  };

  const sanitizeFileName = (name = '') => {
    const baseName = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
    return baseName || `excel_${Date.now()}.xlsx`;
  };

  const ensureFileExists = (filePath) => fs.existsSync(filePath) && fs.lstatSync(filePath).isFile();

  const parseExcelFile = (filePath) => {
    const workbook = XLSX.readFile(filePath);

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel file has no sheets');
    }

    const sheetsArray = [];

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) return;

      const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : null;

      let sheetData = {
        name: sheetName,
        rowCount: 0,
        columns: ['Column 1'],
        data: [],
      };

      if (!range) {
        sheetsArray.push(sheetData);
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
        blankrows: false,
      });

      let columns = [];
      if (jsonData.length > 0) {
        columns = Object.keys(jsonData[0]);
      } else {
        const firstRowArray = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
        });
        if (firstRowArray.length > 0 && Array.isArray(firstRowArray[0])) {
          columns = firstRowArray[0].map((cell, idx) =>
            cell && String(cell).trim() ? String(cell).trim() : `Column ${idx + 1}`
          );
        }
      }

      if (columns.length === 0 && range) {
        const totalCols = range.e.c - range.s.c + 1;
        columns = Array.from({ length: Math.max(totalCols, 1) }, (_, i) => `Column ${i + 1}`);
      }

      sheetData = {
        name: sheetName,
        rowCount: jsonData.length,
        columns: Array.isArray(columns) ? columns : [],
        data: Array.isArray(jsonData) ? jsonData : [],
      };

      sheetsArray.push(sheetData);
    });

    const totalRows = sheetsArray.reduce((sum, sheet) => sum + (sheet.rowCount || 0), 0);

    return {
      sheets: sheetsArray,
      totalRows,
      totalSheets: sheetsArray.length,
    };
  };

  // Parse Excel file and return all sheets with data
  router.post('/parse', upload.single('excel'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file provided' });
    }

    try {
      const { sheets, totalRows, totalSheets } = parseExcelFile(req.file.path);

      const storedFileName = `${Date.now()}-${sanitizeFileName(req.file.originalname)}`;
      const storedFilePath = path.join(HISTORY_DIR, storedFileName);
      fs.renameSync(req.file.path, storedFilePath);

      const historyEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        originalName: req.file.originalname,
        storedFileName,
        uploadedAt: new Date().toISOString(),
        sheetCount: totalSheets,
        totalRows,
        fileSize: req.file.size || 0,
      };

      const updatedHistory = recordHistory(historyEntry);

      const responseData = {
        success: true,
        message: 'Excel file parsed successfully',
        sheets,
        totalSheets,
        totalRows,
        historyEntry,
        history: updatedHistory,
      };

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

  router.get('/history', (req, res) => {
    const history = loadHistory();
    res.json({ history });
  });

  router.get('/history/:id', (req, res) => {
    const { id } = req.params;
    const history = loadHistory();
    const entry = history.find((item) => item.id === id);

    if (!entry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    const filePath = path.join(HISTORY_DIR, entry.storedFileName);

    if (!ensureFileExists(filePath)) {
      return res.status(404).json({ error: 'Stored Excel file not found' });
    }

    try {
      const { sheets, totalRows, totalSheets } = parseExcelFile(filePath);

      res.json({
        success: true,
        message: 'Excel file loaded successfully',
        sheets,
        totalSheets,
        totalRows,
        historyEntry: entry,
      });
    } catch (error) {
      console.error('Failed to parse history Excel file:', error);
      res.status(500).json({ error: error.message || 'Failed to load Excel file' });
    }
  });

  return router;
};


