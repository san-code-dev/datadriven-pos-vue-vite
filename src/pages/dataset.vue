<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { useAuthStore } from '@/stores/auth';
import { useTenantStore, type Tenant } from '@/stores/tenant';
import { useCompanyStore } from '@/stores/company';
import { useTabStore } from '@/stores/tabs';
import api from '@/lib/axios';
import { reconnectSocket } from '@/lib/socket';

const router = useRouter();
const authStore = useAuthStore();
const tenantStore = useTenantStore();
const tabStore = useTabStore();
const companyStore = useCompanyStore();

const searchQuery = ref('');
const isModalOpen = ref(false);
const isLoading = ref(false);
const isFetching = ref(false);
const navigatingTenantId = ref<string | null>(null);
const editingTenant = ref<Tenant | null>(null);
const selectedIndex = ref<number>(0);
const cardRefs = ref<HTMLElement[]>([]);

const tenants = ref<Tenant[]>([]);

const form = ref({
    name: '',
    code: '',
    logo: '',
    address: ''
});

const SERVICE_ENDPOINT = '/tenant';

const goToCompany = () => {
    router.push('/company');
};

const fetchTenants = async () => {
    isFetching.value = true;
    try {
        const response = await api.get(`${SERVICE_ENDPOINT}/get-all`, { includeCompany: true });
        tenants.value = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];

        focusSelectedCard();
    } catch (error) {
        console.error('Gagal mengambil data tenant:', error);
    } finally {
        isFetching.value = false;
    }
};

const userAvatarLetter = computed(() => {
    return authStore.user?.email ? authStore.user.email.charAt(0).toUpperCase() : 'U';
});

const filteredTenants = computed(() => {
    if (!searchQuery.value) return tenants.value;
    const q = searchQuery.value.toLowerCase().trim();
    return tenants.value.filter(t =>
        t.name?.toLowerCase().includes(q) || t.code?.toLowerCase().includes(q)
    );
});

const focusSelectedCard = () => {
    nextTick(() => {
        if (cardRefs.value[selectedIndex.value]) {
            cardRefs.value[selectedIndex.value]?.focus();
        }
    });
};

watch(filteredTenants, () => {
    selectedIndex.value = 0;
    focusSelectedCard();
});

onMounted(() => {
    fetchTenants();
});

const selectAndNavigate = async (tenant: Tenant) => {
    if (navigatingTenantId.value) return;

    const isSameTenant = tenantStore.selectedTenant?.id === tenant.id;
    navigatingTenantId.value = tenant.id;

    try {
        tenantStore.setSelectTenant(tenant as Parameters<typeof tenantStore.setSelectTenant>[0]);

        if (!isSameTenant) {
            tabStore.clearTabs();
            reconnectSocket();
        }

        if (router.currentRoute.value.path !== '/dashboard') {
            await router.push('/dashboard');
        }
    } catch (error) {
        console.error('Gagal melakukan navigasi:', error);
    } finally {
        navigatingTenantId.value = null;
    }
};

const handleContainerKeyDown = (e: KeyboardEvent) => {
    const total = filteredTenants.value.length;
    if (total === 0 || isModalOpen.value) return;

    let columns = 1;
    if (window.innerWidth >= 1280) columns = 4;
    else if (window.innerWidth >= 1024) columns = 3;
    else if (window.innerWidth >= 640) columns = 2;

    switch (e.key) {
        case 'ArrowRight':
            e.preventDefault();
            selectedIndex.value = (selectedIndex.value + 1) % total;
            focusSelectedCard();
            break;
        case 'ArrowLeft':
            e.preventDefault();
            selectedIndex.value = (selectedIndex.value - 1 + total) % total;
            focusSelectedCard();
            break;
        case 'ArrowDown':
            e.preventDefault();
            selectedIndex.value = Math.min(selectedIndex.value + columns, total - 1);
            focusSelectedCard();
            break;
        case 'ArrowUp':
            e.preventDefault();
            selectedIndex.value = Math.max(selectedIndex.value - columns, 0);
            focusSelectedCard();
            break;
        case 'Enter':
            e.preventDefault();
            if (filteredTenants.value[selectedIndex.value]) {
                selectAndNavigate(filteredTenants.value[selectedIndex.value]);
            }
            break;
    }
};

