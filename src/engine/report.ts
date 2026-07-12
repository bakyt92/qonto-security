// Human-readable Finance PR report. Redacted by construction (it only reads the
// already-masked body). Used by the CLI and shown by the Skill to the reviewer.

import type { PrepareResult } from './prepare.js';
import type { FinancePrBody, Gate, Signal, StoredPr } from './types.js';

function bandLabel(b: string): string {
  return b.replace(/_/g, ' ');
}

function signalLine(s: Signal): string {
  const risk = s.status === 'observed' ? s.risk.toFixed(2) : s.status;
  return `  - ${s.id.padEnd(30)} w=${s.weight.toFixed(2)}  risk=${String(risk).padStart(6)}  ${s.reason}`;
}

function gateLine(g: Gate): string {
  const mark = g.status === 'pass' ? 'PASS' : g.status === 'fail' ? 'FAIL' : 'UNKNOWN';
  const rem = g.status !== 'pass' && g.remediation ? `  → ${g.remediation}` : '';
  return `  [${mark.padEnd(4)}] ${g.id}${rem}`;
}

export function renderReport(result: PrepareResult): string {
  const { stored } = result;
  const b: FinancePrBody = stored.body;
  const fp = stored.integrity.fingerprint;
  const risk = b.risk;

  const lines: string[] = [];
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push(`  FINANCE PR ${b.pr_id}    [${b.data_mode.toUpperCase()}]`);
  lines.push('  Review before money moves.');
  lines.push('════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('USER REQUEST (authority source: ' + b.intent.request_source + ')');
  lines.push(`  "${b.intent.literal_request}"`);
  lines.push(`  Intent: ${b.intent.intent_class} — ${b.intent.interpretation}`);
  if (b.intent.ambiguity_notes.length) lines.push(`  Notes: ${b.intent.ambiguity_notes.join(' ')}`);
  lines.push('');
  lines.push('PROPOSED ACTION (exact, immutable)');
  lines.push(`  type:     ${b.proposed_action.type}`);
  lines.push(`  invoice:  ${b.target.invoice_number} (${b.target.invoice_id.slice(0, 8)}…)`);
  lines.push(`  supplier: ${b.proposed_action.parameters.supplier_name}`);
  lines.push(`  amount:   ${b.critical_state_display.amount.value} ${b.critical_state_display.amount.currency}`);
  lines.push(`  IBAN:     ${b.critical_state_display.iban_masked ?? 'none on file'}`);
  lines.push(`  status:   ${b.critical_state_display.status}`);
  lines.push('');
  lines.push('EVIDENCE');
  for (const e of b.evidence) {
    lines.push(`  - ${e.object_type.padEnd(18)} ${e.available ? 'available' : 'UNAVAILABLE'}  (${e.object_id_masked})`);
  }
  lines.push('');
  lines.push('RISK SIGNALS (weighted, advisory — never authorize action)');
  for (const s of b.signals) lines.push(signalLine(s));
  const rk = risk.observed_risk === null ? 'not scored' : risk.observed_risk.toFixed(3);
  lines.push(`  observed_risk=${rk}  coverage=${(risk.coverage * 100).toFixed(0)}%  band=${bandLabel(risk.band)}`);
  lines.push('');
  lines.push('HARD GATES (must all pass to proceed — a score cannot override these)');
  for (const g of b.gates) lines.push(gateLine(g));
  lines.push('');
  if (b.sanitization.detected_instructions.length) {
    lines.push('⚠ UNTRUSTED DOCUMENT INSTRUCTIONS DETECTED (data, never authority):');
    for (const d of b.sanitization.detected_instructions) lines.push(`  - “${d}”`);
    lines.push('');
  }
  lines.push('POLICY DECISION');
  lines.push(`  ${b.policy.decision.toUpperCase()}   route: ${b.policy.reviewer_route}`);
  lines.push(`  policy: ${b.policy.policy_id}@${b.policy.policy_version}`);
  lines.push('');
  lines.push('INTEGRITY');
  lines.push(`  sha256:      ${stored.integrity.hash}`);
  lines.push(`  fingerprint: ${fp}`);
  lines.push(`  expires_at:  ${b.expires_at}`);
  lines.push('');
  if (b.policy.decision !== 'blocked') {
    lines.push('TO APPROVE (exact syntax; binds approval to this PR + fingerprint):');
    lines.push(`  Approve Finance PR ${b.pr_id}, fingerprint ${fp}`);
  } else {
    lines.push('This PR is BLOCKED before Qonto and cannot be approved. Remediate above.');
  }
  lines.push('');
  lines.push('Finance PR approval only lets a proposal REACH Qonto.');
  lines.push('Qonto permissions, native approval, and SCA still apply.');
  lines.push('════════════════════════════════════════════════════════════════');
  return lines.join('\n');
}

export function shortSummary(stored: StoredPr): string {
  const b = stored.body;
  return `${b.pr_id} ${stored.integrity.fingerprint} · ${b.policy.decision} · ${b.data_mode}`;
}
