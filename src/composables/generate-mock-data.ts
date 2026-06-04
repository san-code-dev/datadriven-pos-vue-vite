// ==========================================
// FUNCTION UTILITY UNTUK GENERATE DATA DINAMIS
// ==========================================
export function generateDynamicData(schema: any[], count: number = 5): any[] {
    const dataList: any[] = [];

    for (let i = 1; i <= count; i++) {
        const row: any = {};

        schema.forEach(field => {
            switch (field.type) {
                case 'display':
                    if (field.primary) {
                        row[field.key] = i;
                    } else {
                        row[field.key] = field.key === 'action'
                            ? ['create', 'edit', 'delete'][i % 3]
                            : `${field.label} Mock ${i}`;
                    }
                    break;

                case 'text':
                    row[field.key] = `${field.label} ${String.fromCharCode(64 + i)}`;
                    break;

                case 'number':
                case 'currency':
                    row[field.key] = i * 50;
                    break;

                case 'email':
                    row[field.key] = `${field.key}${i}@example.com`.toLowerCase();
                    break;

                case 'date':
                    row[field.key] = `2026-01-${String(i).padStart(2, '0')}`;
                    break;

                case 'relation':
                    const entityName = field.relation.entity;
                    const valueField = field.relation.valueField;
                    const displayField = field.relation.displayField;

                    row[field.key] = {
                        [valueField]: i,
                        [displayField]: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} ${String.fromCharCode(64 + i)}`
                    };
                    break;

                case 'json':
                    if (field.key === 'oldData') {
                        row[field.key] = i === 1 ? null : { id: i, info: `Old Mock Data ${i}` };
                    } else {
                        row[field.key] = i === 3 ? null : { id: i, info: `New Mock Data ${i}` };
                    }
                    break;

                default:
                    row[field.key] = null;
            }
        });

        dataList.push(row);
    }

    return dataList;
}