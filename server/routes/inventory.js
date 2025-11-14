module.exports = (db, upload, uploadImage, path) => {
  const express = require('express');
  const XLSX = require('xlsx');
  const fs = require('fs');
  const { generateSKUSimple, calculateFinalPrice, getNextSequentialNumberSync } = require('../utils/skuGenerator');
  const router = express.Router();

  // Auto-categorization helper based on product text
  const categorizeProduct = (name = '', description = '') => {
    const text = `${name} ${description}`.toLowerCase();

    // Naaman keywords (kitchen-related)
    const naamanKeywords = [
      'cookware', 'kitchen ware', 'kitchenware', 'kitchen utensil', 'utensil',
      'kitchen supplies', 'serving items', 'serving', 'dishes', 'plates',
      'trays', 'carafes', 'cups', 'knives', 'storage items for kitchen',
      'kitchen storage', 'kitchen', 'tableware'
    ];

    // Vardinon keywords (bathroom-related)
    const vardinonKeywords = [
      'toilet', 'shower', 'bathroom', 'bath', 'soap dispenser', 'toothbrush',
      'towel', 'bath mat', 'bathroom supplies', 'shower curtain'
    ];

    if (naamanKeywords.some(k => text.includes(k))) return 'Naaman';
    if (vardinonKeywords.some(k => text.includes(k))) return 'Vardinon';
    return '';
  };

  // Normalization helpers for matching
  const normalizeBarcode = (value = '') => {
    // Remove spaces and non-alphanumeric characters to compare barcodes reliably
    return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };
  const normalizeName = (value = '') => {
    return String(value).trim().toLowerCase();
  };

  // Export inventory to Excel
  router.get('/export-excel', (req, res) => {
    db.all('SELECT * FROM products ORDER BY name', (err, products) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Prepare data for Excel
      const worksheetData = products.map(product => ({
        'Product Code': product.sku || '',
        'Product Name': product.name || '',
        'Product Description': product.name || '', // For Excel format compatibility
        'Product Barcode': product.barcode || product.description || '',
        'Quantity': product.stock_quantity || product.quantity || 0,
        'Cost Price': product.cost || product.cost_price || 0,
        'Final Price': product.price || product.selling_price || 0,
        'Category': product.category || '',
        'Min Stock Level': product.min_stock_level || product.min_quantity || 10,
        'Supplier': product.supplier_id || '',
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers
      const filename = `inventory_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Send file
      res.send(excelBuffer);
    });
  });

  // Delete all products - MUST be registered BEFORE any /:id routes
  // This includes GET /:id, PUT /:id, and DELETE /:id
  router.delete('/all', (req, res) => {
    console.log('🔍 DELETE /api/inventory/all - Route matched!');
    console.log('Request URL:', req.originalUrl);
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
    
    // Delete all products from database
    db.run('DELETE FROM products', function(err) {
      if (err) {
        console.error('❌ Database error deleting all products:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const deletedCount = this.changes || 0;
      console.log(`✅ Successfully deleted ${deletedCount} product(s) from database`);
      
      res.status(200).json({ 
        success: true,
        message: `All products deleted successfully. ${deletedCount} product${deletedCount !== 1 ? 's' : ''} removed.`,
        count: deletedCount
      });
    });
  });

  // Get all products (with optional search)
  router.get('/', (req, res) => {
    const { search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    
    if (search) {
      query += ' WHERE name LIKE ? OR sku LIKE ? OR category LIKE ? OR description LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const formattedRows = rows.map((row) => {
        const costValue = Number(row.cost !== undefined && row.cost !== null ? row.cost : row.cost_price || 0);
        const finalPrice = calculateFinalPrice(costValue);
        const sellingPrice = Number(row.price !== undefined && row.price !== null ? row.price : row.selling_price || 0);

        return {
          ...row,
          cost: costValue,
          final_price: finalPrice,
          selling_price: sellingPrice,
        };
      });

      res.json(formattedRows);
    });
  });

  // Upload product image (must come before /:id route)
  router.post('/upload-image', uploadImage.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl, message: 'Image uploaded successfully' });
  });

  // Import products from Excel (must come before /:id route)
  router.post('/import-excel', upload.single('excel'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file provided' });
    }

    try {
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log(`Excel import: Found ${data.length} rows in sheet "${sheetName}"`);
      
      // Log first row to see column names
      if (data.length > 0) {
        console.log('Excel column names:', Object.keys(data[0]));
        console.log('First row sample:', data[0]);
      }

      const results = { success: 0, errors: [], failedRows: [] };

      // Process each row - use Promise.all to wait for all inserts
      const insertPromises = data.map((row, index) => {
        return new Promise((resolve) => {
          // Try multiple column name variations (case-insensitive, with/without spaces, Hebrew support)
          const getValue = (variations) => {
            for (const variant of variations) {
              // Direct match (exact column name)
              if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
                return row[variant];
              }
              // Case-insensitive match (for English text)
              const rowKey = Object.keys(row).find(k => {
                // For non-English text (like Hebrew), try exact match
                if (variant !== variant.toLowerCase() || k !== k.toLowerCase()) {
                  return k === variant;
                }
                // For English, do case-insensitive match
                return k.toLowerCase() === variant.toLowerCase();
              });
              if (rowKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
                return row[rowKey];
              }
            }
            return null;
          };

          // Focus on the specific format: Product Code - Product Name - Product Barcode - Quantity - Cost Price - Final Price
          
          // Product Code (ignore for now, don't use for SKU - leave SKU empty)
          // const productCode = getValue([
          //   'Product Code', 'product code', 'ProductCode', 'Code', 'code',
          //   'קוד פריט', 'קוד' // Hebrew variations
          // ]);

          // Product Description → name field (use Product Description as the product name)
          const productName = getValue([
            'Product Description', 'product description', 'ProductDescription', 'Description', 'description',
            'תיאור פריט', 'תיאור' // Hebrew variations
          ]) || getValue([
            'Product Name', 'product name', 'ProductName', 'Name', 'name', 'Product', 'product',
            'שם מוצר' // Hebrew variations (fallback)
          ]) || `Product ${index + 2}`;

          // Product Barcode → description field
          const productBarcode = getValue([
            'Product Barcode', 'product barcode', 'ProductBarcode', 'Barcode', 'barcode',
            'ברקוד' // Hebrew
          ]);

          // Quantity → stock_quantity
          const quantity = getValue([
            'Quantity', 'quantity', 'Qty', 'qty', 'Stock', 'stock', 'Stock Quantity',
            'כמות' // Hebrew
          ]);

          // Cost Price → cost
          const costPrice = getValue([
            'Cost Price', 'cost price', 'CostPrice', 'Cost', 'cost', 'Purchase Price', 'purchase price',
            'מחיר עלות', 'עלות', 'מחיר לאחר הנחה' // Hebrew variations
          ]);

          // Final Price → price
          const finalPrice = getValue([
            'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
            'מחיר סופי', 'מחיר לצרכן', 'צרכן' // Hebrew variations
          ]);

          // Auto-categorize product
          const derivedCategory = categorizeProduct(productName, productBarcode || '');

          // Helper function to parse numbers from Excel (handles formatted numbers, commas, etc.)
          const parseNumber = (value) => {
            if (value === null || value === undefined || value === '') {
              return null;
            }
            // Convert to string and remove common formatting (commas, spaces, currency symbols)
            const cleaned = String(value).replace(/[,\s₪$€£]/g, '').trim();
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? null : parsed;
          };

          // Parse cost and final price from Excel
          // Cost Price → cost field
          const cost = parseNumber(costPrice);
          // Final Price → price field (selling price)
          const finalPriceParsed = parseNumber(finalPrice);
          
          // Use final price from Excel if provided, otherwise calculate from cost
          // Only calculate if we have a cost but no final price
          const finalPriceValue = finalPriceParsed !== null 
            ? finalPriceParsed 
            : (cost !== null && cost !== undefined ? calculateFinalPrice(cost) : 0);
          
          // Use cost from Excel, or 0 if not provided
          const costValue = cost !== null && cost !== undefined ? cost : 0;
          
          // For Excel import, use timestamp-based sequential to avoid conflicts during bulk import
          const generatedSku = generateSKUSimple(derivedCategory || 'ITEM', costValue, null, finalPriceValue);

          const product = {
            name: productName, // Product Name goes to name field
            description: productBarcode || '', // Product Barcode goes to description field
            sku: generatedSku, // Generated SKU with cost price as last 4 digits
            category: derivedCategory,
            price: finalPriceValue, // Final Price → price (use calculated value if Excel didn't provide it)
            cost: costValue, // Cost Price → cost
            stock_quantity: parseInt(quantity) || 0, // Quantity → stock_quantity
            min_stock_level: 10, // Default minimum stock
            supplier_id: null,
            image_url: null,
          };

          const recordFailure = (message) => {
            results.errors.push(message);
            results.failedRows.push({
              rowNumber: index + 2,
              error: message,
              product: {
                name: product.name,
                description: product.description,
                sku: product.sku,
                category: product.category,
                price: product.price,
                cost: product.cost,
                stock_quantity: product.stock_quantity,
                min_stock_level: product.min_stock_level,
                supplier_id: product.supplier_id,
                image_url: product.image_url,
              },
            });
          };

          console.log(`Row ${index + 2}:`, {
            name: product.name,
            cost: product.cost,
            price: product.price,
            stock: product.stock_quantity,
            costPriceFromExcel: costPrice,
            finalPriceFromExcel: finalPrice,
            parsedCost: cost,
            parsedFinalPrice: finalPriceParsed
          });

          if (!product.name || product.name.trim() === '') {
            recordFailure(`Row ${index + 2}: Missing product name`);
            resolve();
            return;
          }

          // FIRST: Check if product already exists (by barcode, then by name) and merge quantity
          // SECOND: Only insert if product doesn't exist
          
          const hasBarcode = product.description && product.description.trim() !== '';
          const normBarcode = normalizeBarcode(product.description || '');
          const normName = normalizeName(product.name || '');
          
          // Function to merge quantity into existing product
          const mergeQuantity = (existing) => {
            if (!existing) return false;
            
            const quantityToAdd = product.stock_quantity || 0;
            // When updating, use new price/cost from Excel if provided (non-zero), otherwise keep existing values
            const newPrice = (product.price && product.price > 0) ? product.price : existing.price || 0;
            const newCost = (product.cost && product.cost > 0) ? product.cost : existing.cost || 0;
            
            db.run(
              'UPDATE products SET stock_quantity = stock_quantity + ?, price = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [quantityToAdd, newPrice, newCost, existing.id],
              function(updateErr) {
                if (updateErr) {
                  console.error(`Row ${index + 2} update error:`, updateErr.message);
                  recordFailure(`Row ${index + 2}: ${updateErr.message}`);
                  resolve();
                  return;
                }
                console.log(`Row ${index + 2}: Added ${quantityToAdd} to existing product "${product.name}" (ID: ${existing.id}). New total: ${(existing.stock_quantity || 0) + quantityToAdd}, Price: ${newPrice}, Cost: ${newCost}`);
                results.success++;
                resolve();
              }
            );
            return true;
          };
          
          // Function to insert new product (only called if no existing product found)
          const insertProductRow = (skuToUse, retryCount = 0) => {
            if (retryCount > 3) {
              recordFailure(`Row ${index + 2}: Failed after multiple SKU conflict attempts`);
              resolve();
              return;
            }

            db.run(
              'INSERT INTO products (name, description, sku, category, price, cost, stock_quantity, min_stock_level, supplier_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [product.name, product.description, skuToUse, product.category, product.price, product.cost, product.stock_quantity, product.min_stock_level, product.supplier_id, product.image_url],
              function(err) {
                if (err) {
                  console.error(`Row ${index + 2} insert error:`, err.message);
                  
                  // Handle SKU uniqueness conflict
                  if (err.message.includes('UNIQUE constraint failed: products.sku') && skuToUse && skuToUse !== null) {
                    const randomItemCode = Math.floor(Math.random() * 900) + 100;
                    const uniqueSku = generateSKUSimple(
                      product.category || derivedCategory || 'ITEM',
                      product.cost,
                      randomItemCode,
                      product.price
                    );
                    console.log(`Row ${index + 2}: SKU conflict, retrying with: ${uniqueSku}`);
                    insertProductRow(uniqueSku, retryCount + 1);
                  } else {
                    recordFailure(`Row ${index + 2}: ${err.message}`);
                    resolve();
                  }
                } else {
                  console.log(`Row ${index + 2}: Successfully inserted new product "${product.name}" (ID: ${this.lastID})`);
                  results.success++;
                  resolve();
                }
              }
            );
          };

          // Try to find by barcode first, then by name
          const tryFindByName = () => {
            db.get("SELECT id, stock_quantity FROM products WHERE LOWER(TRIM(name)) = ? LIMIT 1", [normName], (e2, existingByName) => {
              if (e2) {
                console.error(`Row ${index + 2} find-by-name error:`, e2.message);
                // If search fails, try to insert anyway
                return insertProductRow(product.sku);
              }
              if (mergeQuantity(existingByName)) {
                return; // Quantity merged successfully
              }
              // No existing product found - insert new
              insertProductRow(product.sku);
            });
          };

          if (hasBarcode) {
            // Try barcode first
            db.get(
              "SELECT id, stock_quantity FROM products WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(description), ' ', ''), '-', ''), '/', '')) = ? LIMIT 1",
              [normBarcode],
              (e1, existingByBarcode) => {
                if (e1) {
                  console.error(`Row ${index + 2} find-by-barcode error:`, e1.message);
                  // If barcode search fails, try by name
                  return tryFindByName();
                }
                if (mergeQuantity(existingByBarcode)) {
                  return; // Quantity merged successfully
                }
                // Not found by barcode - try by name
                tryFindByName();
              }
            );
          } else {
            // No barcode - try by name only
            tryFindByName();
          }
        });
      });

      // Wait for all inserts to complete
      await Promise.all(insertPromises);

      console.log(`Import completed: ${results.success} success, ${results.errors.length} errors`);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        message: `Import completed: ${results.success} product${results.success !== 1 ? 's' : ''} added${results.errors.length > 0 ? `, ${results.errors.length} error${results.errors.length !== 1 ? 's' : ''}` : ''}`,
        success: results.success,
        errors: results.errors,
        failedRows: results.failedRows,
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error importing Excel:', error);
      res.status(500).json({ error: error.message || 'Failed to import products from Excel' });
    }
  });

  // Get low stock items (must come before /:id route)
  router.get('/alerts/low-stock', (req, res) => {
    db.all('SELECT * FROM products WHERE stock_quantity <= min_stock_level', (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    });
  });

  // Get single product (must be after /all route due to /:id parameter)
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const costValue = Number(row.cost !== undefined && row.cost !== null ? row.cost : row.cost_price || 0);
      const finalPrice = calculateFinalPrice(costValue);
      const sellingPrice = Number(row.price !== undefined && row.price !== null ? row.price : row.selling_price || 0);

      res.json({
        ...row,
        cost: costValue,
        final_price: finalPrice,
        selling_price: sellingPrice,
      });
    });
  });

  // Create product
  router.post('/', (req, res) => {
    const { name, description, sku, category, price, cost, stock_quantity, min_stock_level, supplier_id, image_url } = req.body;
    
    // Allow creating products even with missing data or negative prices
    // Use defaults if values are missing
    const productName = name || `Product ${Date.now()}`;
    const productPrice = price !== undefined && price !== null ? parseFloat(price) || 0 : 0;
    const productCost = cost !== undefined && cost !== null ? parseFloat(cost) || 0 : 0;
    const computedFinalPrice = calculateFinalPrice(productCost);
    const productStock = stock_quantity !== undefined && stock_quantity !== null ? parseInt(stock_quantity) || 0 : 0;
    const productMinStock = min_stock_level !== undefined && min_stock_level !== null ? parseInt(min_stock_level) || 10 : 10;
    
    // Auto-categorize if category not provided
    const autoCategory = category && category.trim() !== ''
      ? category
      : categorizeProduct(productName, description || '');

    // Use provided SKU if given, otherwise generate one
    let productSku = sku && sku.trim() !== '' ? sku.trim() : null;
    
    // Function to generate SKU and insert product
    const generateAndInsertProduct = (retryCount = 0) => {
      // If SKU already provided, use it
      if (productSku) {
        return insertProduct(productSku, retryCount);
      }

      // Get next sequential number from database
      getNextSequentialNumberSync(db)
        .then((sequentialNumber) => {
          // Generate SKU with sequential number
          const generatedSku = generateSKUSimple(autoCategory || category || 'ITEM', productCost, parseInt(sequentialNumber), computedFinalPrice);
          insertProduct(generatedSku, retryCount);
        })
        .catch((err) => {
          console.error('Error getting sequential number:', err);
          // Fallback to timestamp-based if database query fails
          const generatedSku = generateSKUSimple(autoCategory || category || 'ITEM', productCost, null, computedFinalPrice);
          insertProduct(generatedSku, retryCount);
        });
    };
    
    // Function to insert with SKU handling
    const insertProduct = (skuToUse, retryCount = 0) => {
      // Prevent infinite recursion
      if (retryCount > 3) {
        return res.status(500).json({ error: 'Failed to create product after multiple attempts' });
      }
    
    db.run(
        'INSERT INTO products (name, description, sku, category, price, cost, stock_quantity, min_stock_level, supplier_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          productName,
          description || '',
          skuToUse, // NULL for empty SKUs, or the actual SKU value
          autoCategory || '',
          productPrice,
          productCost,
          productStock,
          productMinStock,
          supplier_id || null,
          image_url || null
        ],
      function(err) {
        if (err) {
            console.error('Error inserting product:', err.message);
              // If SKU constraint error and we have a SKU value
              if (err.message.includes('UNIQUE constraint failed: products.sku') && skuToUse && skuToUse !== null) {
                // Before retrying with a new SKU, attempt to MERGE quantity based on barcode/name
                const hasBarcodeLocal = (description && description.trim() !== '');
                const normBarcodeLocal = normalizeBarcode(description || '');
                const normNameLocal = normalizeName(productName || '');

                const tryMergeThenReturn = () => {
                  // Try merge by name
                  db.get(
                    "SELECT id, stock_quantity FROM products WHERE LOWER(TRIM(name)) = ? LIMIT 1",
                    [normNameLocal],
                    (e2, existingByName) => {
                      if (e2) {
                        console.error('Find-by-name error during SKU conflict handling:', e2.message);
                      }
                      if (existingByName) {
                        const quantityToAdd = productStock || 0;
                        return db.run(
                          'UPDATE products SET stock_quantity = stock_quantity + ?, price = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                          [quantityToAdd, productPrice, productCost, existingByName.id],
                          function(updateErr) {
                            if (updateErr) {
                              console.error('Error merging after SKU conflict:', updateErr.message);
                              // Fall back to unique SKU retry
                              const randomItemCode = Math.floor(Math.random() * 900) + 100;
                              const uniqueSku = generateSKUSimple(autoCategory || category || 'ITEM', productCost, randomItemCode, computedFinalPrice);
                              console.log(`Retrying insert with unique SKU: ${uniqueSku}`);
                              return insertProduct(uniqueSku, retryCount + 1);
                            }
                            console.log(`Merged quantity (+${quantityToAdd}) into existing product ID ${existingByName.id} after SKU conflict.`);
                            return res.json({
                              id: existingByName.id,
                              merged: true,
                              message: 'Product quantity updated (merged with existing)',
                              cost: productCost,
                              final_price: computedFinalPrice,
                              selling_price: productPrice,
                            });
                          }
                        );
                      }
                      // No merge target found -> retry with a unique SKU
                      const randomItemCode = Math.floor(Math.random() * 900) + 100;
                      const uniqueSku = generateSKUSimple(autoCategory || category || 'ITEM', productCost, randomItemCode, computedFinalPrice);
                      console.log(`Retrying insert with unique SKU: ${uniqueSku}`);
                      insertProduct(uniqueSku, retryCount + 1);
                    }
                  );
                };

                if (hasBarcodeLocal) {
                  // Try merge by barcode first
                  return db.get(
                    "SELECT id, stock_quantity FROM products WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(description), ' ', ''), '-', ''), '/', '')) = ? LIMIT 1",
                    [normBarcodeLocal],
                    (e1, existingByBarcode) => {
                      if (e1) {
                        console.error('Find-by-barcode error during SKU conflict handling:', e1.message);
                        return tryMergeThenReturn();
                      }
                      if (existingByBarcode) {
                        const quantityToAdd = productStock || 0;
                        return db.run(
                          'UPDATE products SET stock_quantity = stock_quantity + ?, price = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                          [quantityToAdd, productPrice, productCost, existingByBarcode.id],
                          function(updateErr) {
                            if (updateErr) {
                              console.error('Error merging after SKU conflict:', updateErr.message);
                              // Fall back to unique SKU retry
                              const randomItemCode = Math.floor(Math.random() * 900) + 100;
                              const uniqueSku = generateSKUSimple(autoCategory || category || 'ITEM', productCost, randomItemCode, computedFinalPrice);
                              console.log(`Retrying insert with unique SKU: ${uniqueSku}`);
                              return insertProduct(uniqueSku, retryCount + 1);
                            }
                            console.log(`Merged quantity (+${quantityToAdd}) into existing product ID ${existingByBarcode.id} after SKU conflict.`);
                            return res.json({
                              id: existingByBarcode.id,
                              merged: true,
                              message: 'Product quantity updated (merged with existing)',
                              cost: productCost,
                              final_price: computedFinalPrice,
                              selling_price: productPrice,
                            });
                          }
                        );
                      }
                      // Not found by barcode -> try name
                      return tryMergeThenReturn();
                    }
                  );
                }

                // No barcode provided -> try merging by name directly
                return tryMergeThenReturn();
            } else {
              // For other errors or if SKU is NULL, return error
          return res.status(500).json({ error: err.message });
        }
          } else {
            console.log(`Product created successfully with ID: ${this.lastID}`);
        res.json({
          id: this.lastID,
          message: 'Product created successfully',
          sku: skuToUse,
          cost: productCost,
          final_price: computedFinalPrice,
          selling_price: productPrice,
        });
      }
        }
      );
    };
    
    // FIRST: Check if product already exists (by barcode, then by name) and ADD to quantity
    // SECOND: Only insert if product doesn't exist
    
    const hasBarcode = (description && description.trim() !== '');
    const normBarcode = normalizeBarcode(description || '');
    const normName = normalizeName(productName || '');
    
    // Function to add quantity to existing product
    const addQuantityToExisting = (existing) => {
      if (!existing) return false;
      
      const quantityToAdd = productStock || 0;
      db.run(
        'UPDATE products SET stock_quantity = stock_quantity + ?, price = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [quantityToAdd, productPrice, productCost, existing.id],
        function(updateErr) {
          if (updateErr) {
            console.error('Error adding quantity to existing product:', updateErr.message);
            return res.status(500).json({ error: updateErr.message });
          }
          const newTotal = (existing.stock_quantity || 0) + quantityToAdd;
          console.log(`Added ${quantityToAdd} to existing product "${productName}" (ID: ${existing.id}). New total: ${newTotal}`);
          return res.json({ 
            id: existing.id, 
            merged: true, 
            message: `Product quantity updated. Added ${quantityToAdd}, new total: ${newTotal}`,
            cost: productCost,
            final_price: computedFinalPrice,
            selling_price: productPrice,
          });
        }
      );
      return true;
    };

    // Try to find by barcode first, then by name
    const tryFindByName = () => {
      db.get("SELECT id, stock_quantity FROM products WHERE LOWER(TRIM(name)) = ? LIMIT 1", [normName], (e2, existingByName) => {
        if (e2) {
          console.error('Find-by-name error:', e2.message);
          // If search fails, try to insert anyway
          return generateAndInsertProduct();
        }
        if (addQuantityToExisting(existingByName)) {
          return; // Quantity added successfully
        }
        // No existing product found - insert new
        generateAndInsertProduct();
      });
    };

    if (hasBarcode) {
      // Try barcode first
      db.get(
        "SELECT id, stock_quantity FROM products WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(description), ' ', ''), '-', ''), '/', '')) = ? LIMIT 1",
        [normBarcode],
        (e1, existingByBarcode) => {
          if (e1) {
            console.error('Find-by-barcode error:', e1.message);
            // If barcode search fails, try by name
            return tryFindByName();
          }
          if (addQuantityToExisting(existingByBarcode)) {
            return; // Quantity added successfully
          }
          // Not found by barcode - try by name
          tryFindByName();
        }
      );
    } else {
      // No barcode - try by name only
      tryFindByName();
    }
  });

  // Update product
  router.put('/:id', (req, res) => {
    const { name, description, sku, category, price, cost, stock_quantity, min_stock_level, supplier_id, image_url } = req.body;
    const productId = req.params.id;
    
    // Handle SKU - use NULL for empty SKUs to avoid unique constraint issues
    let productSku = sku && sku.trim() !== '' ? sku.trim() : null;
    
    // First, get the current product to check if SKU is being changed
    db.get('SELECT sku, category, cost, price FROM products WHERE id = ?', [productId], (err, currentProduct) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!currentProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const currentCategory = currentProduct.category || '';
      const currentCost = currentProduct.cost !== undefined && currentProduct.cost !== null ? parseFloat(currentProduct.cost) || 0 : 0;
      const currentPriceValue = currentProduct.price !== undefined && currentProduct.price !== null ? parseFloat(currentProduct.price) || 0 : 0;
      const parsedCost = cost !== undefined && cost !== null ? parseFloat(cost) || 0 : currentCost;
      const resolvedCategory = category && category.trim() !== '' ? category : currentCategory || 'ITEM';
      const parsedPrice = price !== undefined && price !== null ? parseFloat(price) || 0 : currentPriceValue;
      const parsedStock = stock_quantity !== undefined && stock_quantity !== null ? parseInt(stock_quantity) || 0 : stock_quantity;
      const parsedMinStock = min_stock_level !== undefined && min_stock_level !== null ? parseInt(min_stock_level) || 0 : min_stock_level;
      const computedFinalPrice = calculateFinalPrice(parsedCost);

      if (!productSku) {
        productSku = generateSKUSimple(resolvedCategory || 'ITEM', parsedCost, null, computedFinalPrice);
      }

      // Function to update product with SKU conflict handling
      const updateProduct = (skuToUse, retryCount = 0) => {
        // Prevent infinite recursion
        if (retryCount > 3) {
          return res.status(500).json({ error: 'Failed to update product after multiple SKU conflict attempts' });
        }
        
        // If SKU is not NULL and not the same as current, check if it conflicts with another product
        if (skuToUse && skuToUse !== null && skuToUse !== currentProduct.sku) {
          db.get('SELECT id FROM products WHERE sku = ? AND id != ?', [skuToUse, productId], (err, conflictingProduct) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
            
            // If SKU conflicts with another product, generate a unique one
            if (conflictingProduct) {
              const randomItemCode = Math.floor(Math.random() * 900) + 100;
              const uniqueSku = generateSKUSimple(resolvedCategory || 'ITEM', parsedCost, randomItemCode, computedFinalPrice);
              console.log(`SKU conflict detected for product ${productId}, using unique SKU: ${uniqueSku}`);
              updateProduct(uniqueSku, retryCount + 1);
              return;
            }
            
            // SKU is available, proceed with update
            performUpdate(skuToUse, retryCount);
          });
        } else {
          // SKU is NULL or same as current, proceed with update
          performUpdate(skuToUse, retryCount);
        }
      };
      
      // Function to perform the actual UPDATE
      const performUpdate = (skuToUse, retryCount) => {
        db.run(
          'UPDATE products SET name = ?, description = ?, sku = ?, category = ?, price = ?, cost = ?, stock_quantity = ?, min_stock_level = ?, supplier_id = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name, description, skuToUse, category, parsedPrice, parsedCost, parsedStock, parsedMinStock, supplier_id, image_url, productId],
          function(updateErr) {
            if (updateErr) {
              console.error('Error updating product:', updateErr.message);
              // If it's a SKU constraint error we didn't catch, handle it
              if (updateErr.message.includes('UNIQUE constraint failed: products.sku') && skuToUse && skuToUse !== null) {
                const randomItemCode = Math.floor(Math.random() * 900) + 100;
                const uniqueSku = generateSKUSimple(resolvedCategory || 'ITEM', parsedCost, randomItemCode, computedFinalPrice);
                console.log(`SKU constraint error during update, retrying with: ${uniqueSku}`);
                updateProduct(uniqueSku, retryCount + 1);
              } else {
                return res.status(500).json({ error: updateErr.message });
              }
            } else {
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
              console.log(`Product ${productId} updated successfully`);
              res.json({
                message: 'Product updated successfully',
                sku: skuToUse,
                cost: parsedCost,
                final_price: computedFinalPrice,
                selling_price: parsedPrice,
              });
      }
      }
    );
      };
      
      // Start update process
      updateProduct(productSku);
    });
  });

  // Delete single product (MUST be after /all route)
  router.delete('/:id', (req, res) => {
    const productId = req.params.id;
    
    // Prevent accidental deletion of "all" as an ID
    if (productId === 'all') {
      console.error('❌ WARNING: Attempted to delete "all" as ID. This should have matched /all route.');
      return res.status(400).json({ 
        error: 'Invalid product ID. Use /api/inventory/all to delete all products.' 
      });
    }
    
    db.run('DELETE FROM products WHERE id = ?', [productId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    });
  });


  return router;
};
