module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Get all employees
  router.get('/', (req, res) => {
    db.get(
      "SELECT 1 AS hasColumn FROM pragma_table_info('expenses') WHERE name = 'employee_id' LIMIT 1",
      (metaErr, columnInfo) => {
        if (metaErr) {
          return res.status(500).json({ error: metaErr.message });
        }

        const hasEmployeeLink = !!columnInfo;
        const query = hasEmployeeLink
          ? `
              SELECT 
                e.*,
                COALESCE(e.salary, 0) AS monthly_allowance,
                COALESCE(SUM(f.amount), 0) AS total_withdrawn
              FROM employees e
              LEFT JOIN expenses f
                ON f.employee_id = e.id
                AND f.type = 'expense'
                AND f.category = 'Employee Withdrawal'
                AND strftime('%Y-%m', f.expense_date) = strftime('%Y-%m', 'now')
              GROUP BY e.id
              ORDER BY e.created_at DESC
            `
          : `
              SELECT 
                e.*, 
                COALESCE(e.salary, 0) AS monthly_allowance,
                0 AS total_withdrawn
              FROM employees e
              ORDER BY e.created_at DESC
            `;

        db.all(query, (err, rows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const formatted = rows.map((row) => {
            const allowance = Number(row.monthly_allowance ?? row.salary ?? 0) || 0;
            const withdrawn = Number(row.total_withdrawn || 0);
            const remaining = allowance - withdrawn;
            return {
              ...row,
              monthly_allowance: allowance,
              total_withdrawn: withdrawn,
              balance_remaining: remaining,
            };
          });

          res.json(formatted);
        });
      }
    );
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
    const { name, email, phone, position, hire_date, status, monthly_allowance } = req.body;
    const allowanceValue = monthly_allowance !== undefined && monthly_allowance !== null
      ? parseFloat(monthly_allowance) || 0
      : 0;
    
    db.run(
      'INSERT INTO employees (name, email, phone, position, salary, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, position, allowanceValue, hire_date, status || 'active'],
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
    const { name, email, phone, position, hire_date, status, monthly_allowance } = req.body;
    const allowanceValue = monthly_allowance !== undefined && monthly_allowance !== null
      ? parseFloat(monthly_allowance) || 0
      : 0;
    
    db.run(
      'UPDATE employees SET name = ?, email = ?, phone = ?, position = ?, salary = ?, hire_date = ?, status = ? WHERE id = ?',
      [name, email, phone, position, allowanceValue, hire_date, status, req.params.id],
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
