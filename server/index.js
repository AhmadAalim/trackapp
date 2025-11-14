const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Use compatible database wrapper that supports both SQLite and PostgreSQL
const db = require('./db-compat');

const app = express();
const PORT = process.env.PORT || 5001;

// Update CORS to allow frontend domain
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'https://client-4opfx4inf-amers-projects-b96a46c1.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now, can restrict later
    }
  },
  credentials: true
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Image upload middleware
const uploadImage = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Database initialization happens automatically via db-compat.js
// It supports both SQLite (default) and PostgreSQL (when DB_TYPE=postgres)

// Routes
const inventoryRoutes = require('./routes/inventory')(db, upload, uploadImage, path);
const salesRoutes = require('./routes/sales')(db);
const employeesRoutes = require('./routes/employees')(db);
const suppliersRoutes = require('./routes/suppliers')(db);
const reportsRoutes = require('./routes/reports')(db);
const financesRoutes = require('./routes/finances')(db);
const excelBrowserRoutes = require('./routes/excelBrowser')(upload);
const authRoutes = require('./routes/auth')(db);
const discountRulesRoutes = require('./routes/discountRules')(db);
const stickerRoutes = require('./routes/stickers')(db);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/finances', financesRoutes);
app.use('/api/excel-browser', excelBrowserRoutes);
app.use('/api/discount-rules', discountRulesRoutes);
app.use('/api/generate-stickers', stickerRoutes);

// Health check - MUST be before React catch-all route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve React app in production (for deployment)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Export for Vercel serverless
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
}
