module.exports = (db) => {
  const express = require('express');
  const router = express.Router();

  // Dashboard statistics
  router.get('/dashboard', (req, res) => {
    const stats = {};

    // Total products
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalProducts = row.count;

      // Low stock items
      db.get('SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.lowStockItems = row.count;

        // Total sales today
        db.get("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE DATE(sale_date) = DATE('now')", (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.todaySales = row.total;

          // Total sales this month
          db.get("SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE strftime('%Y-%m', sale_date) = strftime('%Y-%m', 'now')", (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.monthlySales = row.total;

            // Total employees
            db.get("SELECT COUNT(*) as count FROM employees WHERE status = 'active'", (err, row) => {
              if (err) return res.status(500).json({ error: err.message });
              stats.activeEmployees = row.count;

              // Total suppliers
              db.get('SELECT COUNT(*) as count FROM suppliers', (err, row) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.totalSuppliers = row.count;

                // Total inventory value
                db.get('SELECT COALESCE(SUM(price * stock_quantity), 0) as total FROM products', (err, row) => {
                  if (err) return res.status(500).json({ error: err.message });
                  stats.inventoryValue = row.total;

                  res.json(stats);
                });
              });
            });
          });
        });
      });
    });
  });

  // Sales report
  router.get('/sales', (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT 
        DATE(s.sale_date) as date,
        COUNT(s.id) as sale_count,
        SUM(s.total_amount) as total_amount
      FROM sales s
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      query += ' AND DATE(s.sale_date) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(s.sale_date) <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY DATE(s.sale_date) ORDER BY date DESC';

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  return router;
};
