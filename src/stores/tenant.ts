import { defineStore } from 'pinia';

export interface Tenant {
    id: string;
    name: string;
    code: string;
    dbName?: string;
    logo?: string;
    address?: string;
    dbSizeMB?: number;
    maxDbSizeMB?: number;
}


export const useTenantStore = defineStore('tenant', {
    state: () => ({
        selectedTenant: JSON.parse(localStorage.getItem('selectedTenant') || 'null') as Tenant | null,
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