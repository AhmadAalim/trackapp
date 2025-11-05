module.exports = (db, upload, uploadImage, path) => {
  const express = require('express');
  const XLSX = require('xlsx');
  const fs = require('fs');
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
      res.json(rows);
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

      const results = { success: 0, errors: [] };

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
            'מחיר עלות', 'עלות' // Hebrew variations
          ]);

          // Final Price → price
          const finalPrice = getValue([
            'Final Price', 'final price', 'FinalPrice', 'Price', 'price', 'Selling Price', 'selling price',
            'מחיר סופי', 'מחיר', 'מחיר לאחר הנחה' // Hebrew variations
          ]);

          // Generate SKU: last 4 digits are cost price padded with zeros
          const cost = parseFloat(costPrice) || 0;
          const costPadded = Math.floor(cost).toString().padStart(4, '0'); // Last 4 digits: 0025 for 25
          
          // Create SKU prefix from product name (first 3-4 uppercase letters) + cost price
          const namePrefix = productName
            .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
            .substring(0, 4)
            .toUpperCase()
            .padEnd(4, 'X'); // Fill with X if name is too short
          
          const generatedSku = `${namePrefix}${costPadded}`;

          const derivedCategory = categorizeProduct(productName, productBarcode || '');

          const product = {
            name: productName, // Product Name goes to name field
            description: productBarcode || '', // Product Barcode goes to description field
            sku: generatedSku, // Generated SKU with cost price as last 4 digits
            category: derivedCategory,
            price: parseFloat(finalPrice) || 0, // Final Price → price
            cost: cost, // Cost Price → cost
            stock_quantity: parseInt(quantity) || 0, // Quantity → stock_quantity
            min_stock_level: 10, // Default minimum stock
            supplier_id: null,
            image_url: null,
          };

          console.log(`Row ${index + 2}:`, {
            name: product.name,
            price: product.price,
            stock: product.stock_quantity,
            rawRow: row
          });

          if (!product.name || product.name.trim() === '') {
            results.errors.push(`Row ${index + 2}: Missing product name`);
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
            db.run(
              'UPDATE products SET stock_quantity = stock_quantity + ?, price = ?, cost = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [quantityToAdd, product.price, product.cost, existing.id],
              function(updateErr) {
                if (updateErr) {
                  console.error(`Row ${index + 2} update error:`, updateErr.message);
                  results.errors.push(`Row ${index + 2}: ${updateErr.message}`);
                  resolve();
                  return;
                }
                console.log(`Row ${index + 2}: Added ${quantityToAdd} to existing product "${product.name}" (ID: ${existing.id}). New total: ${(existing.stock_quantity || 0) + quantityToAdd}`);
                results.success++;
                resolve();
              }
            );
            return true;
          };
          
          // Function to insert new product (only called if no existing product found)
          const insertProductRow = (skuToUse, retryCount = 0) => {
            if (retryCount > 3) {
              results.errors.push(`Row ${index + 2}: Failed after multiple SKU conflict attempts`);
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
                    const uniqueSku = `${skuToUse}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                    console.log(`Row ${index + 2}: SKU conflict, retrying with: ${uniqueSku}`);
                    insertProductRow(uniqueSku, retryCount + 1);
                  } else {
                    results.errors.push(`Row ${index + 2}: ${err.message}`);
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
        errors: results.errors
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

  // Delete all products (must come before /:id route to avoid matching "all" as an ID)
  router.delete('/all', (req, res) => {
    console.log('DELETE /api/inventory/all endpoint called');
    console.log('Request URL:', req.url);
    console.log('Request path:', req.path);
    
    // Verify this is actually the /all route, not /:id
    if (req.params && req.params.id) {
      console.error('ERROR: Route matched as /:id instead of /all!');
      return res.status(500).json({ error: 'Route conflict detected' });
    }
    
    db.run('DELETE FROM products', function(err) {
      if (err) {
        console.error('Database error deleting all products:', err);
        return res.status(500).json({ error: err.message });
      }
      
      const deletedCount = this.changes || 0;
      console.log(`Successfully deleted all products. Total deleted: ${deletedCount}`);
      
      res.status(200).json({ 
        success: true,
        message: `All products deleted successfully. ${deletedCount} product${deletedCount !== 1 ? 's' : ''} removed.`,
        count: deletedCount
      });
    });
  });

  // Get single product (must be last due to /:id parameter)
  router.get('/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(row);
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
    const productStock = stock_quantity !== undefined && stock_quantity !== null ? parseInt(stock_quantity) || 0 : 0;
    const productMinStock = min_stock_level !== undefined && min_stock_level !== null ? parseInt(min_stock_level) || 10 : 10;
    
    // Auto-categorize if category not provided
    const autoCategory = category && category.trim() !== ''
      ? category
      : categorizeProduct(productName, description || '');

    // Generate SKU: last 4 digits are cost price padded with zeros
    const costPadded = Math.floor(productCost).toString().padStart(4, '0'); // Last 4 digits: 0025 for 25
    
    // Create SKU prefix from product name (first 4 uppercase letters/numbers)
    const namePrefix = productName
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, 'X'); // Fill with X if name is too short
    
    const generatedSku = `${namePrefix}${costPadded}`;
    
    // Use provided SKU if given, otherwise use generated SKU
    let productSku = sku && sku.trim() !== '' ? sku.trim() : generatedSku;
    
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
                              const costPart = skuToUse.substring(skuToUse.length - 4);
                              const basePrefix = skuToUse.substring(0, skuToUse.length - 4);
                              const uniqueSku = `${basePrefix}_${Date.now()}`.slice(0, basePrefix.length) + costPart;
                              console.log(`Retrying insert with unique SKU: ${uniqueSku}`);
                              return insertProduct(uniqueSku, retryCount + 1);
                            }
                            console.log(`Merged quantity (+${quantityToAdd}) into existing product ID ${existingByName.id} after SKU conflict.`);
                            return res.json({ id: existingByName.id, merged: true, message: 'Product quantity updated (merged with existing)' });
                          }
                        );
                      }
                      // No merge target found -> retry with a unique SKU
                      const costPart = skuToUse.substring(skuToUse.length - 4);
                      const basePrefix = skuToUse.substring(0, skuToUse.length - 4);
                      const uniqueSku = `${basePrefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`.replace(/[^A-Z0-9]/g, '').slice(0, Math.max(4, basePrefix.length)) + costPart;
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
                              const costPart = skuToUse.substring(skuToUse.length - 4);
                              const basePrefix = skuToUse.substring(0, skuToUse.length - 4);
                              const uniqueSku = `${basePrefix}_${Date.now()}`.slice(0, basePrefix.length) + costPart;
                              console.log(`Retrying insert with unique SKU: ${uniqueSku}`);
                              return insertProduct(uniqueSku, retryCount + 1);
                            }
                            console.log(`Merged quantity (+${quantityToAdd}) into existing product ID ${existingByBarcode.id} after SKU conflict.`);
                            return res.json({ id: existingByBarcode.id, merged: true, message: 'Product quantity updated (merged with existing)' });
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
            res.json({ id: this.lastID, message: 'Product created successfully' });
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
            message: `Product quantity updated. Added ${quantityToAdd}, new total: ${newTotal}` 
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
          return insertProduct(productSku);
        }
        if (addQuantityToExisting(existingByName)) {
          return; // Quantity added successfully
        }
        // No existing product found - insert new
        insertProduct(productSku);
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
    db.get('SELECT sku FROM products WHERE id = ?', [productId], (err, currentProduct) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!currentProduct) {
        return res.status(404).json({ error: 'Product not found' });
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
              const uniqueSku = `${skuToUse}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
          [name, description, skuToUse, category, price, cost, stock_quantity, min_stock_level, supplier_id, image_url, productId],
          function(updateErr) {
            if (updateErr) {
              console.error('Error updating product:', updateErr.message);
              // If it's a SKU constraint error we didn't catch, handle it
              if (updateErr.message.includes('UNIQUE constraint failed: products.sku') && skuToUse && skuToUse !== null) {
                const uniqueSku = `${skuToUse}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
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
              res.json({ message: 'Product updated successfully', sku: skuToUse });
            }
          }
        );
      };
      
      // Start update process
      updateProduct(productSku);
    });
  });

  // Delete product
  router.delete('/:id', (req, res) => {
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
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
