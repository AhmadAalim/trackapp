/**
 * Enhanced Reports Routes
 * Sales analytics, product performance, time-based reports
 */

module.exports = (db) => {
  const express = require('express');
  const router = express.Router();
  const { authenticate, requireEmployee } = require('../middleware/auth');

  // Dashboard summary (no auth for now to keep dashboard accessible)
  router.get('/dashboard', (req, res) => {
    // Helper to check if a column exists on a table
    const columnExists = (table, column, cb) => {
      db.all(`PRAGMA table_info(${table})`, [], (err, rows) => {
        if (err) return cb(false);
        const exists = Array.isArray(rows) && rows.some(col => col.name === column);
        cb(exists);
      });
    };

    // Determine which sales date column exists
    columnExists('sales', 'sale_date', (hasSaleDate) => {
      if (hasSaleDate) {
        proceedWithColumns('sale_date');
      } else {
        columnExists('sales', 'date_time', (hasDateTime) => {
          proceedWithColumns(hasDateTime ? 'date_time' : null);
        });
      }
    });

    const proceedWithColumns = (salesDateColumn) => {
      columnExists('employees', 'status', (hasStatus) => {
        columnExists('products', 'cost_price', (hasCostPrice) => {
          const costExpression = hasCostPrice
            ? 'COALESCE(cost, cost_price, 0)'
            : 'COALESCE(cost, 0)';

          const queries = {
            totalProducts: `SELECT COUNT(*) AS c FROM products`,
            todaySales: `SELECT COALESCE(SUM(total_amount), 0) AS s FROM sales ${salesDateColumn ? `WHERE DATE(${salesDateColumn}) = DATE('now','localtime')` : ''}`,
            activeEmployees: hasStatus
              ? `SELECT COUNT(*) AS c FROM employees WHERE status = 'active'`
              : `SELECT COUNT(*) AS c FROM employees`,
            totalSuppliers: `SELECT COUNT(*) AS c FROM suppliers`,
            monthlySales: `SELECT COALESCE(SUM(total_amount), 0) AS s FROM sales ${salesDateColumn ? `WHERE strftime('%Y-%m', ${salesDateColumn}) = strftime('%Y-%m','now','localtime')` : ''}`,
            lowStockItems: `SELECT COUNT(*) AS c FROM products WHERE COALESCE(stock_quantity,0) <= COALESCE(min_stock_level, 10)`,
            totalIncome: `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'income'`,
            totalExpenses: `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE type = 'expense'`,
            inventoryValue: `SELECT COALESCE(SUM(COALESCE(stock_quantity,0) * ${costExpression}), 0) AS v FROM products`,
          };

          const results = {};

          db.get(queries.totalProducts, [], (e1, r1) => {
            if (e1) return res.status(500).json({ error: e1.message });
            results.totalProducts = r1?.c || 0;

            db.get(queries.todaySales, [], (e2, r2) => {
              if (e2) return res.status(500).json({ error: e2.message });
              results.todaySales = r2?.s || 0;

              db.get(queries.activeEmployees, [], (e3, r3) => {
                if (e3) return res.status(500).json({ error: e3.message });
                results.activeEmployees = r3?.c || 0;

                db.get(queries.totalSuppliers, [], (e4, r4) => {
                  if (e4) return res.status(500).json({ error: e4.message });
                  results.totalSuppliers = r4?.c || 0;

                  db.get(queries.monthlySales, [], (e5, r5) => {
                    if (e5) return res.status(500).json({ error: e5.message });
                    results.monthlySales = r5?.s || 0;

                    db.get(queries.lowStockItems, [], (e6, r6) => {
                      if (e6) return res.status(500).json({ error: e6.message });
                      results.lowStockItems = r6?.c || 0;

                      db.get(queries.totalIncome, [], (e7, r7) => {
                        if (e7) return res.status(500).json({ error: e7.message });
                        results.totalIncome = r7?.total || 0;

                        db.get(queries.totalExpenses, [], (e8, r8) => {
                          if (e8) return res.status(500).json({ error: e8.message });
                          results.totalExpenses = r8?.total || 0;
                          results.netAmount = results.totalIncome - results.totalExpenses;

                          db.get(queries.inventoryValue, [], (e9, r9) => {
                            if (e9) return res.status(500).json({ error: e9.message });
                            results.inventoryValue = r9?.v || 0;

                            return res.json(results);
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    };
  });

  // Sales trend (daily/weekly/monthly)
  router.get('/sales-trend', authenticate, requireEmployee, (req, res) => {
    const { period = 'daily', startDate, endDate } = req.query;

    let dateFormat = '';
    let dateFilter = '';
    const params = [];

    switch (period) {
      case 'daily':
        dateFormat = "strftime('%Y-%m-%d', date_time)";
        break;
      case 'weekly':
        dateFormat = "strftime('%Y-W%W', date_time)";
        break;
      case 'monthly':
        dateFormat = "strftime('%Y-%m', date_time)";
        break;
      default:
        dateFormat = "strftime('%Y-%m-%d', date_time)";
    }

    if (startDate && endDate) {
      dateFilter = 'WHERE date_time >= ? AND date_time <= ?';
      params.push(startDate, endDate);
    }

    const query = `
      SELECT 
        ${dateFormat} as period,
        COUNT(*) as sale_count,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale
      FROM sales
      ${dateFilter}
      GROUP BY period
      ORDER BY period
    `;

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Product performance report
  router.get('/product-performance', authenticate, requireEmployee, (req, res) => {
    const { productId, startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate && endDate) {
      dateFilter = 'AND s.date_time >= ? AND s.date_time <= ?';
      params.push(startDate, endDate);
    }

    if (productId) {
      params.unshift(productId);
    } else {
      params.unshift('%'); // Match all products
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.category,
        p.cost_price,
        p.selling_price,
        COUNT(DISTINCT si.sale_id) as times_sold,
        SUM(si.quantity) as total_quantity_sold,
        SUM(si.total_price) as total_revenue,
        AVG(si.unit_price) as average_selling_price,
        SUM(si.total_price) - (SUM(si.quantity) * p.cost_price) as total_profit
      FROM products p
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE p.id LIKE ?
      ${dateFilter}
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `;

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  return router;
};
