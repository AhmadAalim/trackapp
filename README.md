# TrackApp - Store Management System

A comprehensive store management application for tracking inventory, sales, employees, suppliers, and financial operations.

## Features

- 📦 **Inventory Management** - Track products, stock levels, and low stock alerts
- 💰 **Sales Tracking** - Record sales transactions and generate receipts
- 👥 **Employee Management** - Manage staff information and roles
- 🏭 **Supplier Management** - Track suppliers and purchase orders
- 📊 **Financial Dashboard** - Monitor revenue, expenses, and profit
- 📈 **Reports & Analytics** - Generate detailed reports and insights

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI) for modern UI components
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- SQLite database (easily switchable to PostgreSQL/MySQL)
- RESTful API architecture

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Copy the example environment file:
     ```bash
     cp server/.env.example server/.env
   ```
   - Edit `server/.env` and configure if needed (defaults work for development)

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend app on `http://localhost:3000`

## Project Structure

```
trackapp/
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── App.js       # Main app component
├── server/          # Node.js/Express backend
│   ├── models/      # Database models
│   ├── routes/      # API routes
│   ├── controllers/ # Business logic
│   └── index.js     # Server entry point
└── README.md
```

## API Endpoints

### Inventory
- `GET /api/inventory` - Get all products
- `GET /api/inventory/:id` - Get single product
- `POST /api/inventory` - Add new product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product
- `GET /api/inventory/alerts/low-stock` - Get low stock items

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create new sale

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Add employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get single supplier
- `POST /api/suppliers` - Add supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/sales` - Get sales reports (optional: ?startDate=&endDate=)

## Usage

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

3. **Manage your store:**
   - Add products to inventory
   - Record sales transactions
   - Manage employees and suppliers
   - View dashboard analytics

## Database

The application uses SQLite by default. The database file (`store.db`) will be automatically created in the `server` directory when you first run the application.

To switch to PostgreSQL or MySQL:
1. Install the appropriate database driver
2. Update the database connection in `server/index.js`
3. Modify the SQL queries to match your database syntax

## Development

### Running individual services:

- **Backend only:**
  ```bash
  npm run server
  ```

- **Frontend only:**
  ```bash
  npm run client
  ```

### Building for production:

```bash
npm run build
```

## License

MIT

## Author

Ahmad Aalim
