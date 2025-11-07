/**
 * SKU Generator
 * Format: [CATEGORY_PREFIX][ITEMCODE][COSTPRICE_LAST4]
 * Example: KITCH0010025 (Kitchen category, item 001, cost 25)
 */

/**
 * Get category prefix from category name
 */
const getCategoryPrefix = (category) => {
  if (!category) return 'ITEM';
  
  const categoryMap = {
    'naaman': 'NAAM',
    'vardinon': 'VARD',
    'kitchen': 'KITCH',
    'bathroom': 'BATH',
    'kitchenware': 'KITCH',
    'cookware': 'KITCH',
    'tableware': 'KITCH',
    'bath': 'BATH',
    'toilet': 'BATH',
    'shower': 'BATH',
  };

  const normalized = category.toLowerCase().trim();
  
  // Check exact matches first
  if (categoryMap[normalized]) {
    return categoryMap[normalized];
  }

  // Check partial matches
  for (const [key, prefix] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) {
      return prefix;
    }
  }

  // Default: use first 4 uppercase letters of category
  return category
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');
};

/**
 * Generate item code (sequential number, zero-padded to 3 digits)
 */
const generateItemCode = (db, category, callback) => {
  const prefix = getCategoryPrefix(category);
  
  // Get the highest item code for this category prefix
  db.get(
    `SELECT sku FROM products WHERE sku LIKE ? ORDER BY sku DESC LIMIT 1`,
    [`${prefix}%`],
    (err, row) => {
      if (err) {
        return callback(err, null);
      }

      let nextCode = 1;

      if (row && row.sku) {
        // Extract item code from existing SKU (positions 4-6)
        const existingCode = parseInt(row.sku.substring(4, 7));
        if (!isNaN(existingCode)) {
          nextCode = existingCode + 1;
        }
      }

      // Ensure we don't exceed 999
      if (nextCode > 999) {
        nextCode = 1; // Reset or handle overflow
      }

      const itemCode = nextCode.toString().padStart(3, '0');
      callback(null, itemCode);
    }
  );
};

/**
 * Generate full SKU
 * Format: [CATEGORY_PREFIX][ITEMCODE][COSTPRICE_LAST4]
 */
const calculateFinalPrice = (costPrice) => {
  const numericCost = Number(costPrice) || 0;
  const finalPrice = numericCost * 1.18 * 1.3;
  return Number(finalPrice.toFixed(2));
};

const formatPriceSegment = (value) => {
  const rounded = Math.round(Number(value) || 0);
  if (rounded >= 100) {
    return rounded.toString().padStart(3, '0');
  }
  return rounded.toString().padStart(2, '0');
};

const generateSKU = (db, category, costPrice, callback) => {
  const prefix = getCategoryPrefix(category);
  const numericCost = Number(costPrice) || 0;
  const finalPrice = calculateFinalPrice(numericCost);

  generateItemCode(db, category, (err, itemCode) => {
    if (err) {
      return callback(err, null);
    }

    const costSegment = formatPriceSegment(numericCost);
    const finalSegment = formatPriceSegment(finalPrice);
    const sku = `${prefix}${itemCode}${costSegment}${finalSegment}`;
    callback(null, sku);
  });
};

/**
 * Generate SKU synchronously (for cases where we can't use callback)
 * This version uses a simpler approach without DB lookup
 */
const generateSKUSimple = (category, costPrice, itemNumber = null, finalPriceOverride = null) => {
  const prefix = getCategoryPrefix(category);
  const numericCost = Number(costPrice) || 0;
  const finalPrice = finalPriceOverride !== undefined && finalPriceOverride !== null
    ? Number(finalPriceOverride) || 0
    : calculateFinalPrice(numericCost);

  const costSegment = formatPriceSegment(numericCost);
  const finalSegment = formatPriceSegment(finalPrice);

  const itemCode = itemNumber !== null
    ? itemNumber.toString().padStart(3, '0')
    : Date.now().toString().slice(-3);

  return `${prefix}${itemCode}${costSegment}${finalSegment}`.toUpperCase();
};

module.exports = {
  generateSKU,
  generateSKUSimple,
  getCategoryPrefix,
  generateItemCode,
  calculateFinalPrice,
  formatPriceSegment,
};

