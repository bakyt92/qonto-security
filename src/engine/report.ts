import type { PrepareResult, StoredPr } from './types.js';

export function shortSummary(stored: StoredPr): string {
  const fp = stored.integrity.fingerprint;
  const decision = stored.body.policy.decision.replace(/_/g, ' ');
  const dm = stored.body.data_mode === 'synthetic' ? 'synthetic' : 'sandbox';
  return `${fp} · ${decision} · ${dm}`;
}

export function renderReport(result: PrepareResult): string {
  const b = result.stored.body;
  return `
════════════════════════════════════════════════════════════════
  FINANCE PR ${b.pr_id}    [${b.data_mode.toUpperCase()}]
  Review before money moves.
════════════════════════════════════════════════════════════════

USER REQUEST (authority source: ${b.intent.request_source})
  "${b.intent.literal_request}"
  Intent: ${b.intent.intent_class} — ${b.intent.interpretation}

PROPOSED ACTION (exact, immutable)
  type:     ${b.proposed_action.action_type}
  invoice:  ${b.target.invoice_number} (${b.target.invoice_id.slice(0, 8)}…)
  supplier: ${b.proposed_action.parameters.supplier_name}
  amount:   ${b.critical_state_display.amount.value} ${b.critical_state_display.amount.currency}
  IBAN:     ${b.critical_state_display.iban_masked ?? 'none on file'}
  status:   ${b.critical_state_display.status}

EVIDENCE
${result.stored.body.evidence.map((e) => `  - ${e.object_type}${e.id ? ` (${e.id.slice(0, 8)}…)` : ''}`).join('\n')}
${result.stored.body.sanitization.detected_instructions.length ? '  ⚠ Untrusted document instructions detected\n' : ''}

RISK SIGNALS (weighted, advisory — never authorize action)
${b.signals.map((s) => `  - ${s.id.padEnd(30)} w=${s.weight.toFixed(2)}  risk=${s.status === 'observed' ? s.risk.toFixed(2) : s.status}  ${s.reason}`).join('\n')}
  observed_risk=${b.risk.observed_risk === null ? 'not scored' : b.risk.observed_risk.toFixed(3)}  coverage=${Math.round(b.risk.coverage * 100)}%  band=${b.risk.band.replace(/_/g, ' ')}

HARD GATES (must all pass to proceed — a score cannot override these)
${b.gates.map((g) => `  [${g.status === 'pass' ? 'PASS' : g.status === 'fail' ? 'FAIL' : 'UNKNOWN'}] ${g.id}`).join('\n')}

POLICY DECISION
  ${result.decision.toUpperCase()}   route: ${b.policy.reviewer_route.replace(/_/g, ' ')}
  policy: ${b.policy.policy_id}@${b.policy.policy_version}

INTEGRITY
  sha256:      ${result.stored.integrity.hash}
  fingerprint: ${result.stored.integrity.fingerprint}
  expires_at:  ${b.expires_at}

TO APPROVE (exact syntax; binds approval to this PR + fingerprint):
  Approve Finance PR ${b.pr_id}, fingerprint ${result.stored.integrity.fingerprint}

Finance PR approval only lets a proposal REACH Qonto.
Qonto permissions, native approval, and SCA still apply.
════════════════════════════════════════════════════════════════
`;
}
