module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  const EMPLOYEE_WITHDRAWAL_CATEGORY = 'Employee Withdrawal';

  const ensureEmployeeWithdrawalWithinAllowance = (employeeId, amount, date, excludeId, callback) => {
    db.get(
      'SELECT id, name, salary FROM employees WHERE id = ?',
      [employeeId],
      (employeeErr, employee) => {
        if (employeeErr) {
          return callback(employeeErr);
        }
        if (!employee) {
          return callback({ status: 404, message: 'Employee not found' });
        }

        const allowance = Number(employee.salary || 0) || 0;
        const params = [employeeId, EMPLOYEE_WITHDRAWAL_CATEGORY, date];
        let query = `
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM expenses
          WHERE employee_id = ?
            AND type = 'expense'
            AND category = ?
            AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', ?)
        `;
        if (excludeId) {
          query += ' AND id != ?';
          params.push(excludeId);
        }

        db.get(query, params, (sumErr, row) => {
          if (sumErr) {
            return callback(sumErr);
          }

          const alreadyWithdrawn = Number(row?.total || 0);
          const projected = alreadyWithdrawn + amount;

          if (projected - allowance > 0.0001) {
            const remaining = Math.max(allowance - alreadyWithdrawn, 0);
            return callback({
              status: 400,
              message: `Withdrawal exceeds allowance. Remaining ₪${remaining.toFixed(
                2
              )}. Requested ₪${amount.toFixed(2)}.`,
            });
          }

          callback(null, {
            allowance,
            alreadyWithdrawn,
            remaining: allowance - alreadyWithdrawn,
            employeeName: employee.name,
          });
        });
      }
    );
  };

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

    if (!type || amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Type and amount are required' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
    }

    const amountValue = parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const normalizedCategory = category || '';
    const date = expense_date || new Date().toISOString().split('T')[0];
    const hasEmployeeId = employee_id !== undefined && employee_id !== null && employee_id !== '';
    const employeeIdValue = hasEmployeeId ? parseInt(employee_id, 10) : null;

    if (hasEmployeeId && Number.isNaN(employeeIdValue)) {
      return res.status(400).json({ error: 'Invalid employee identifier' });
    }

    const insertRecord = () => {
      db.run(
        'INSERT INTO expenses (type, category, amount, description, expense_date, employee_id) VALUES (?, ?, ?, ?, ?, ?)',
        [type, normalizedCategory, amountValue, description || '', date, employeeIdValue],
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
    };

    if (type === 'expense' && normalizedCategory === EMPLOYEE_WITHDRAWAL_CATEGORY) {
      if (!employeeIdValue) {
        return res
          .status(400)
          .json({ error: 'Employee selection is required for withdrawal expenses' });
      }

      ensureEmployeeWithdrawalWithinAllowance(
        employeeIdValue,
        amountValue,
        date,
        null,
        (validationErr) => {
          if (validationErr) {
            if (validationErr.status) {
              return res.status(validationErr.status).json({ error: validationErr.message });
            }
            return res.status(500).json({ error: validationErr.message || validationErr });
          }
          insertRecord();
        }
      );
    } else {
      insertRecord();
    }
  });

  // Update income/expense record
  router.put('/:id', (req, res) => {
    const { id } = req.params;

    getExpenseById(id, (err, existingRecord) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!existingRecord) {
        return res.status(404).json({ error: 'Record not found' });
      }

      const newType = req.body.type !== undefined ? req.body.type : existingRecord.type;
      if (newType !== 'income' && newType !== 'expense') {
        return res.status(400).json({ error: 'Type must be either "income" or "expense"' });
      }

      const newCategory =
        req.body.category !== undefined ? req.body.category : existingRecord.category || '';
      const amountSource = req.body.amount !== undefined ? req.body.amount : existingRecord.amount;
      const newAmount = parseFloat(amountSource);
      if (Number.isNaN(newAmount) || newAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      const newDescription =
        req.body.description !== undefined ? req.body.description : existingRecord.description;
      const newDate =
        req.body.expense_date !== undefined && req.body.expense_date !== null && req.body.expense_date !== ''
          ? req.body.expense_date
          : existingRecord.expense_date || new Date().toISOString().split('T')[0];

      let employeeIdValue;
      if (req.body.employee_id !== undefined) {
        if (req.body.employee_id === null || req.body.employee_id === '') {
          employeeIdValue = null;
        } else {
          employeeIdValue = parseInt(req.body.employee_id, 10);
          if (Number.isNaN(employeeIdValue)) {
            return res.status(400).json({ error: 'Invalid employee identifier' });
          }
        }
      } else {
        employeeIdValue =
          existingRecord.employee_id !== undefined && existingRecord.employee_id !== null
            ? existingRecord.employee_id
            : null;
      }

      const normalizedCategory = newCategory || '';

      const performUpdate = () => {
        db.run(
          'UPDATE expenses SET type = ?, category = ?, amount = ?, description = ?, expense_date = ?, employee_id = ? WHERE id = ?',
          [newType, normalizedCategory, newAmount, newDescription || '', newDate, employeeIdValue, id],
          function (updateErr) {
            if (updateErr) {
              return res.status(500).json({ error: updateErr.message });
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
      };

      if (newType === 'expense' && normalizedCategory === EMPLOYEE_WITHDRAWAL_CATEGORY) {
        if (!employeeIdValue) {
          return res
            .status(400)
            .json({ error: 'Employee selection is required for withdrawal expenses' });
        }

        ensureEmployeeWithdrawalWithinAllowance(
          employeeIdValue,
          newAmount,
          newDate,
          id,
          (validationErr) => {
            if (validationErr) {
              if (validationErr.status) {
                return res.status(validationErr.status).json({ error: validationErr.message });
              }
              return res.status(500).json({ error: validationErr.message || validationErr });
            }
            performUpdate();
          }
        );
      } else {
        performUpdate();
      }
    });
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

