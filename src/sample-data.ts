import MasterComponent from '@/components/dynamic/MasterComponent.vue'
import TransactionComponent from '@/components/dynamic/TransactionComponent.vue'
import ReportComponent from '@/components/dynamic/ReportComponent.vue'

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
    menuCategory: 'product',
    menuSubCategory: 'data',
    fields: [
      { key: 'id', label: 'Product ID', primary: true },
      { key: 'name', label: 'Product Name', required: true },
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
    menuCategory: 'user',
    menuSubCategory: 'data',
    fields: [
      { key: 'id', label: 'User ID', primary: true },
      { key: 'username', label: 'Username', required: true },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
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
      delete: true,
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
      delete: true,
    },
    data: [
      { id: 1, username: 'user1', email: 'user1@example.com', role: 'admin' },
      { id: 2, username: 'user2', email: 'user2@example.com', role: 'user' },
    ],
  },
}
