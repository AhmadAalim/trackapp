module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Get all clients
  router.get('/', (req, res) => {
    const query = `
      SELECT 
        c.*,
        COUNT(ct.id) as transaction_count
      FROM clients c
      LEFT JOIN client_transactions ct ON c.id = ct.client_id
      GROUP BY c.id
      ORDER BY c.balance DESC, c.name ASC
    `;
    
    db.all(query, [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single client with transactions
  router.get('/:id', (req, res) => {
    const clientQuery = 'SELECT * FROM clients WHERE id = ?';
    const transactionsQuery = `
      SELECT ct.*, 
        o.order_number as related_order_number,
        s.id as related_sale_id
      FROM client_transactions ct
      LEFT JOIN orders o ON ct.related_order_id = o.id
      LEFT JOIN sales s ON ct.related_sale_id = s.id
      WHERE ct.client_id = ?
      ORDER BY ct.created_at DESC
    `;

    db.get(clientQuery, [req.params.id], (err, client) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      db.all(transactionsQuery, [req.params.id], (err, transactions) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ ...client, transactions });
      });
    });
  });

  // Create client
  router.post('/', (req, res) => {
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      notes,
      initial_balance = 0,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        `INSERT INTO clients (
          name, contact_person, email, phone, address, balance, notes, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          name.trim(),
          contact_person || null,
          email || null,
          phone || null,
          address || null,
          parseFloat(initial_balance) || 0,
          notes || null,
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          const clientId = this.lastID;

          // If initial balance is provided, create a transaction
          if (parseFloat(initial_balance) !== 0) {
            const transactionType = parseFloat(initial_balance) > 0 ? 'charge' : 'payment';
            db.run(
              `INSERT INTO client_transactions (
                client_id, transaction_type, amount, description, created_at
              ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              [
                clientId,
                transactionType,
                Math.abs(parseFloat(initial_balance)),
                'Initial balance',
              ],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }

                db.run('COMMIT', (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  res.json({ id: clientId, message: 'Client created successfully' });
                });
              }
            );
          } else {
            db.run('COMMIT', (err) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ id: clientId, message: 'Client created successfully' });
            });
          }
        }
      );
    });
  });

  // Update client
  router.put('/:id', (req, res) => {
    const clientId = req.params.id;
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      notes,
    } = req.body;

    if (name && !name.trim()) {
      return res.status(400).json({ error: 'Client name cannot be empty' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (contact_person !== undefined) {
      updates.push('contact_person = ?');
      params.push(contact_person || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email || null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(clientId);

    db.run(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ id: clientId, message: 'Client updated successfully' });
      }
    );
  });

  // Add transaction (charge or payment)
  router.post('/:id/transactions', (req, res) => {
    const clientId = req.params.id;
    const {
      transaction_type,
      amount,
      description,
      related_order_id,
      related_sale_id,
    } = req.body;

    if (!transaction_type || !['charge', 'payment'].includes(transaction_type)) {
      return res.status(400).json({
        error: 'Transaction type must be "charge" or "payment"',
      });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const transactionAmount = parseFloat(amount);
    const balanceChange = transaction_type === 'charge' ? transactionAmount : -transactionAmount;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Insert transaction
      db.run(
        `INSERT INTO client_transactions (
          client_id, transaction_type, amount, description, 
          related_order_id, related_sale_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          clientId,
          transaction_type,
          transactionAmount,
          description || null,
          related_order_id || null,
          related_sale_id || null,
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          // Update client balance
          db.run(
            'UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [balanceChange, clientId],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({
                  id: this.lastID,
                  message: 'Transaction added successfully',
                });
              });
            }
          );
        }
      );
    });
  });

  // Delete transaction (and adjust balance)
  router.delete('/transactions/:transactionId', (req, res) => {
    const transactionId = req.params.transactionId;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Get transaction details
      db.get(
        'SELECT client_id, transaction_type, amount FROM client_transactions WHERE id = ?',
        [transactionId],
        (err, transaction) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          if (!transaction) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Transaction not found' });
          }

          // Reverse the balance change
          const balanceChange =
            transaction.transaction_type === 'charge'
              ? -parseFloat(transaction.amount)
              : parseFloat(transaction.amount);

          // Update client balance
          db.run(
            'UPDATE clients SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [balanceChange, transaction.client_id],
            (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
              }

              // Delete transaction
              db.run(
                'DELETE FROM client_transactions WHERE id = ?',
                [transactionId],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                  }

                  db.run('COMMIT', (err) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Transaction deleted successfully' });
                  });
                }
              );
            }
          );
        }
      );
    });
  });

  // Delete client
  router.delete('/:id', (req, res) => {
    const clientId = req.params.id;
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Delete transactions (cascade should handle this, but being explicit)
      db.run('DELETE FROM client_transactions WHERE client_id = ?', [clientId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }

        // Delete client
        db.run('DELETE FROM clients WHERE id = ?', [clientId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: err.message });
          }

          db.run('COMMIT', (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Client deleted successfully' });
          });
        });
      });
    });
  });

  return router;
};

