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

  // Get all income/expense records (including sales)
  router.get('/', (req, res) => {
    const { type, startDate, endDate } = req.query;
    let expenseQuery = `${baseSelectQuery} WHERE 1=1`;
    const expenseParams = [];

    if (type) {
      // If type is 'expense', only get expenses
      // If type is 'income', get both income records AND sales
      if (type === 'expense') {
        expenseQuery += ' AND expenses.type = ?';
        expenseParams.push(type);
      } else if (type === 'income') {
        expenseQuery += ' AND expenses.type = ?';
        expenseParams.push(type);
        // Sales will be added separately below
      }
    }

    if (startDate) {
      expenseQuery += ' AND DATE(expenses.expense_date) >= ?';
      expenseParams.push(startDate);
    }

    if (endDate) {
      expenseQuery += ' AND DATE(expenses.expense_date) <= ?';
      expenseParams.push(endDate);
    }

    expenseQuery += ' ORDER BY expenses.expense_date DESC, expenses.created_at DESC';

    // Get expense/income records
    db.all(expenseQuery, expenseParams, (err, expenseRows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // If type is 'expense', don't include sales
      if (type === 'expense') {
        return res.json(expenseRows);
      }

      // Get sales records
      let salesQuery = `
        SELECT 
          s.id,
          s.sale_date as expense_date,
          s.total_amount as amount,
          s.payment_method,
          s.employee_id,
          s.notes as description,
          e.name as employee_name,
          'income' as type,
          'Sales' as category
        FROM sales s
        LEFT JOIN employees e ON s.employee_id = e.id
        WHERE 1=1
      `;
      const salesParams = [];

      if (startDate) {
        salesQuery += ' AND DATE(s.sale_date) >= ?';
        salesParams.push(startDate);
      }

      if (endDate) {
        salesQuery += ' AND DATE(s.sale_date) <= ?';
        salesParams.push(endDate);
      }

      salesQuery += ' ORDER BY s.sale_date DESC';

      db.all(salesQuery, salesParams, (salesErr, salesRows) => {
        if (salesErr) {
          return res.status(500).json({ error: salesErr.message });
        }

        // Combine expense/income records with sales
        const allRecords = [...expenseRows, ...salesRows];

        // Sort by date (most recent first)
        allRecords.sort((a, b) => {
          const dateA = new Date(a.expense_date || a.sale_date || 0);
          const dateB = new Date(b.expense_date || b.sale_date || 0);
          return dateB - dateA;
        });

        res.json(allRecords);
      });
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
    let expenseWhereClause = 'WHERE 1=1';
    let salesWhereClause = 'WHERE 1=1';
    const expenseParams = [];
    const salesParams = [];

    if (startDate) {
      expenseWhereClause += ' AND DATE(expense_date) >= ?';
      expenseParams.push(startDate);
      salesWhereClause += ' AND DATE(sale_date) >= ?';
      salesParams.push(startDate);
    }

    if (endDate) {
      expenseWhereClause += ' AND DATE(expense_date) <= ?';
      expenseParams.push(endDate);
      salesWhereClause += ' AND DATE(sale_date) <= ?';
      salesParams.push(endDate);
    }

    const expenseQuery = `
      SELECT 
        type,
        COALESCE(SUM(amount), 0) as total,
        COUNT(*) as count
      FROM expenses
      ${expenseWhereClause}
      GROUP BY type
    `;

    const salesQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as count
      FROM sales
      ${salesWhereClause}
    `;

    // First, get expense/income stats
    db.all(expenseQuery, expenseParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const stats = {
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        incomeCount: 0,
        expenseCount: 0,
        salesCount: 0,
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

      // Then, get sales totals and add to income
      db.get(salesQuery, salesParams, (salesErr, salesRow) => {
        if (salesErr) {
          return res.status(500).json({ error: salesErr.message });
        }

        const salesTotal = salesRow?.total || 0;
        const salesCount = salesRow?.count || 0;
        
        // Add sales to total income
        stats.totalIncome = (stats.totalIncome || 0) + salesTotal;
        stats.salesCount = salesCount;
        
        // Recalculate net amount with sales included
        stats.netAmount = stats.totalIncome - stats.totalExpenses;

        res.json(stats);
      });
    });
  });

  return router;
};

