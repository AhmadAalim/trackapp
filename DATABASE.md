# Database Setup and Management Guide

## Database Connection

The TrackApp uses **SQLite** as its database, which is already configured and ready to use. The database file is located at:
```
server/store.db
```

## Automatic Setup

The database and all tables are **automatically created** when you start the server:
```bash
npm run dev
```

When the server starts, it will:
1. Connect to the SQLite database
2. Create all necessary tables if they don't exist:
   - `products` - Inventory items
   - `employees` - Employee records
   - `suppliers` - Supplier information
   - `sales` - Sales transactions
   - `sale_items` - Individual sale line items
   - `expenses` - Income/Expense records
   - `purchase_orders` - Purchase orders

## Adding Data to the Store

### Option 1: Through the Web Interface (Recommended)

The easiest way to add data is through the web application:

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Access the web interface:**
   - Open http://localhost:3000 in your browser

3. **Add data through the UI:**
   - **Inventory**: Go to "Inventory" tab → Click "Add Product"
   - **Employees**: Go to "Employees" tab → Click "Add Employee"
   - **Suppliers**: Go to "Suppliers" tab → Click "Add Supplier"
   - **Sales**: Go to "Sales" tab → Create new sales
   - **Income/Expense**: Go to "Income/Expense" tab → Use + or - buttons

### Option 2: View Database Contents

To view what's in the database:

```bash
cd server
npm run db-view
```

Or manually:
```bash
cd server
node db-viewer.js
```

### Option 3: Using SQLite Command Line

If you have SQLite installed, you can interact with the database directly:

```bash
# Open SQLite shell
sqlite3 server/store.db

# View all tables
.tables

# View data from a table
SELECT * FROM products;
SELECT * FROM employees;
SELECT * FROM suppliers;
SELECT * FROM expenses;

# Exit SQLite
.quit
```

### Option 4: Using Database GUI Tools

You can use any SQLite GUI tool to view and edit the database:

**Recommended Tools:**
- **DB Browser for SQLite** (Free, cross-platform)
  - Download: https://sqlitebrowser.org/
  - Open: `server/store.db`
- **TablePlus** (Mac/Windows)
- **DBeaver** (Free, cross-platform)

## Database Configuration

The database configuration is set in `server/.env`:

```env
DB_PATH=store.db
PORT=5000
```

The database file path is relative to the `server` directory by default.

## Database Structure

### Products Table
- id, name, description, sku, category, price, cost
- stock_quantity, min_stock_level, supplier_id
- created_at, updated_at

### Employees Table
- id, name, email, phone, position, salary
- hire_date, status, created_at

### Suppliers Table
- id, name, contact_person, email, phone, address
- created_at

### Sales Table
- id, sale_date, total_amount, payment_method
- employee_id, notes

### Expenses Table (Income/Expense)
- id, type ('income' or 'expense'), category, amount
- description, expense_date, created_at

## Troubleshooting

### Database Not Found
If you get errors about the database:
1. Make sure the server directory exists
2. Start the server - it will create the database automatically
3. Check file permissions in the server directory

### Tables Not Created
If tables aren't created:
1. Stop the server (Ctrl+C)
2. Delete `server/store.db` if it exists
3. Start the server again - tables will be recreated

### Permission Issues
If you get permission errors:
```bash
chmod 644 server/store.db
```

## Switching to PostgreSQL or MySQL

If you want to use PostgreSQL or MySQL instead of SQLite:

1. Install the database driver:
   ```bash
   # For PostgreSQL
   npm install pg
   
   # For MySQL
   npm install mysql2
   ```

2. Update `server/index.js` to use the new database driver

3. Update `server/.env` with your database credentials

4. Modify SQL queries to match your database syntax

