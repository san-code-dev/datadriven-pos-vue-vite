<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import api from '@/lib/axios';
import { useCompanyStore } from '@/stores/company';
import { useTenantStore } from '@/stores/tenant';
interface Company {
    id: string;
    name: string;
    code: string;
    tenantCount?: number;
}

const companyStore = useCompanyStore();
const router = useRouter();
const step = ref<1 | 2>(1);
const companies = ref<Company[]>([]);
const isFetching = ref(false);
const isLoading = ref(false);
const selectedIndex = ref<number>(-1);
const showCreateForm = ref(false);
const tenantStore = useTenantStore()

// Template Refs untuk Auto Focus Kedua Field
const nameInputRef = ref<HTMLInputElement | null>(null);
const codeInputRef = ref<HTMLInputElement | null>(null);

const form = ref({
    name: '',
    code: ''
});

const SERVICE_ENDPOINT = '/company';

// Fungsi fokus otomatis sesuai step yang aktif
const focusActiveInput = async () => {
    await nextTick();
    if (step.value === 1) {
        nameInputRef.value?.focus();
    } else if (step.value === 2) {
        codeInputRef.value?.focus();
    }
};

// Auto focus setiap kali step atau visibilitas form berubah
watch([step, showCreateForm], () => {
    if (showCreateForm.value) {
        focusActiveInput();
    }
});

const fetchCompanies = async () => {
    isFetching.value = true;
    try {
        const response = await api.get(`${SERVICE_ENDPOINT}/get-all`, { includeTenant: false });
        companies.value = Array.isArray(response.data)
            ? response.data
            : response.data?.data || [];

        if (companies.value.length > 0) {
            selectedIndex.value = 0;
            showCreateForm.value = false;
        } else {
            showCreateForm.value = true;
            focusActiveInput();
        }
    } catch (error) {
        console.error('Gagal mengambil data perusahaan:', error);
    } finally {
        isFetching.value = false;
    }
};

const selectCompany = (company: Company) => {
    tenantStore.clearTenant()
    companyStore.setSelectedCompany(company);
    router.push('/dataset');
};

const handleKeyDown = (e: KeyboardEvent) => {
    if (showCreateForm.value || companies.value.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex.value = (selectedIndex.value + 1) % companies.value.length;
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex.value = (selectedIndex.value - 1 + companies.value.length) % companies.value.length;
    } else if (e.key === 'Enter') {
        if (selectedIndex.value >= 0 && selectedIndex.value < companies.value.length) {
            e.preventDefault();
            selectCompany(companies.value[selectedIndex.value]);
        }
    }
};

const goToStep2 = () => {
    if (form.value.name.trim()) {
        step.value = 2;
        focusActiveInput(); // Memastikan fokus langsung ke field ke-2
    }
};

const resetFormAndHide = () => {
    form.value = { name: '', code: '' };
    step.value = 1;
    if (companies.value.length > 0) {
        showCreateForm.value = false;
    }
};

