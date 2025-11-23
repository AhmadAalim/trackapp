module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Generate unique order number
  const generateOrderNumber = (callback) => {
    const prefix = 'ORD';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `${prefix}-${timestamp}-${random}`;
    callback(orderNumber);
  };

  // Get all orders
  router.get('/', (req, res) => {
    const { status, order_type, source } = req.query;
    let query = `
      SELECT 
        o.*,
        e.name as employee_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN employees e ON o.employee_id = e.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }
    if (order_type) {
      conditions.push('o.order_type = ?');
      params.push(order_type);
    }
    if (source) {
      conditions.push('o.source = ?');
      params.push(source);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY o.id ORDER BY o.created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single order with items
  router.get('/:id', (req, res) => {
    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.sku, p.description as barcode
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;

    db.get(orderQuery, [req.params.id], (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.all(itemsQuery, [req.params.id], (err, items) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ ...order, items });
      });
    });
  });

  // Create order
  router.post('/', (req, res) => {
    const {
      order_number,
      order_type,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      items,
      payment_method,
      notes,
      source = 'manual',
      employee_id,
    } = req.body;

    if (!order_type || !['delivery', 'pickup'].includes(order_type)) {
      return res.status(400).json({ error: 'Order type must be "delivery" or "pickup"' });
    }

    if (!customer_name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    if (order_type === 'delivery' && !delivery_address) {
      return res.status(400).json({ error: 'Delivery address is required for delivery orders' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item' });
    }

    // Calculate total
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Generate order number if not provided
    const finalOrderNumber = order_number || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Insert order
      db.run(
        `INSERT INTO orders (
          order_number, order_type, status, customer_name, customer_phone, 
          customer_email, delivery_address, total_amount, payment_method, 
          notes, source, employee_id, created_at, updated_at
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          finalOrderNumber,
          order_type,
          customer_name,
          customer_phone || null,
          customer_email || null,
          delivery_address || null,
          total_amount,
          payment_method || null,
          notes || null,
          source,
          employee_id || null,
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const orderId = this.lastID;

          // Insert order items
          let completed = 0;
          items.forEach((item) => {
            db.run(
              'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
              [
                orderId,
                item.product_id,
                item.quantity,
                item.unit_price,
                item.quantity * item.unit_price,
              ],
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
                    res.json({ id: orderId, order_number: finalOrderNumber, message: 'Order created successfully' });
                  });
                }
              }
            );
          });
        }
      );
    });
  });

  // Update order
  router.put('/:id', (req, res) => {
    const orderId = req.params.id;
    const {
      order_type,
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      items,
      payment_method,
      notes,
      source,
      employee_id,
    } = req.body;

    if (order_type && !['delivery', 'pickup'].includes(order_type)) {
      return res.status(400).json({ error: 'Order type must be "delivery" or "pickup"' });
    }

    if (order_type === 'delivery' && !delivery_address) {
      return res.status(400).json({ error: 'Delivery address is required for delivery orders' });
    }

    const newTotal = items
      ? items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
      : null;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Build update query dynamically
      const updates = [];
      const params = [];

      if (order_type) {
        updates.push('order_type = ?');
        params.push(order_type);
      }
      if (customer_name) {
        updates.push('customer_name = ?');
        params.push(customer_name);
      }
      if (customer_phone !== undefined) {
        updates.push('customer_phone = ?');
        params.push(customer_phone || null);
      }
      if (customer_email !== undefined) {
        updates.push('customer_email = ?');
        params.push(customer_email || null);
      }
      if (delivery_address !== undefined) {
        updates.push('delivery_address = ?');
        params.push(delivery_address || null);
      }
      if (newTotal !== null) {
        updates.push('total_amount = ?');
        params.push(newTotal);
      }
      if (payment_method !== undefined) {
        updates.push('payment_method = ?');
        params.push(payment_method || null);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        params.push(notes || null);
      }
      if (source) {
        updates.push('source = ?');
        params.push(source);
      }
      if (employee_id !== undefined) {
        updates.push('employee_id = ?');
        params.push(employee_id || null);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(orderId);

      if (updates.length === 1) {
        // Only updated_at was added, no other fields to update
        db.run('COMMIT');
        return res.json({ id: orderId, message: 'Order updated successfully' });
      }

      // Update order header
      db.run(
        `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`,
        params,
        (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          // If items are provided, update them
          if (items) {
            // Delete old items
            db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              // Insert new items
              let completed = 0;
              if (items.length === 0) {
                db.run('COMMIT', (err) => {
                  if (err) return res.status(500).json({ error: err.message });
                  res.json({ id: orderId, message: 'Order updated successfully' });
                });
                return;
              }

              items.forEach((item) => {
                db.run(
                  'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                  [
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.unit_price,
                    item.quantity * item.unit_price,
                  ],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }

                    completed++;
                    if (completed === items.length) {
                      db.run('COMMIT', (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ id: orderId, message: 'Order updated successfully' });
                      });
                    }
                  }
                );
              });
            });
          } else {
            db.run('COMMIT', (err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ id: orderId, message: 'Order updated successfully' });
            });
          }
        }
      );
    });
  });

  // Update order status
  router.patch('/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    db.run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ id: orderId, status, message: 'Order status updated successfully' });
      }
    );
  });

  // Delete order
  router.delete('/:id', (req, res) => {
    const orderId = req.params.id;
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Delete order items (cascade should handle this, but being explicit)
      db.run('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        // Delete order
        db.run('DELETE FROM orders WHERE id = ?', [orderId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          db.run('COMMIT', (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Order deleted successfully' });
          });
        });
      });
    });
  });

  return router;
};





