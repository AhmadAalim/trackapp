/**
 * SKU Generator
 * Format: ITEM[4-digit-sequential][LETTER][COST][PRICE]
 * Examples:
 *   Cost 8, Price 15:    ITEM634X0815
 *   Cost 17, Price 26:   ITEM1630Y1726
 *   Cost 720, Price 1520: ITEM2950R7201520
 *   Cost 7280, Price 13420: ITEM9290S728013420
 */

/**
 * Get letter based on cost price digit count
 * 1 digit: X, 2 digits: Y, 3 digits: R, 4 digits: S, 5+ digits: T, U, V...
 */
const getCostDigitLetter = (cost) => {
  const costStr = Math.round(Number(cost) || 0).toString();
  const digitCount = costStr.length;
  
  // Map digit count to letter: 1->X, 2->Y, 3->R, 4->S, 5->T, etc.
  const letterMap = {
    1: 'X',
    2: 'Y',
    3: 'R',
    4: 'S',
    5: 'T',
    6: 'U',
    7: 'V',
    8: 'W',
    9: 'Z',
  };
  
  return letterMap[digitCount] || 'A';
};

/**
 * Generate sequential 4-digit number for SKU
 * Gets the highest existing sequential number and increments
 */
const generateSequentialNumber = (db, callback) => {
  // Get the highest sequential number from existing SKUs
  db.get(
    `SELECT sku FROM products WHERE sku LIKE 'ITEM%' ORDER BY sku DESC LIMIT 1`,
    [],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }

      let nextNumber = 1;

      if (row && row.sku) {
        // Extract sequential number from SKU (e.g., "ITEM634X0815" -> "634" or "ITEM1630Y1726" -> "1630")
        // Handle both 3 and 4 digit sequential numbers
        const match = row.sku.match(/^ITEM(\d{3,4})/);
        if (match && match[1]) {
          const existingNumber = parseInt(match[1], 10);
          if (!isNaN(existingNumber)) {
            nextNumber = existingNumber + 1;
          }
        }
      }

      // Ensure we don't exceed 9999
      if (nextNumber > 9999) {
        nextNumber = 1; // Reset or handle overflow
      }

      // Don't pad - use number as-is (can be 1-4 digits)
      const sequentialCode = nextNumber.toString();
      callback(null, sequentialCode);
    }
  );
};

/**
 * Format cost price for SKU
 * Single digit: pad to 2 digits (08)
 * Multi-digit: no padding (17, 720, 7280)
 */
const formatCostForSKU = (cost) => {
  const numericCost = Math.round(Number(cost) || 0);
  const costStr = numericCost.toString();
  
  // If single digit, pad to 2 digits
  if (costStr.length === 1) {
    return costStr.padStart(2, '0');
  }
  
  // Otherwise, return as-is
  return costStr;
};

/**
 * Format selling price for SKU (no padding)
 */
const formatPriceForSKU = (price) => {
  const numericPrice = Math.round(Number(price) || 0);
  return numericPrice.toString();
};

/**
 * Calculate final price (for backward compatibility)
 */
const calculateFinalPrice = (costPrice) => {
  const numericCost = Number(costPrice) || 0;
  const finalPrice = numericCost * 1.18 * 1.3;
  return Number(finalPrice.toFixed(2));
};

/**
 * Generate SKU with callback (for database operations)
 * Format: ITEM[4-digit][LETTER][COST][PRICE]
 */
const generateSKU = (db, category, costPrice, finalPriceOverride, callback) => {
  const numericCost = Number(costPrice) || 0;
  const finalPrice = finalPriceOverride !== undefined && finalPriceOverride !== null
    ? Number(finalPriceOverride) || 0
    : calculateFinalPrice(numericCost);

  generateSequentialNumber(db, (err, sequentialCode) => {
    if (err) {
      return callback(err, null);
    }

    const letter = getCostDigitLetter(numericCost);
    const costFormatted = formatCostForSKU(numericCost);
    const priceFormatted = formatPriceForSKU(finalPrice);
    
    const sku = `ITEM${sequentialCode}${letter}${costFormatted}${priceFormatted}`;
    callback(null, sku);
  });
};

/**
 * Generate SKU synchronously (for cases where we can't use callback)
 * Format: ITEM[4-digit][LETTER][COST][PRICE]
 */
const generateSKUSimple = (category, costPrice, itemNumber = null, finalPriceOverride = null) => {
  const numericCost = Number(costPrice) || 0;
  const finalPrice = finalPriceOverride !== undefined && finalPriceOverride !== null
    ? Number(finalPriceOverride) || 0
    : calculateFinalPrice(numericCost);

  // Use provided itemNumber or generate from timestamp
  let sequentialCode;
  if (itemNumber !== null) {
    // Don't pad - use number as-is (can be 1-4 digits)
    sequentialCode = itemNumber.toString();
  } else {
    // Use last 4 digits of timestamp for uniqueness
    sequentialCode = Date.now().toString().slice(-4);
  }

  const letter = getCostDigitLetter(numericCost);
  const costFormatted = formatCostForSKU(numericCost);
  const priceFormatted = formatPriceForSKU(finalPrice);
  
  return `ITEM${sequentialCode}${letter}${costFormatted}${priceFormatted}`;
};

/**
 * Legacy function for backward compatibility
 */
const getCategoryPrefix = (category) => {
  return 'ITEM'; // Always use ITEM prefix
};

/**
 * Legacy function for backward compatibility
 */
const formatPriceSegment = (value) => {
  return formatCostForSKU(value);
};

/**
 * Get next sequential number synchronously (for use in routes)
 * This queries the database to get the highest existing sequential number
 */
const getNextSequentialNumberSync = (db) => {
  return new Promise((resolve, reject) => {
    generateSequentialNumber(db, (err, sequentialCode) => {
      if (err) {
        reject(err);
      } else {
        resolve(sequentialCode);
      }
    });
  });
};

module.exports = {
  generateSKU,
  generateSKUSimple,
  getCategoryPrefix,
  generateItemCode: generateSequentialNumber, // Alias for backward compatibility
  calculateFinalPrice,
  formatPriceSegment,
  getNextSequentialNumberSync,
  getCostDigitLetter,
  formatCostForSKU,
  formatPriceForSKU,
};

