<script setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { isDark } from '@/composables/dark'
import RevoGrid from '@revolist/vue3-datagrid'

const props = defineProps({
  menu: {
    type: Object,
    required: true,
  },
  // Menerima data skema & data baris (misal: objek Penjualan) dari [..all].vue
  schemaData: {
    type: Object,
    required: true,
  }
})

const router = useRouter()

const tabs = ref([
  { key: 'Antrian 1', data: [] },
  { key: 'Antrian 2', data: [] },
])

const activeTab = ref(tabs.value[0].key)
const columns = ref([])
const rows = ref([])
const primaryKey = ref('id')
const permission = ref({})

/**
 * PETA KOMPONEN INPUT DINAMIS (Jika dibutuhkan untuk form inline/drawer nantinya)
 */
const inputComponentsMap = {
  'text': defineAsyncComponent(() => import('@/components/inputs/InputText.vue')),
  'number': defineAsyncComponent(() => import('@/components/inputs/InputNumber.vue')),
  'currency': defineAsyncComponent(() => import('@/components/inputs/InputCurrency.vue')),
  'date': defineAsyncComponent(() => import('@/components/inputs/InputDate.vue')),
  'display': defineAsyncComponent(() => import('@/components/inputs/InputDisplay.vue')),
  'relation': defineAsyncComponent(() => import('@/components/inputs/InputRelation.vue')),
}

/**
 * MOUNT & PARSE DATA SESUAI STRUKTUR BARU
 */
const loadTransactionData = () => {
  const res = props.schemaData
  if (!res) return

  // 1. Definisikan Kolom Grid & Handle tipe 'relation' (User & Customer)
  columns.value = (res.schema || []).map((field) => ({
    prop: field.key,
    name: field.label,
    size: field.width || 200, // <--- TAMBAHKAN INI (Ganti 200 dengan lebar pixel yang diinginkan)
    // Menampilkan property nama relasi (misal: user.nmUser atau customer.nmCustomer)
    cellTemplate: field.type === 'relation'
      ? (h, cellProps) => h('span', {}, cellProps.model[field.key]?.[field.relation.displayField] || '')
      : undefined
  }))

  // 2. Set baris data utama
  rows.value = res.data || []

  // Ambil metadata skema
  primaryKey.value = (res.schema || []).find((f) => f.primary)?.key || 'id'
  permission.value = res.permissions || {}
}

onMounted(loadTransactionData)

// Watch perubahan skema kiriman dari router dynamic
watch(() => props.schemaData, loadTransactionData, { deep: true })

/**
 * REDIRECT KE DETAIL TRANSAKSI SAAT BARIS DI-KLIK
 * Menghandle perpindahan rute ke /penjualan/[id] agar memicu skema 'transaction-detail'
 */
const handleRowClick = (event) => {
  event.preventDefault()

  const idTransaksi = event.detail.model[primaryKey.value]
  if (idTransaksi) {
    // Navigasi secara programatis ke sub-route detail, misal: /penjualan/1
    console.log(`Membuka Detail Transaksi ID: ${idTransaksi}`)
    router.push(`${props.menu.route}/${idTransaksi}`)
  }
}

const addAntrian = () => {
  const index = tabs.value.length + 1
  tabs.value.push({
    key: `Antrian ${index}`,
    data: []
  })
  activeTab.value = `Antrian ${index}` // Otomatis fokus ke antrian baru
}
</script>

<template>
  <div>
    <div class="flex">
      <div class="flex-1 p-6">

        <!-- Display Title Berdasarkan Respon API -->
        <h2 class="text-xl font-bold mb-4 capitalize">
          {{ props.schemaData?.label || props.menu.label }}
        </h2>

        <div class="w-full">
          <!-- Tabs Header (Multi-Antrian Transaksi) -->
          <div
            class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto bg-gray-50 dark:bg-gray-900 rounded-t-lg">
            <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
              class="px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition duration-150 focus:outline-none"
              :class="activeTab === tab.key
                ? 'border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'">
              {{ tab.key }}
            </button>

            <button @click="addAntrian"
              class="px-5 py-3 text-sm font-medium whitespace-nowrap text-gray-400 hover:text-emerald-500 dark:text-gray-500 dark:hover:text-emerald-400 border-b-2 border-transparent transition italic">
              + Tambah Antrian
            </button>
          </div>

          <!-- Tab Content Datagrid -->
          <div
            class="p-4 bg-white dark:bg-gray-800 border-x border-b border-gray-100 dark:border-gray-700 rounded-b-lg shadow-sm">
            <div v-for="tab in tabs" :key="tab.key" v-show="activeTab === tab.key">

              <!-- 
                @beforeeditstart diintersepsi menggunakan fungsi handleRowClick 
                agar saat sel/baris di-klik/di-edit, ia langsung mengarah ke halaman detail transaksi.
              -->
              <RevoGrid ref="grid" :columns="columns" :source="rows" :theme="isDark ? 'darkCompact' : 'compact'"
                resize="true" @beforeeditstart="handleRowClick" />

            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>