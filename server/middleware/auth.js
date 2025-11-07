/**
 * Authentication Middleware
 * Protects routes and validates user roles
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'No token provided. Authentication required.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token. Authentication failed.' });
  }
};

/**
 * Check if user has manager role
 */
const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required. Insufficient permissions.' });
  }

  next();
};

/**
 * Check if user is manager or employee
 */
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'manager' && req.user.role !== 'employee') {
    return res.status(403).json({ error: 'Employee or Manager access required.' });
  }

  next();
};

/**
 * Generate JWT token for user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authenticate,
  requireManager,
  requireEmployee,
  generateToken,
  JWT_SECRET,
};

