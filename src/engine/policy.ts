import { digest } from './canonical.js';

export const POLICY = {
  policy_id: 'finance-pr.demo',
  policy_version: '2026-07-12',
  pr_ttl_minutes: 60,
  signal_weights: {
    possible_duplicate: 0.3,
    supplier_iban_drift: 0.3,
    unusual_amount: 0.2,
    evidence_gap_risk: 0.1,
    untrusted_instruction_indicator: 0.1,
  },
  min_coverage: 0.8,
  material_signal_risk: 0.5,
  bands: { low: 0.25, high: 0.7 },
  high_value_amount: 10000,
};

export function policyDigest(): string {
  return digest(
    POLICY.policy_id,
    POLICY.policy_version,
    String(POLICY.pr_ttl_minutes),
    JSON.stringify(POLICY.signal_weights),
  );
}
