import { generateDynamicData } from '@/composables/generate-mock-data';
// ==========================================
// DEKLARASI OBJEK / RESPONSE REST-API
// ==========================================

const Product = {
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
    data: [] as readonly any[]
}

const User = {
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
        { key: 'id', label: 'User ID', type: 'display', primary: true, readonly: true },
        { key: 'nmUser', label: 'User Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
    ],
    data: [] as readonly any[]
}

const Customer = {
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
    data: [] as readonly any[]
}


const Penjualan = {
    key: 'Penjualan',
    label: 'Penjualan',
    type: 'transaction',
    permissions: {
        view: true,
        create: true,
        edit: true,
        delete: false,
    },
    actions: [
        { key: 'export', label: 'Export Data', type: 'export' },
        { key: 'print', label: 'Print Data', type: 'printer' },
        { key: 'pay', label: 'Bayar', type: 'payment' },
    ],

    queue: {
        schema: [
            { key: 'id', label: 'antrian', type: 'display', primary: true, readonly: true },
            { key: 'customer', label: 'customer', type: 'text' },
        ],
        data: [
            { id: 1, customer: 'Jane Smith' },
            { id: 2, customer: 'Bob' },
            { id: 3, customer: 'Charlie' },
        ]
    },
    // antrian

    header: {
        label: 'ANTRIAN PENJUALAN',
        schema: [
            { key: 'id', label: 'antrian', type: 'display', primary: true, readonly: true },
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
            { key: 'discount', label: 'diskon', type: 'text' },
            { key: 'total', label: 'total', type: 'currency', readonly: true, highlight: true },
        ],
        data: {
            id: 3, date: '2023-01-03', user: { id: 1, nmUser: 'John Doe' }, customer: { id: 3, nmCustomer: 'Charlie' }, discount: 30, total: 1200
        },
    },
    details: {
        label: 'ITEM KERANJANG BELANJA',
        schema: [
            { key: 'id', label: 'Id', type: 'display', primary: true, readonly: true },
            { key: 'penjualanId', label: 'Penjualan ID', type: 'display', readonly: true },
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
        data: [
            { id: 5, penjualanId: 3, product: { id: 2, nmProduct: 'Product B' }, quantity: 4, price: 200 },
            { id: 6, penjualanId: 3, product: { id: 3, nmProduct: 'Product C' }, quantity: 5, price: 80 },
            { id: 7, penjualanId: 3, product: { id: 4, nmProduct: 'Product D' }, quantity: 2, price: 150 },
            { id: 8, penjualanId: 3, product: { id: 5, nmProduct: 'Product E' }, quantity: 1, price: 300 },
        ],
    }
}

// ==========================================

Product.data = Object.freeze(generateDynamicData(Product.schema, 1000));
User.data = Object.freeze(generateDynamicData(User.schema, 1000));
Customer.data = Object.freeze(generateDynamicData(Customer.schema, 1000));

// ==========================================
// EXPORT MODULES
// ==========================================
export { Product, User, Customer, Penjualan };