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