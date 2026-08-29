import { defineStore } from 'pinia';

interface Tenant {
    id: string;
    name: string;
    dbName: string;
    code: string;
    address?: string;
    createdAt?: string;
}

export const useTenantStore = defineStore('tenant', {
    state: () => ({
        selectedTenant: JSON.parse(localStorage.getItem('selectedTenant') || 'null') as Tenant | null,
        tenants: [] as Tenant[],
    }),
    actions: {
        setSelectTenant(tenant: Tenant) {
            this.selectedTenant = tenant;
            localStorage.setItem('selectedTenant', JSON.stringify(tenant));
        },
        clearTenant() {
            this.selectedTenant = null;
            localStorage.removeItem('selectedTenant');
        }
    }
});