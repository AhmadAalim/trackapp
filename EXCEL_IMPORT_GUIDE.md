# Excel Import Guide for Products

## How to Import Products from Excel

### Step 1: Prepare Your Excel File

Create an Excel file (.xlsx or .xls) with the following columns:

| Name | Description | SKU | Category | Price | Cost | Stock | Min Stock | Supplier ID | Image |
|------|-------------|-----|----------|-------|------|-------|-----------|-------------|-------|
| iPhone 15 | Latest iPhone model | IPHONE15 | Electronics | 999.99 | 800 | 50 | 10 | | |
| Laptop Pro | High-performance laptop | LAPTOP001 | Electronics | 1299.99 | 1000 | 30 | 5 | | |

### Required Columns:
- **Name** (Required) - Product name
- **Price** (Required) - Product price (number)

### Optional Columns:
- **Description** - Product description
- **SKU** - Stock Keeping Unit (unique identifier)
- **Category** - Product category
- **Cost** - Product cost (number)
- **Stock** or **StockQuantity** or **Stock Quantity** - Current stock quantity (number)
- **Min Stock** or **MinStockLevel** or **Min Stock Level** - Minimum stock level (default: 10)
- **Supplier ID** or **SupplierID** - Supplier identifier (number)
- **Image** or **image** - Image URL (text)

### Step 2: Import the File

1. Go to the **Inventory** page
2. Click the **Excel icon** (📊) next to the search bar
3. Select your Excel file
4. Wait for the import to complete
5. You'll see a message showing how many products were imported

### Column Name Variations

The system recognizes these column name variations:

- **Stock**: `Stock`, `StockQuantity`, `Stock Quantity`
- **Min Stock**: `Min Stock`, `MinStockLevel`, `Min Stock Level`
- **Supplier ID**: `SupplierID`, `Supplier ID`
- Column names are case-insensitive (Name, name, NAME all work)

### Tips

1. Make sure the first row contains column headers
2. The **Name** column is required - products without names will be skipped
3. Empty cells will use default values (Stock: 0, Min Stock: 10)
4. Make sure prices and costs are numbers (not text)
5. SKU values must be unique - duplicates will cause errors

### Example Excel File Structure

```
Name          | Description              | SKU      | Category    | Price  | Cost | Stock | Min Stock
--------------|--------------------------|----------|-------------|--------|------|-------|----------
Product A     | Great product            | PROD001  | Electronics | 99.99  | 50   | 100   | 10
Product B     | Another great product    | PROD002  | Clothing    | 49.99  | 25   | 50    | 5
```

### Troubleshooting

- **Import failed**: Check that your file is a valid Excel file (.xlsx or .xls)
- **Products not imported**: Make sure the Name column is filled and column headers match
- **Errors shown**: Check the error messages - they'll tell you which row has issues

