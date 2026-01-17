import MasterComponent from '@/components/MasterComponent.vue'
import TransactionComponent from '@/components/TransactionComponent.vue'
import ReportComponent from '@/components/ReportComponent.vue'

// Global configurations
// App component types
const MenuType = {
  Master: MasterComponent,
  Transaction: TransactionComponent,
  Report: ReportComponent,
}

// from data source builder all field assumption backend ready
const DataSource = {
  Master: {
    Products: 'https://api.example.com/products',
    Users: 'https://api.example.com/users',
  },
  Transaction: {
    Sales: 'https://api.example.com/transactions/sales',
    Purchases: 'https://api.example.com/transactions/purchases',
  },
  Report: {
    SalesSummary: 'https://api.example.com/reports/sales-summary',
    InventoryStatus: 'https://api.example.com/reports/inventory-status',
  },
}

// Specific user interface configurations not saved in the database new user automaically get this configurations
// UI Builder

const AccessMenu = [
  {
    key: 'PRODUCT',
    name: 'Data product',
    link: '/product',
    type: MenuType.Master,
    data: DataSource.Master.Products,
    fields: [
      { key: 'id', label: 'Product ID' },
      { key: 'name', label: 'Product Name' },
      { key: 'price', label: 'Price' },
      { key: 'stock', label: 'Stock' },
    ],
  },
  {
    key: 'USER',
    name: 'Data user',
    link: '/user',
    type: MenuType.Master,
    data: DataSource.Master.Users,
    fields: [
      { key: 'id', label: 'User ID' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
    ],
  },
  {
    key: 'SALES',
    name: 'Sales transaction',
    link: '/sales',
    type: MenuType.Transaction,
    data: DataSource.Transaction.Sales,
    fields: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'product_id', label: 'Product ID' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'total_price', label: 'Total Price' },
    ],
  },
  {
    key: 'PURCHASE',
    name: 'Purchase transaction',
    link: '/purchase',
    type: MenuType.Transaction,
    data: DataSource.Transaction.Purchases,
    fields: [
      { key: 'id', label: 'Transaction ID' },
      { key: 'product_id', label: 'Product ID' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'total_price', label: 'Total Price' },
    ],
  },
  {
    key: 'SALES_SUMMARY',
    name: 'Sales summary report',
    link: '/report/sales-summary',
    type: MenuType.Report,
    data: DataSource.Report.SalesSummary,
    fields: [
      { key: 'date', label: 'Date' },
      { key: 'total_sales', label: 'Total Sales' },
      { key: 'total_transactions', label: 'Total Transactions' },
    ],
  },
  {
    key: 'INVENTORY_STATUS',
    name: 'Inventory status report',
    link: '/report/inventory-status',
    type: MenuType.Report,
    data: DataSource.Report.InventoryStatus,
    fields: [
      { key: 'product_id', label: 'Product ID' },
      { key: 'product_name', label: 'Product Name' },
      { key: 'stock_level', label: 'Stock Level' },
    ],
  },
]
//selected fields based on ui builder that will be displayed in the table

// Exporting configurations
export const UI = {
  AccessMenu,
}

//example response data from AccessMenu data source that generated to be used in the UI after user press menu item
export const response = {
  PRODUCT: {
    permission: {
      create: true,
      read: true,
      update: false,
      delete: false,
    },
    data: [
      { id: 1, name: 'Product A', price: 100, stock: 50 },
      { id: 2, name: 'Product B', price: 150, stock: 30 },
    ],
  },
  USER: {
    permission: {
      create: true,
      read: true,
      update: true,
      delete: false,
    },
    data: [
      { id: 1, username: 'user1', email: 'user1@example.com', role: 'admin' },
      { id: 2, username: 'user2', email: 'user2@example.com', role: 'user' },
    ],
  },
  SALES: {
    permission: {
      create: true,
      read: true,
      update: false,
      delete: false,
    },
    data: [
      { id: 1, product_id: 1, quantity: 2, total_price: 200 },
      { id: 2, product_id: 2, quantity: 1, total_price: 150 },
    ],
  },
  PURCHASE: {
    permission: {
      create: true,
      read: true,
      update: false,
      delete: false,
    },
    data: [
      { id: 1, product_id: 1, quantity: 5, total_price: 500 },
      { id: 2, product_id: 2, quantity: 3, total_price: 450 },
    ],
  },
  SALES_SUMMARY: {
    permission: {
      create: false,
      read: true,
      update: false,
      delete: false,
    },
    data: [
      { date: '2024-01-01', total_sales: 1000, total_transactions: 10 },
      { date: '2024-01-02', total_sales: 1500, total_transactions: 15 },
    ],
  },
  INVENTORY_STATUS: {
    permission: {
      create: false,
      read: true,
      update: false,
      delete: false,
    },
    data: [
      { product_id: 1, product_name: 'Product A', stock_level: 45 },
      { product_id: 2, product_name: 'Product B', stock_level: 27 },
    ],
  },
}