const handleSubmit = async () => {
    if (!form.value.name || !form.value.code) return;

    isLoading.value = true;
    try {
        const response = await api.post(`${SERVICE_ENDPOINT}/create`, {
            name: form.value.name,
            code: form.value.code
        }, { includeTenant: false });

        const createdCompany = response.data?.data || response.data;

        if (createdCompany) {
            companyStore.setSelectedCompany(createdCompany);
        }
        router.push('/dataset');
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Gagal membuat perusahaan baru.';
        alert(msg);
        console.error('Gagal membuat perusahaan:', error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchCompanies();
    window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
    <div
        class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
        <h6 class="flex justify-center items-center flex-col mb-4">
            <Icon icon="mdi:company" class="text-4xl text-emerald-500 mb-2" />
            <span class="text-xl font-bold tracking-wide">Company</span>
        </h6>

        <!-- FORM TAMBAH PERUSAHAAN -->
        <template v-if="showCreateForm">
            <!-- Step Indicator Mini -->
            <div class="flex items-center gap-2 mb-8">
                <div class="h-1.5 rounded-full transition-all duration-300"
                    :class="step === 1 ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-800'"></div>
                <div class="h-1.5 rounded-full transition-all duration-300"
                    :class="step === 2 ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-800'"></div>
            </div>

            <div class="w-full max-w-xl min-h-[200px] flex items-center justify-center relative">
                <Transition name="slide" mode="out-in" @after-enter="focusActiveInput">

                    <!-- TAHAP 1: Nama Perusahaan -->
                    <div v-if="step === 1" key="step1" class="w-full">
                        <form @submit.prevent="goToStep2" class="space-y-6 text-center">
                            <div>
                                <label class="block text-slate-400 text-sm font-medium mb-3">
                                    Step 1: Nama Perusahaan Baru
                                </label>
                                <input ref="nameInputRef" v-model="form.name" type="text"
                                    placeholder="Ketik Nama Perusahaan..."
                                    class="w-full bg-transparent border-b-2 border-slate-800 focus:border-emerald-500 text-2xl sm:text-4xl font-bold text-center py-4 text-white placeholder-slate-700 focus:outline-none transition-colors" />
                            </div>

                            <div class="flex items-center justify-center gap-3">
                                <button v-if="companies.length > 0" type="button" @click="resetFormAndHide"
                                    class="px-5 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 text-sm font-semibold transition-all">
                                    Batal
                                </button>
                                <button type="submit" :disabled="!form.name.trim()"
                                    class="px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10">
                                    <span>Lanjut</span>
                                    <Icon icon="lucide:arrow-right" class="w-4 h-4" />
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- TAHAP 2: Kode Perusahaan -->
                    <div v-else key="step2" class="w-full">
                        <form @submit.prevent="handleSubmit" class="space-y-6 text-center">
                            <div>
                                <label class="block text-slate-400 text-sm font-medium mb-3">
                                    Step 2: Singkatan / Kode
                                </label>
                                <input ref="codeInputRef" v-model="form.code" type="text" required
                                    placeholder="Contoh: BPI"
                                    class="w-full bg-transparent border-b-2 border-slate-800 focus:border-emerald-500 text-2xl sm:text-4xl font-bold uppercase text-center py-4 text-emerald-400 placeholder-slate-700 focus:outline-none transition-colors font-mono tracking-wider" />
                            </div>

                            <div class="flex items-center justify-center gap-3">
                                <button type="button" @click="step = 1"
                                    class="p-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                                    title="Kembali">
                                    <Icon icon="lucide:arrow-left" class="w-5 h-5" />
                                </button>

                                <button type="submit" :disabled="isLoading || !form.code.trim()"
                                    class="px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10">
                                    <Icon v-if="isLoading" icon="lucide:loader-2" class="w-4 h-4 animate-spin" />
                                    <Icon v-else icon="lucide:check" class="w-4 h-4" />
                                    <span>{{ isLoading ? 'Simpan...' : 'Selesai & Simpan' }}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                </Transition>
            </div>
        </template>

        <!-- LIST PERUSAHAAN TERDAFTAR -->
        <div v-else class="w-full max-w-xl">
            <div class="flex items-center justify-between mb-4 px-2">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Perusahaan
                </span>

                <button @click="showCreateForm = true"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all">
                    <Icon icon="lucide:plus" class="w-4 h-4" />
                    <span>Tambah Perusahaan</span>
                </button>
            </div>

            <div v-if="isFetching" class="py-6 text-center">
                <Icon icon="lucide:loader-2" class="w-5 h-5 text-emerald-500 animate-spin mx-auto" />
            </div>

            <div v-else-if="companies.length > 0" class="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <div v-for="(item, index) in companies" :key="item.id" @click="selectCompany(item)"
                    @mouseenter="selectedIndex = index"
                    class="flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer"
                    :class="selectedIndex === index
                        ? 'bg-slate-900 border-emerald-500/50 text-white shadow-md'
                        : 'bg-slate-950/50 border-slate-900 text-slate-400 hover:border-slate-800'">
                    <div class="flex items-center gap-3 truncate">
                        <div class="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center font-mono text-xs font-bold"
                            :class="selectedIndex === index ? 'text-emerald-400 border border-emerald-500/30' : 'text-slate-500'">
                            {{ item.code }}
                        </div>
                        <span class="font-medium text-sm truncate">{{ item.name }}</span>
                    </div>

                    <div class="flex items-center gap-2">
                        <span v-if="selectedIndex === index" class="text-xs text-emerald-400 flex items-center gap-1">
                            Tekan Enter
                            <Icon icon="lucide:corner-down-left" class="w-3.5 h-3.5" />
                        </span>
                        <Icon icon="lucide:chevron-right" class="w-4 h-4 text-slate-600" />
                    </div>
                </div>
            </div>

            <div class="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
                Gunakan <kbd
                    class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">↑</kbd>
                <kbd
                    class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">↓</kbd>
                dan <kbd
                    class="px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300 font-mono text-[10px]">Enter</kbd>
            </div>
        </div>
        <!-- Bottom Page Footer -->
        <footer
            class="absolute  bottom-0 max-w-6xl mx-auto w-full mt-12 pt-6 pb-12 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <ButtonLogout />
            <span>&copy; {{ new Date().getFullYear() }} System Dataset. All rights reserved.</span>
        </footer>
    </div>

</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
    opacity: 0;
    transform: translateX(50px);
}

.slide-leave-to {
    opacity: 0;
    transform: translateX(-50px);
}

.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #1e293b;
    border-radius: 9999px;
}
</style>