/*awal login, setelah user berhasil login, 
kita akan mendapatkan data dari RestApi menu apa saja yang bisa diakses oleh user tersebut, 
data ini biasanya disimpan di state management seperti vuex atau pinia, dan digunakan untuk generate menu di sidebar 
dan juga untuk generate form di halaman master data dan transaksi
*/
export const AccessMenu = [
  {
    key: 'Product',
    icon: 'iconify:carbon:product',
    label: 'Data product',
    route: '/product',
    api: '/api/product',
    menuCategory: 'product',
  },
  {
    key: 'User',
    icon: 'iconify:boxicons:user',
    label: 'Data user',
    route: '/user',
    api: '/api/user',
    menuCategory: 'user',
  },
  {
    key: 'Customer',
    icon: 'iconify:clarity:users-line',
    label: 'Data customer',
    route: '/customer',
    api: '/api/customer',
    menuCategory: 'customer',
  },
  {
    key: 'Penjualan',
    icon: 'iconify:mdi-cash-register',
    label: 'Data penjualan',
    route: '/penjualan',
    api: '/api/penjualan',
    menuCategory: 'penjualan',
  }
]

// ==========================================
// FUNCTION UTILITY UNTUK GENERATE DATA DINAMIS
// ==========================================
function generateDynamicData(schema, count = 5) {
  const dataList = [];

  for (let i = 1; i <= count; i++) {
    const row = {};

    schema.forEach(field => {
      switch (field.type) {
        case 'display':
          if (field.primary) {
            row[field.key] = i;
          } else {
            row[field.key] = field.key === 'action'
              ? ['create', 'edit', 'delete'][i % 3]
              : `${field.label} Mock ${i}`;
          }
          break;

        case 'text':
          row[field.key] = `${field.label} ${String.fromCharCode(64 + i)}`; // Product A, User A, dst.
          break;

        case 'number':
        case 'currency':
          row[field.key] = i * 50; // Contoh: 50, 100, 150
          break;

        case 'email':
          row[field.key] = `${field.key}${i}@example.com`.toLowerCase();
          break;

        case 'date':
          row[field.key] = `2026-01-${String(i).padStart(2, '0')}`;
          break;

        case 'relation':
          // Generate data object relasi tiruan berdasarkan konfigurasi entity
          const entityName = field.relation.entity;
          const valueField = field.relation.valueField;
          const displayField = field.relation.displayField;

          row[field.key] = {
            [valueField]: i,
            [displayField]: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} ${String.fromCharCode(64 + i)}`
          };
          break;

        case 'json':
          // Khusus untuk audit history data lama & baru
          if (field.key === 'oldData') {
            row[field.key] = i === 1 ? null : { id: i, info: `Old Mock Data ${i}` };
          } else {
            row[field.key] = i === 3 ? null : { id: i, info: `New Mock Data ${i}` };
          }
          break;

        default:
          row[field.key] = null;
      }
    });

    dataList.push(row);
  }

  return dataList;
}

/* misal klik menu product lalu melakukan request lalu RestApi memberikan response */
export const Product = {
  key: 'Product',
  label: 'Data product',
  type: 'master',

  permissions: {
    view: true,
    create: true,
    edit: true,
    delete: true,
  },

  schema: [
    { key: 'id', label: 'Product ID', type: 'display', primary: true, readonly: true },
    { key: 'nmProduct', label: 'Product Name', type: 'text' },
    { key: 'price', label: 'Price', type: 'currency' },
    { key: 'stock', label: 'Stock', type: 'number', autoIncrementOnDuplicate: true },
  ],

  // data: [
  //   { id: 1, nmProduct: 'Product A', price: 100, stock: 50 },
  //   { id: 2, nmProduct: 'Product B', price: 150, stock: 30 },
  // ]
  get data() {
    return generateDynamicData(this.schema, 5000); // Tentukan jumlah data yang ingin di-generate di parameter kedua
  }
}

export const User = {
  key: 'User',
  label: 'Data user',
  type: 'master',
  permissions: {
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  schema: [
    { key: 'id', label: 'User ID', type: 'display', primary: true },
    { key: 'nmUser', label: 'User Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
  ],
  // data: [
  //   { id: 1, nmUser: 'User A', email: 'usera@example.com' },
  //   { id: 2, nmUser: 'User B', email: 'userb@example.com' },
  // ]
  get data() {
    return generateDynamicData(this.schema, 5000);
  }
}

export const Customer = {
  key: 'Customer',
  label: 'Data customer',
  type: 'master',
  permissions: {
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  schema: [
    { key: 'id', label: 'Customer ID', type: 'display', primary: true, readonly: true },
    { key: 'nmCustomer', label: 'Customer Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    {
      key: 'affiliate', label: 'Affiliate', type: 'relation', relation: {
        entity: 'customer',
        valueField: 'id',
        displayField: 'nmCustomer'
      }, readonly: true
    }
  ],
  // data: [
  //   { id: 1, nmCustomer: 'Customer A', email: 'customera@example.com', affiliate: { id: 2, nmCustomer: 'Customer B' } },
  //   { id: 2, nmCustomer: 'Customer B', email: 'customerb@example.com', affiliate: { id: 1, nmCustomer: 'Customer A' } },
  // ]
  get data() {
    return generateDynamicData(this.schema, 5000);
  }
}

/*misal klik menu penjualan lalu melakukan request lalu RestApi memberikan response*/
export const Penjualan = {
  key: 'Penjualan',
  label: 'Data penjualan',
  type: 'transaction',

  permissions: {
    view: true,
    create: true,
    edit: false,
    delete: false,
  },

  schema: [
    { key: 'id', label: 'Id Penjualan', type: 'display', primary: true },
    { key: 'date', label: 'tanggal', type: 'date' },
    {
      key: 'user', label: 'user', type: 'relation', relation: {
        entity: 'user',
        valueField: 'id',
        displayField: 'nmUser',
        api: '/api/user',
      }, validation: { required: true }
    },
    {
      key: 'customer', label: 'customer', type: 'relation', relation: {
        entity: 'customer',
        valueField: 'id',
        displayField: 'nmCustomer',
        api: '/api/customer',
      }, validation: { required: true }
    },
    { key: 'total', label: 'total', type: 'currency', readonly: true },
  ],

  // data: [
  //   { id: 1, date: '2024-01-01', user: { id: 1, nmUser: 'User A' }, customer: { id: 1, nmCustomer: 'Customer A' }, total: 200 },
  //   { id: 2, date: '2024-01-02', user: { id: 2, nmUser: 'User B' }, customer: { id: 2, nmCustomer: 'Customer B' }, total: 150 },
  // ]
  get data() {
    return generateDynamicData(this.schema, 5000);
  }
}

/*setelah itu halaman dinamis di render*/

/*misal salah satu header di klik penjualan/[id]* restApi memberikan response */
export const DetailPenjualan = {
  key: 'DetailPenjualan',
  label: 'Detail penjualan',
  type: 'transaction-detail',
  permissions: {
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  header: {
    schema: [
      { key: 'id', label: 'Id Penjualan', type: 'display', primary: true },
      { key: 'date', label: 'tanggal', type: 'date' },
      {
        key: 'user', label: 'user', type: 'relation', relation: {
          entity: 'user',
          valueField: 'id',
          displayField: 'nmUser',
          api: '/api/user',
        }, validation: { required: true }
      },
      {
        key: 'customer', label: 'customer', type: 'relation', relation: {
          entity: 'customer',
          valueField: 'id',
          displayField: 'nmCustomer',
          api: '/api/customer',
        }, validation: { required: true }
      },
      { key: 'total', label: 'total', type: 'currency', readonly: true },
    ],
    // data: { id: 1, date: '2024-01-01', user: { id: 1, nmUser: 'User A' }, customer: { id: 1, nmCustomer: 'Customer A' }, total: 200 }
    get data() {
      // Karena berbentuk object tunggal, ambil index pertama hasil generator
      return generateDynamicData(this.schema, 1)[0];
    }
  },
  details: {
    schema: [
      { key: 'id', label: 'Id Detail Penjualan', type: 'display', primary: true },
      {
        key: 'product', label: 'Product', type: 'relation', relation: {
          entity: 'product',
          valueField: 'id',
          displayField: 'nmProduct',
          api: '/api/product',
        }, validation: { required: true }
      },
      { key: 'quantity', label: 'Quantity', type: 'number', validation: { required: true, min: 1 } },
      { key: 'price', label: 'Price', type: 'currency' },
    ],
    // data: [
    //   { id: 1, product: { id: 1, nmProduct: 'Product A' }, quantity: 2, price: 100 },
    //   { id: 2, product: { id: 2, nmProduct: 'Product B' }, quantity: 1, price: 150 },
    // ]
    get data() {
      return generateDynamicData(this.schema, 5000);
    }
  }
}

/* contoh RestAPI response untuk history audit per form/menu terlepas itu master/transaction */
export const ProductAuditHistory = {
  key: 'ProductAuditHistory',
  label: 'Audit History Product',
  type: 'audit-history',
  permissions: {
    view: true,
  },
  schema: [
    { key: 'id', label: 'Id', type: 'display', primary: true },
    { key: 'action', label: 'Action', type: 'display' },
    {
      key: 'user', label: 'User', type: 'relation', relation: {
        entity: 'user',
        valueField: 'id',
        displayField: 'nmUser',
        api: '/api/user',
      }, validation: { required: true }
    },
    { key: 'datetime', label: 'Datetime', type: 'display' },
    { key: 'oldData', label: 'Old Data', type: 'json' },
    { key: 'newData', label: 'New Data', type: 'json' },
  ],
  // data: [
  //   { id: 1, action: 'create', user: { id: 1, nmUser: 'User A' }, datetime: '2024-01-01 11:23:30', oldData: null, newData: { id: 1, nmProduct: 'Product A', price: 100, stock: 50 } },
  //   { id: 2, action: 'edit', user: { id: 2, nmUser: 'User B' }, datetime: '2024-01-02 14:45:10', oldData: { id: 1, nmProduct: 'Product A', price: 100, stock: 50 }, newData: { id: 1, nmProduct: 'Product A', price: 90, stock: 50 } },
  //   { id: 3, action: 'delete', user: { id: 1, nmUser: 'User A' }, datetime: '2024-01-03 09:15:20', oldData: { id: 2, nmProduct: 'Product B', price: 150, stock: 30 }, newData: null },
  // ]
  get data() {
    return generateDynamicData(this.schema, 5000);
  }
}