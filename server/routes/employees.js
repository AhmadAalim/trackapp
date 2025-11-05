module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Get all employees
  router.get('/', (req, res) => {
    db.all('SELECT * FROM employees ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single employee
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(row);
    });
  });

  // Create employee
  router.post('/', (req, res) => {
    const { name, email, phone, position, salary, hire_date, status } = req.body;
    
    db.run(
      'INSERT INTO employees (name, email, phone, position, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, position, salary, hire_date, status || 'active'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Employee created successfully' });
      }
    );
  });

  // Update employee
  router.put('/:id', (req, res) => {
    const { name, email, phone, position, salary, hire_date, status } = req.body;
    
    db.run(
      'UPDATE employees SET name = ?, email = ?, phone = ?, position = ?, salary = ?, hire_date = ?, status = ? WHERE id = ?',
      [name, email, phone, position, salary, hire_date, status, req.params.id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee updated successfully' });
      }
    );
  });

  // Delete employee
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM employees WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json({ message: 'Employee deleted successfully' });
    });
  });

  return router;
};
