import MasterComponent from '@/components/dynamic/MasterComponent.vue'
import TransactionComponent from '@/components/dynamic/TransactionComponent.vue'
import ReportComponent from '@/components/dynamic/ReportComponent.vue'
import InputText from '@/components/form/InputText.vue'
import InputModalData from './components/form/InputModalData.vue'
import InputDate from './components/form/InputDate.vue'
import InputNumber from './components/form/InputNumber.vue'
import InputTel from './components/form/InputTel.vue'
import InputEmail from './components/form/InputEmail.vue'
import InputOption from './components/form/InputOption.vue'
import InputLabel from './components/form/InputLabel.vue'
import TransactionResto from '@/components/dynamic/transaction/TransactionResto.vue'
// Global configurations
// App component types
const MenuType = {
  Master: MasterComponent,
  Transaction: TransactionComponent,
  Report: ReportComponent,
}

const InputType = {
  Text: InputText,
  Number: InputNumber,
  Date: InputDate,
  ModalData: InputModalData,
  Tel: InputTel,
  Email: InputEmail,
  Option: InputOption,
  Label: InputLabel,
}

const TransactionType = {
  Resto: TransactionResto,
}

// Specific user interface configurations not saved in the database new user automaically get this configurations
// UI Builder

const AccessMenu = [ //anggap saja ini data yang didapat dari database ketika user login dan disimpan di state management seperti vuex atau pinia, data ini bisa saja berbeda untuk setiap user tergantung permission yang dimiliki
  {
    key: 'PRODUCT',
    name: 'Data product',
    link: '/product',
    type: MenuType.Master,
    api: '/api/product',
    menuCategory: 'product',
    menuSubCategory: 'data',
    fields: [
      { key: 'id', label: 'Product ID', type: InputType.Label, primary: true },
      {
        key: 'name',
        label: 'Product Name',
        required: true,
        type: InputType.Text,
      },
      { key: 'price', label: 'Price', type: InputType.Number },
      { key: 'stock', label: 'Stock', type: InputType.Number },
    ],
  },
  {
    key: 'USER',
    name: 'Data user',
    link: '/user',
    type: MenuType.Master,
    api: '/api/user',
    menuCategory: 'user',
    menuSubCategory: 'data',
    fields: [
      { key: 'id', label: 'User ID', type: InputType.Label, primary: true },
      {
        key: 'username',
        label: 'Username',
        type: InputType.Text,
        required: true,
      },
      { key: 'email', label: 'Email', type: InputType.Email },
      {
        key: 'role',
        label: 'Role',
        type: InputType.Option,
        refer: 'user.role',
      },
    ],
  },

  {
    key: 'CUSTOMER',
    name: 'Data customer',
    link: '/customer',
    type: MenuType.Master,
    api: '/api/customer',
    menuCategory: 'customer',
    menuSubCategory: 'data',
    fields: [
      { key: 'id', label: 'Customer ID', type: InputType.Label, primary: true },
      {
        key: 'name',
        label: 'Customer name',
        required: true,
        type: InputType.Text,
      },
      { key: 'email', label: 'Email', type: InputType.Text },
      { key: 'wa', label: 'WA', type: InputType.Tel },
    ],
  },

  {
    key: 'PENJUALAN',
    name: 'Entry penjualan',
    link: '/penjualan',
    type: MenuType.Transaction,
    api: '/api/penjualan',
    menuCategory: 'penjualan',
    menuSubCategory: 'transaksi',
    fields: [
      {
        key: 'id',
        label: 'Id Penjualan',
        type: InputType.Label,
        primary: true,
      },
      { key: 'date', label: 'tanggal', type: InputType.Date },
      {
        key: 'idUser',
        label: 'id user',
        type: InputType.ModalData,
        refer: 'user.id',
        preview: 'nmUser',
      },
      { key: 'nmUser', label: 'user', type: InputType.Text },
      {
        key: 'idCustomer',
        label: 'id customer',
        type: InputType.ModalData,
        refer: 'customer.id',
        preview: 'nmCustomer',
      },
      { key: 'nmCustomer', label: 'customer', type: InputType.Text },
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
  CUSTOMER: {
    permission: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    data: [
      {
        id: 1,
        name: 'user1',
        email: 'customer@example.com',
        wa: '628544365346',
      },
      {
        id: 2,
        name: 'user2',
        email: 'customer2@example.com',
        wa: '628544365346',
      },
    ],
  },
  PENJUALAN: {
    permission: {
      create: true,
      read: true,
      update: true,
      delete: true,
    },
    data: [
      {
        id: 1,
        idUser: 1,
        date: '2025-03-05',
        nmUser: 'user1',
        idCustomer: 1,
        nmCustomer: 'customer1',
      },
      {
        id: 2,
        date: '2025-11-22',
        idUser: 2,
        nmUser: 'user2',
        idCustomer: 2,
        nmCustomer: 'customer2',
      },
    ],
  },
}

export const detailTransaction = {
  PENJUALAN: {
    transactionType: TransactionType.Resto,
    fields: [
      {
        key: 'id',
        label: 'Id product',
        primary: true,
      },
      {
        key: 'harga',
        label: 'id user',
      },
      {
        key: 'jumlah',
        label: 'jumlah',
      },
    ],
  },
}

export const transactionData = [
  {
    id: 1,
    harga: 10000,
    jumlah: 4,
  },
]
