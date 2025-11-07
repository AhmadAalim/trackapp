/**
 * Authentication Routes
 * Login, logout, and user management
 */

module.exports = (db) => {
  const express = require('express');
  const bcrypt = require('bcryptjs');
  const router = express.Router();
  const { generateToken, authenticate } = require('../middleware/auth');

  // Login
  router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get(
      'SELECT id, username, password, role, name, status FROM employees WHERE username = ?',
      [username],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        if (user.status !== 'active') {
          return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
        }

        // Check password
        if (!user.password) {
          // User hasn't set a password yet, set default or require password reset
          return res.status(401).json({ 
            error: 'Password not set. Please contact administrator to set your password.' 
          });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            return res.status(500).json({ error: 'Error verifying password' });
          }

          if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
          }

          // Generate token
          const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
          });

          res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              name: user.name,
            },
            message: 'Login successful',
          });
        });
      }
    );
  });

  // Get current user info
  router.get('/me', authenticate, (req, res) => {
    db.get(
      'SELECT id, username, role, name, email, position, status FROM employees WHERE id = ?',
      [req.user.id],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
      }
    );
  });

  // Change password
  router.post('/change-password', authenticate, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    db.get('SELECT password FROM employees WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: 'Error verifying password' });
        }

        if (!isMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
          if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
          }

          db.run(
            'UPDATE employees SET password = ? WHERE id = ?',
            [hashedPassword, req.user.id],
            function(updateErr) {
              if (updateErr) {
                return res.status(500).json({ error: updateErr.message });
              }

              res.json({ message: 'Password changed successfully' });
            }
          );
        });
      });
    });
  });

  return router;
};

