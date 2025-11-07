/**
 * Discount Rules Routes
 * Manage discount rules for products
 */

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();
  const { authenticate, requireManager } = require('../middleware/auth');

  // Get all discount rules
  router.get('/', authenticate, (req, res) => {
    const query = `
      SELECT 
        dr.*,
        p.name as product_name,
        p.sku,
        p.category
      FROM discount_rules dr
      JOIN products p ON dr.product_id = p.id
      ORDER BY dr.created_at DESC
    `;

    db.all(query, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get discount rule for a specific product
  router.get('/product/:productId', authenticate, (req, res) => {
    const productId = req.params.productId;

    db.get(
      'SELECT * FROM discount_rules WHERE product_id = ?',
      [productId],
      (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (!row) {
          return res.json({ product_id: productId, max_discount_percent: 0 });
        }

        res.json(row);
      }
    );
  });

  // Create or update discount rule (Manager only)
  router.post('/', authenticate, requireManager, (req, res) => {
    const { product_id, max_discount_percent } = req.body;

    if (!product_id || max_discount_percent === undefined) {
      return res.status(400).json({ error: 'product_id and max_discount_percent are required' });
    }

    if (max_discount_percent < 0 || max_discount_percent > 100) {
      return res.status(400).json({ error: 'max_discount_percent must be between 0 and 100' });
    }

    // Check if product exists
    db.get('SELECT id FROM products WHERE id = ?', [product_id], (err, product) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if rule already exists
      db.get(
        'SELECT id FROM discount_rules WHERE product_id = ?',
        [product_id],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (existing) {
            // Update existing rule
            db.run(
              'UPDATE discount_rules SET max_discount_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
              [max_discount_percent, product_id],
              function(updateErr) {
                if (updateErr) {
                  return res.status(500).json({ error: updateErr.message });
                }
                res.json({
                  id: existing.id,
                  product_id,
                  max_discount_percent,
                  message: 'Discount rule updated successfully',
                });
              }
            );
          } else {
            // Create new rule
            db.run(
              'INSERT INTO discount_rules (product_id, max_discount_percent) VALUES (?, ?)',
              [product_id, max_discount_percent],
              function(insertErr) {
                if (insertErr) {
                  return res.status(500).json({ error: insertErr.message });
                }
                res.json({
                  id: this.lastID,
                  product_id,
                  max_discount_percent,
                  message: 'Discount rule created successfully',
                });
              }
            );
          }
        }
      );
    });
  });

  // Delete discount rule (Manager only)
  router.delete('/:id', authenticate, requireManager, (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM discount_rules WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Discount rule not found' });
      }

      res.json({ message: 'Discount rule deleted successfully' });
    });
  });

  // Validate discount amount for a product
  router.post('/validate', authenticate, (req, res) => {
    const { product_id, discount_percent } = req.body;

    if (!product_id || discount_percent === undefined) {
      return res.status(400).json({ error: 'product_id and discount_percent are required' });
    }

    db.get(
      'SELECT max_discount_percent FROM discount_rules WHERE product_id = ?',
      [product_id],
      (err, rule) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        const maxDiscount = rule ? rule.max_discount_percent : 0;

        if (discount_percent > maxDiscount) {
          return res.json({
            valid: false,
            max_discount_percent: maxDiscount,
            message: `Discount exceeds maximum allowed (${maxDiscount}%). Manager approval required.`,
            requires_manager_approval: true,
          });
        }

        res.json({
          valid: true,
          max_discount_percent: maxDiscount,
          message: 'Discount is within allowed limit',
        });
      }
    );
  });

  return router;
};

