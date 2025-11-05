/**
 * Simple database viewer utility
 * Run with: node db-viewer.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'store.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database:', dbPath);
  console.log('');
});

// Function to view all tables
function viewTables() {
  return new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to view data from a table
function viewTableData(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Function to get table schema
function getTableSchema(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Main function
async function main() {
  try {
    console.log('📊 Database Contents\n');
    console.log('='.repeat(50));
    console.log('');

    const tables = await viewTables();
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in the database.');
      console.log('   The tables will be created automatically when the server starts.');
      db.close();
      return;
    }

    for (const table of tables) {
      const tableName = table.name;
      console.log(`\n📋 Table: ${tableName}`);
      console.log('-'.repeat(50));
      
      // Get schema
      const schema = await getTableSchema(tableName);
      console.log('Columns:');
      schema.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      
      // Get data
      const data = await viewTableData(tableName);
      console.log(`\nRecords: ${data.length}`);
      
      if (data.length > 0) {
        console.log('Data:');
        console.table(data.slice(0, 10)); // Show first 10 records
        if (data.length > 10) {
          console.log(`... and ${data.length - 10} more records`);
        }
      } else {
        console.log('(No data in this table yet)');
      }
      console.log('');
    }

    console.log('='.repeat(50));
    console.log('\n✅ Database viewing complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.close((err) => {
      if (err && !err.message.includes('closed')) {
        console.error('Error closing database:', err.message);
      }
      process.exit(0);
    });
  }
}

main();

