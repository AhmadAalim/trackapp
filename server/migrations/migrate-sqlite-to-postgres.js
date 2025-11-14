// Migrate data from SQLite to PostgreSQL
// Run this after PostgreSQL tables are created

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PostgresDB = require('../db-postgres');

async function migrateData() {
  console.log('🔄 Starting data migration from SQLite to PostgreSQL...\n');

  // Connect to PostgreSQL
  const pgDB = new PostgresDB();
  await pgDB.connect();

  // Connect to SQLite
  const sqlitePath = process.env.DB_PATH || path.join(__dirname, '../store.db');
  const sqliteDB = new sqlite3.Database(sqlitePath);

  // Helper to get all rows from SQLite
  const getAllFromSQLite = (table) => {
    return new Promise((resolve, reject) => {
      sqliteDB.all(`SELECT * FROM ${table}`, (err, rows) => {
        if (err) {
          // Table might not exist, return empty array
          if (err.message.includes('no such table')) {
            resolve([]);
          } else {
            reject(err);
          }
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  // Helper to insert into PostgreSQL
  const insertIntoPostgres = async (table, rows) => {
    if (rows.length === 0) {
      console.log(`  ⏭️  ${table}: No data to migrate`);
      return;
    }

    for (const row of rows) {
      try {
        const columns = Object.keys(row).filter(k => k !== 'id');
        const values = columns.map(col => row[col]);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const columnNames = columns.join(', ');

        const sql = `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        await pgDB.query(sql, values);
      } catch (err) {
        console.error(`  ❌ Error inserting into ${table}:`, err.message);
      }
    }
    console.log(`  ✅ ${table}: Migrated ${rows.length} row(s)`);
  };

  try {
    // Migrate products
    console.log('📦 Migrating products...');
    const products = await getAllFromSQLite('products');
    await insertIntoPostgres('products', products);

    // Migrate employees
    console.log('\n👥 Migrating employees...');
    const employees = await getAllFromSQLite('employees');
    await insertIntoPostgres('employees', employees);

    // Migrate suppliers
    console.log('\n🏢 Migrating suppliers...');
    const suppliers = await getAllFromSQLite('suppliers');
    await insertIntoPostgres('suppliers', suppliers);

    // Migrate sales
    console.log('\n💰 Migrating sales...');
    const sales = await getAllFromSQLite('sales');
    await insertIntoPostgres('sales', sales);

    // Migrate sale_items
    console.log('\n🛒 Migrating sale_items...');
    const saleItems = await getAllFromSQLite('sale_items');
    await insertIntoPostgres('sale_items', saleItems);

    // Migrate expenses
    console.log('\n💸 Migrating expenses...');
    const expenses = await getAllFromSQLite('expenses');
    await insertIntoPostgres('expenses', expenses);

    // Migrate purchase_orders
    console.log('\n📋 Migrating purchase_orders...');
    const purchaseOrders = await getAllFromSQLite('purchase_orders');
    await insertIntoPostgres('purchase_orders', purchaseOrders);

    console.log('\n✅ Migration complete!');
    console.log('\n📊 Check DBeaver to see your data:');
    console.log('   SELECT * FROM products;');
    console.log('   SELECT * FROM sales;');
    console.log('   SELECT * FROM employees;');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    sqliteDB.close();
    await pgDB.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateData().catch(console.error);
}

module.exports = migrateData;

