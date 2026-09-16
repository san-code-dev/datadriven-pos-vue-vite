import { defineStore } from 'pinia';

export interface Tenant {
    id: string;
    name: string;
    code: string;
    dbName?: string;
    logo?: string;
    address?: string;
}

export const useTenantStore = defineStore('tenant', {
    state: () => ({
        // Ubah localStorage menjadi sessionStorage
        selectedTenant: JSON.parse(sessionStorage.getItem('selectedTenant') || 'null') as Tenant | null,
    }),
    actions: {
        setSelectTenant(tenant: Tenant) {
            this.selectedTenant = tenant;
            // Ubah localStorage menjadi sessionStorage
            sessionStorage.setItem('selectedTenant', JSON.stringify(tenant));
        },
        clearTenant() {
            this.selectedTenant = null;
            // Ubah localStorage menjadi sessionStorage
            sessionStorage.removeItem('selectedTenant');
        }
    }
});