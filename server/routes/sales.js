module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Get all sales
  router.get('/', (req, res) => {
    const query = `
      SELECT 
        s.*,
        e.name as employee_name,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN employees e ON s.employee_id = e.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      GROUP BY s.id
      ORDER BY s.sale_date DESC
    `;
    db.all(query, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single sale with items
  router.get('/:id', (req, res) => {
    const saleQuery = 'SELECT * FROM sales WHERE id = ?';
    const itemsQuery = `
      SELECT si.*, p.name as product_name, p.sku
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `;

    db.get(saleQuery, [req.params.id], (err, sale) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      db.all(itemsQuery, [req.params.id], (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ ...sale, items });
      });
    });
  });

  // Create sale
  router.post('/', (req, res) => {
    const { items, payment_method, employee_id, notes } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sale must have at least one item' });
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Insert sale
      db.run(
        'INSERT INTO sales (total_amount, payment_method, employee_id, notes) VALUES (?, ?, ?, ?)',
        [total_amount, payment_method, employee_id, notes],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const saleId = this.lastID;

          // Insert sale items and update stock
          let completed = 0;
          items.forEach((item) => {
            db.run(
              'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
              [saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }

                // Update product stock
                db.run(
                  'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                  [item.quantity, item.product_id],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }

                    completed++;
                    if (completed === items.length) {
                      db.run('COMMIT', (err) => {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }
                        res.json({ id: saleId, message: 'Sale created successfully' });
                      });
                    }
                  }
                );
              }
            );
          });
        }
      );
    });
  });

  // Update sale (replace items and adjust stock accordingly)
  router.put('/:id', (req, res) => {
    const saleId = req.params.id;
    const { items, payment_method, employee_id, notes } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Sale must have at least one item' });
    }

    const newTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // 1) Read existing items to revert stock
      db.all('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [saleId], (err, existingItems) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const revertNext = (idx = 0) => {
          if (idx >= existingItems.length) return afterRevert();
          const it = existingItems[idx];
          // Add back the previous quantities
          db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [it.quantity, it.product_id], (e2) => {
            if (e2) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: e2.message });
            }
            revertNext(idx + 1);
          });
        };

        const afterRevert = () => {
          // 2) Delete old sale_items
          db.run('DELETE FROM sale_items WHERE sale_id = ?', [saleId], (e3) => {
            if (e3) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: e3.message });
            }

            // 3) Update sale header
            db.run(
              'UPDATE sales SET total_amount = ?, payment_method = ?, employee_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [newTotal, payment_method, employee_id, notes, saleId],
              (e4) => {
                if (e4) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: e4.message });
                }

                // 4) Insert new items and subtract stock
                let done = 0;
                for (const item of items) {
                  db.run(
                    'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [saleId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price],
                    (e5) => {
                      if (e5) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: e5.message });
                      }
                      db.run(
                        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                        [item.quantity, item.product_id],
                        (e6) => {
                          if (e6) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: e6.message });
                          }
                          done++;
                          if (done === items.length) {
                            db.run('COMMIT', (e7) => {
                              if (e7) return res.status(500).json({ error: e7.message });
                              res.json({ id: saleId, message: 'Sale updated successfully' });
                            });
                          }
                        }
                      );
                    }
                  );
                }
              }
            );
          });
        };

        revertNext();
      });
    });
  });

  // Delete sale (revert stock and remove sale + items)
  router.delete('/:id', (req, res) => {
    const saleId = req.params.id;
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.all('SELECT product_id, quantity FROM sale_items WHERE sale_id = ?', [saleId], (err, items) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        const revertNext = (idx = 0) => {
          if (idx >= items.length) return afterRevert();
          const it = items[idx];
          db.run('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [it.quantity, it.product_id], (e2) => {
            if (e2) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: e2.message });
            }
            revertNext(idx + 1);
          });
        };

        const afterRevert = () => {
          db.run('DELETE FROM sale_items WHERE sale_id = ?', [saleId], (e3) => {
            if (e3) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: e3.message });
            }
            db.run('DELETE FROM sales WHERE id = ?', [saleId], (e4) => {
              if (e4) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: e4.message });
              }
              db.run('COMMIT', (e5) => {
                if (e5) return res.status(500).json({ error: e5.message });
                res.json({ message: 'Sale deleted successfully' });
              });
            });
          });
        };

        revertNext();
      });
    });
  });

  return router;
};
