import { defineStore } from 'pinia';

export interface Company {
    id: string;
    name: string;
    code: string;
    tenantCount?: number;
}

export const useCompanyStore = defineStore('company', {
    state: () => ({
        selectedCompany: JSON.parse(sessionStorage.getItem('selectedCompany') || 'null') as Company | null,
    }),
    actions: {
        setSelectedCompany(company: Company) {
            this.selectedCompany = company;
            sessionStorage.setItem('selectedCompany', JSON.stringify(company));
        },
        clearCompany() {
            this.selectedCompany = null;
            sessionStorage.removeItem('selectedCompany');
        }
    }
});