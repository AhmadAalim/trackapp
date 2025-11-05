module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Get all suppliers
  router.get('/', (req, res) => {
    db.all('SELECT * FROM suppliers ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single supplier
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM suppliers WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json(row);
    });
  });

  // Create supplier
  router.post('/', (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    
    db.run(
      'INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [name, contact_person, email, phone, address],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Supplier created successfully' });
      }
    );
  });

  // Update supplier
  router.put('/:id', (req, res) => {
    const { name, contact_person, email, phone, address } = req.body;
    
    db.run(
      'UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, contact_person, email, phone, address, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json({ message: 'Supplier updated successfully' });
      }
    );
  });

  // Delete supplier
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM suppliers WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Supplier not found' });
      }
      res.json({ message: 'Supplier deleted successfully' });
    });
  });

  return router;
};
