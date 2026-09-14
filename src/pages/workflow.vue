<script setup lang="ts">
import { ref } from 'vue'
import type { Edge } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import SpecialNode from '@/components/workflow/MasterNode.vue'


const Menu = [{
    key: 'customer',
    label: 'Data Customer',
    type: 'master',
    icon: 'iconify:carbon:user-multiple',
    permissions: { create: true, edit: true, delete: true },
    isMenuHidden: false,
    schema: [
        { key: 'id', label: 'ID', type: 'display', required: true, readonly: true, nullable: false },
        { key: 'nmCustomer', label: 'Customer Name', type: 'text', required: true, size: 250 },
        { key: 'email', label: 'Email Address', type: 'text', required: true, size: 250 },
        { key: 'telepon', label: 'No Telp', type: 'text', size: 200 },
        { key: 'alamat', label: 'Address', type: 'textarea' },
    ],
    data: []
},

{
    key: 'product',
    label: 'Data Product',
    type: 'master',
    icon: 'iconify:carbon:product',
    permissions: { create: true, edit: true, delete: true },
    isMenuHidden: false,
    schema: [
        { key: 'id', label: 'Product ID', type: 'display', required: true, readonly: true, nullable: false },
        { key: 'name', label: 'Product Name', type: 'text', required: true, size: 300 },
        { key: 'price', label: 'Price', type: 'currency', required: true },
        { key: 'stok', label: 'Stock', type: 'number', required: true },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            size: 120,
            options: [
                { label: 'Aktif', value: 'active' },
                { label: 'Non-Aktif', value: 'inactive' }
            ]
        },
        { key: 'tanggalMasuk', label: 'Tanggal Masuk', type: 'date', size: 160 },
        { key: 'description', label: 'Description', type: 'textarea', size: 200 },
    ],
    data: []
},

{
    key: 'penjualan',
    prefix: 'PJ',
    label: 'Transaksi Penjualan (POS)',
    type: 'transaction',
    icon: 'iconify:mdi-cash-register',
    permissions: { view: true, create: true, edit: false, delete: false },
    isMenuHidden: false,
    actions: [
        { key: 'print', label: 'Cetak Nota', type: 'printer' },
        { key: 'pay', label: 'Bayar Langsung', type: 'payment' },
    ],
    queue: {
        label: 'ANTRIAN TRANSAKSI',
        schema: [
            { key: 'id', label: 'ID Order', type: 'display', primary: true, readonly: true, nullable: false },
            { key: 'label', label: 'Pelanggan', type: 'text' },
        ],
        data: []
    },
    header: {
        label: 'INFORMASI UTAMA NOTA',
        schema: [
            { key: 'id', label: 'ID', type: 'display', primary: true, readonly: true, nullable: false },
            { key: 'noInvoice', label: 'No Invoice', type: 'text', readonly: true },
            { key: 'createdAt', label: 'Tanggal Transaksi', type: 'date' },
            { key: 'customerId', label: 'kode customer', type: 'relation', entity: 'customer', relationKey: 'id' },
            { key: 'nmCustomer', label: 'Nama Customer', type: 'text', readonly: true, size: 250 },
            { key: 'discount', label: 'Potongan Diskon', type: 'currency' },
            { key: 'total', label: 'Total Bayar', type: 'currency', readonly: true, highlight: true },
        ],
        data: null
    },
    details: {
        label: 'DAFTAR BARANG BELANJA',
        schema: [
            { key: 'id', label: 'id', type: 'primary', primary: true, readonly: true, nullable: false },
            { key: 'productId', label: 'Kode Barang', type: 'text', readonly: true },
            { key: 'nmProduct', label: 'Nama Barang', type: 'text', readonly: true, size: 250 },
            { key: 'quantity', label: 'Qty', type: 'number', validation: { required: true, min: 1 }, size: 80 },
            { key: 'price', label: 'Harga Satuan', type: 'currency', readonly: true, size: 150 },
            { key: 'subtotal', label: 'Subtotal', readonly: true, size: 250 },
        ],
        data: []
    },
}

];



const nodes = Menu.map(data => {
    return {
        id: 'node-' + Math.random(),
        position: {
            x: Math.random() * window.screen.availWidth,
            y: Math.random() * window.screen.availHeight
        },
        data: data
    }
})

// these are our edges
const edges = ref<Edge[]>([
])
</script>

<template>
    <div class="h-screen w-screen">
        <VueFlow :nodes="nodes" :edges="edges">
            <template #node-special="specialNodeProps">
                <SpecialNode v-bind="specialNodeProps" />
            </template>
        </VueFlow>
    </div>

</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>