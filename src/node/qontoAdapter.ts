import type { Evidence } from '../engine/index.js';
export function evidenceFromQonto(_bundle: any): Evidence {
  return { data_mode: 'qonto_sandbox', organization: { id: 'org', name: 'org', legal_country: 'FR' }, membership: { id: 'mem', role: 'owner' }, invoice: {} as any, supplier_history: [], known_supplier_ibans: [], observed_at: new Date().toISOString(), unavailable_fields: [] };
}
