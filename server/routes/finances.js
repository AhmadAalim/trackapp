module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  const baseSelectQuery = `
    SELECT expenses.*, employees.name AS employee_name
    FROM expenses
    LEFT JOIN employees ON expenses.employee_id = employees.id
  `;

  const getExpenseById = (id, callback) => {
    db.get(`${baseSelectQuery} WHERE expenses.id = ?`, [id], callback);
  };

  // Get all income/expense records
  router.get('/', (req, res) => {
    const { type, startDate, endDate } = req.query;
    let query = `${baseSelectQuery} WHERE 1=1`;
    const params = [];

    if (type) {
      query += ' AND expenses.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND DATE(expenses.expense_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(expenses.expense_date) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY expenses.expense_date DESC, expenses.created_at DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single income/expense record
  router.get('/:id', (req, res) => {
    const { id } = req.params;
    getExpenseById(id, (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json(row);
    });
  });

  // Create income/expense record
  router.post('/', (req, res) => {
    const { type, category, amount, description, expense_date, employee_id } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    const date = expense_date || new Date().toISOString().split('T')[0];
    const employeeIdValue = employee_id ? parseInt(employee_id, 10) : null;

    db.run(
      'INSERT INTO expenses (type, category, amount, description, expense_date, employee_id) VALUES (?, ?, ?, ?, ?, ?)',
      [type, category || '', parseFloat(amount), description || '', date, employeeIdValue],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        getExpenseById(this.lastID, (fetchErr, row) => {
          if (fetchErr) {
            return res.status(500).json({ error: fetchErr.message });
          }
          res.status(201).json(row);
        });
      }
    );
  });

  // Update income/expense record
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { type, category, amount, description, expense_date, employee_id } = req.body;

    if (type && type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    const updates = [];
    const params = [];

    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (amount !== undefined) {
      updates.push('amount = ?');
      params.push(parseFloat(amount));
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (expense_date !== undefined) {
      updates.push('expense_date = ?');
      params.push(expense_date);
    }

    if (employee_id !== undefined) {
      updates.push('employee_id = ?');
      params.push(employee_id ? parseInt(employee_id, 10) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    db.run(
      `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Record not found' });
        }
        getExpenseById(id, (fetchErr, row) => {
          if (fetchErr) {
            return res.status(500).json({ error: fetchErr.message });
          }
          res.json(row);
        });
      }
    );
  });

  // Delete income/expense record
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM expenses WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ message: 'Record deleted successfully' });
    });
  });

  // Get summary statistics
  router.get('/summary/stats', (req, res) => {
    const { startDate, endDate } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (startDate) {
      whereClause += ' AND DATE(expense_date) >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND DATE(expense_date) <= ?';
      params.push(endDate);
    }

    const query = `
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM expenses
      ${whereClause}
      GROUP BY type
    `;

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        incomeCount: 0,
        expenseCount: 0,
      };

      rows.forEach((row) => {
        if (row.type === 'income') {
          stats.totalIncome = row.total;
          stats.incomeCount = row.count;
        } else if (row.type === 'expense') {
          stats.totalExpenses = row.total;
          stats.expenseCount = row.count;
        }
      });

      stats.netAmount = stats.totalIncome - stats.totalExpenses;

      res.json(stats);
    });
  });

  return router;
};