const openModal = (tenant?: Tenant) => {
    if (tenant) {
        editingTenant.value = tenant;
        form.value = {
            name: tenant.name,
            code: tenant.code,
            logo: tenant.logo || '',
            address: tenant.address || ''
        };
    } else {
        editingTenant.value = null;
        form.value = { name: '', code: '', logo: '', address: '' };
    }
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    editingTenant.value = null;
    focusSelectedCard();
};

const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 5MB.');
        target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 150;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            form.value.logo = canvas.toDataURL('image/png', 0.8);
            target.value = '';
        };
        img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
};

const handleSubmit = async () => {
    isLoading.value = true;
    try {
        const payload = {
            name: form.value.name,
            code: form.value.code.toUpperCase().trim(),
            logo: form.value.logo,
            address: form.value.address
        };

        if (editingTenant.value?.id) {
            await api.put(`${SERVICE_ENDPOINT}/update`, { id: editingTenant.value.id, ...payload }, { includeCompany: true });
        } else {
            await api.post(`${SERVICE_ENDPOINT}/create`, payload, { includeCompany: true });
        }

        await fetchTenants();
        closeModal();
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Gagal menyimpan dataset.';
        alert(msg); // Tampilkan pesan error jika kode terduplikasi
        console.error('Gagal menyimpan dataset:', error);
    } finally {
        isLoading.value = false;
    }
};
</script>
<template>
    <div tabindex="-1" @keydown="handleContainerKeyDown"
        class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 outline-none">

        <!-- Main Content Wrapper -->
        <div class="max-w-6xl mx-auto w-full">
            <!-- Top Bar Navigation -->
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <!-- Sebelah Kiri: User Info -->
                <div class="flex items-center gap-3">
                    <div
                        class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-sm">
                        {{ userAvatarLetter }}
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 dark:text-slate-500 font-medium">Selamat datang kembali,</p>
                        <h1 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{{ authStore.user?.email || 'Pengguna' }}</span>
                            <span v-if="authStore.user?.role"
                                class="px-1.5 py-0.5 text-[10px] uppercase font-mono font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {{ authStore.user.role }}
                            </span>
                        </h1>
                    </div>
                </div>

                <!-- Sebelah Kanan: Company Terpilih (Klik untuk ke /company) -->
                <button @click="goToCompany"
                    class="flex items-center gap-2.5 px-3 py-1.5 transition-all text-left focus:outline-none group">

                    <div class="hidden sm:block">
                        <p class="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight">Perusahaan
                        </p>
                        <p
                            class="text-[26px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {{ companyStore.selectedCompany?.name || 'Pilih Perusahaan' }}
                        </p>
                    </div>
                    <Icon icon="lucide:chevron-right"
                        class="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all ml-1" />
                </button>
            </div>

            <!-- Top Action Bar -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
                <div class="relative w-full sm:w-80">
                    <Icon icon="lucide:search"
                        class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input v-model="searchQuery" type="text" placeholder="Cari cabang atau kode..."
                        class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                </div>
                <button @click="openModal()" class="btn-action-emerald-600 w-full sm:w-auto justify-center">
                    <Icon icon="lucide:plus" class="w-4 h-4" />
                    <span>Dataset Baru</span>
                </button>
            </div>

            <!-- Loading State Pertama Kali Ambil Data API -->
            <div v-if="isFetching" class="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Icon icon="lucide:loader-2" class="w-8 h-8 text-emerald-500 animate-spin" />
                <p class="text-xs text-slate-400">Memuat daftar cabang...</p>
            </div>

            <!-- GRID WRAP LAYOUT CARD CABANG -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="(tenant, index) in filteredTenants" :key="tenant.id" ref="cardRefs" tabindex="0"
                    @mouseenter="selectedIndex = index" @focus="selectedIndex = index"
                    @click="selectAndNavigate(tenant)"
                    class="group relative flex flex-col justify-between p-5 rounded-2xl border bg-white dark:bg-slate-800 transition-all duration-200 cursor-pointer overflow-hidden outline-none focus:outline-none"
                    :class="[
                        selectedIndex === index
                            ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                            : 'border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-500 dark:hover:border-emerald-500',
                        {
                            'pointer-events-none opacity-80 border-emerald-500': navigatingTenantId === tenant.id,
                            'pointer-events-none opacity-50': navigatingTenantId && navigatingTenantId !== tenant.id
                        }
                    ]">

                    <!-- Overlay Loading Spesifik Tenant -->
                    <div v-if="navigatingTenantId === tenant.id"
                        class="absolute inset-0 z-10 bg-white/70 dark:bg-slate-800/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                        <Icon icon="lucide:loader-2"
                            class="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin" />
                        <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Memuat...</span>
                    </div>

                    <div>
                        <div class="flex items-start justify-between gap-3 mb-4">
                            <div
                                class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200/60 dark:border-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0 transition-transform">
                                <img v-if="tenant.logo" :src="tenant.logo" :alt="tenant.name"
                                    class="w-full h-full object-cover" />
                                <Icon v-else icon="lucide:building-2"
                                    class="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>

                            <div class="flex items-center gap-1.5">
                                <span
                                    class="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    {{ tenant.code }}
                                </span>

                                <button @click.stop="openModal(tenant)" title="Edit Logo / Cabang"
                                    class="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none">
                                    <Icon icon="lucide:square-pen" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <h3
                            class="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                            {{ tenant.name }}
                        </h3>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                            {{ tenant.address || 'Alamat cabang belum diatur' }}
                        </p>
                    </div>

                    <!-- Card Footer: Kapasitas Database Tersisa -->
                    <div
                        class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                        <div class="flex items-center gap-1.5">
                            <Icon icon="lucide:hard-drive" class="w-3.5 h-3.5 text-slate-400" />
                            <span>Size</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!isFetching && filteredTenants.length === 0"
                class="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <Icon icon="lucide:folder-open" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">Dataset tidak ditemukan.</p>
            </div>

        </div>

        <!-- Bottom Page Footer -->
        <footer
            class="max-w-6xl mx-auto w-full mt-12 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <ButtonLogout />
            <span>&copy; {{ new Date().getFullYear() }} System Dataset. All rights reserved.</span>
        </footer>

        <!-- Modal Buat / Edit Dataset -->
        <Teleport to="body">
            <div v-if="isModalOpen"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div
                    class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700">

                    <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Icon icon="lucide:database" class="w-4 h-4 text-emerald-600" />
                            {{ editingTenant ? 'Edit Dataset Cabang' : 'Buat Dataset Cabang Baru' }}
                        </h3>
                        <button @click="closeModal"
                            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <Icon icon="lucide:x" class="w-4 h-4" />
                        </button>
                    </div>

                    <form @submit.prevent="handleSubmit" class="mt-4 space-y-4">
                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Logo Cabang
                            </label>
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img v-if="form.logo" :src="form.logo" class="w-full h-full object-cover" />
                                    <Icon v-else icon="lucide:building-2" class="w-6 h-6 text-slate-400" />
                                </div>

                                <div class="flex-1 flex gap-2">
                                    <input v-model="form.logo" type="url" placeholder="https://domain.com/logo.png"
                                        class="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                    <label class="btn-action-slate cursor-pointer whitespace-nowrap">
                                        <Icon icon="lucide:upload" class="w-3.5 h-3.5" />
                                        <span>Upload</span>
                                        <input type="file" accept="image/*" class="hidden" @change="handleFileUpload" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nama Cabang / Perusahaan *
                            </label>
                            <input v-model="form.name" type="text" required placeholder="Contoh: Bengkel Print Surabaya"
                                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Kode Singkatan Cabang *
                            </label>
                            <input v-model="form.code" :disabled="(editingTenant ? true : false)" type="text" required
                                placeholder="Contoh: SBY-01"
                                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase" />
                        </div>

                        <div>
                            <label class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Alamat Singkat
                            </label>
                            <textarea v-model="form.address" rows="2" placeholder="Jl. Raya Gubeng No. 12, Surabaya"
                                class="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
                        </div>

                        <div
                            class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <button type="button" @click="closeModal" class="btn-action-slate">
                                Batal
                            </button>
                            <button type="submit" :disabled="isLoading"
                                :class="isLoading ? 'btn-action-disabled' : 'btn-action-emerald-500'">
                                <Icon v-if="isLoading" icon="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                                <span>{{ isLoading ? 'Menyimpan...' : 'Simpan Dataset' }}</span>
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </Teleport>

    </div>
</template>