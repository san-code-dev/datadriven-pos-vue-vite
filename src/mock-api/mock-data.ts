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
    data: [] as readonly any[]
}

const DetailPenjualan = {
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
        data: [] as readonly any[],
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
        data: [] as readonly any[],
    }
}

const ProductAuditHistory = {
    key: 'ProductAuditHistory',
    label: 'Audit History Product',
    type: 'audit-history',
    permissions: {
        view: true,
    },
    schema: [
        { key: 'id', label: 'Id', type: 'display', primary: true, readonly: true },
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
    data: [] as readonly any[],
}

// ==========================================
// ASSIGNMENT DATA (SEMUA DI BAWAH)
// ==========================================

Product.data = Object.freeze(generateDynamicData(Product.schema, 5000));
User.data = Object.freeze(generateDynamicData(User.schema, 5000));
Customer.data = Object.freeze(generateDynamicData(Customer.schema, 5000));
Penjualan.data = Object.freeze(generateDynamicData(Penjualan.schema, 5000));
DetailPenjualan.header.data = Object.freeze(generateDynamicData(DetailPenjualan.header.schema, 1)[0]);
DetailPenjualan.details.data = Object.freeze(generateDynamicData(DetailPenjualan.details.schema, 5000));

ProductAuditHistory.data = Object.freeze(generateDynamicData(ProductAuditHistory.schema, 5000));

// ==========================================
// EXPORT MODULES
// ==========================================
export { Product, User, Customer, Penjualan, DetailPenjualan, ProductAuditHistory };