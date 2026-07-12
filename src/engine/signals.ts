import { POLICY } from './policy.js';
import type { Evidence, IntentResult, RiskBand, RiskSummary, Signal } from './types.js';

function evalPossibleDuplicate(evidence: Evidence, _intent: IntentResult): Signal {
  const { invoice, supplier_history: history } = evidence;
  let risk = 0;
  let status: 'observed' | 'not_applicable' = 'observed';

  const exact = history.find((h) => h.invoice_number === invoice.invoice_number);
  if (exact) risk = 1.0;
  else {
    const same_amount_date = history.find(
      (h) =>
        h.amount.value === invoice.amount.value &&
        h.amount.currency === invoice.amount.currency &&
        h.issue_date &&
        invoice.issue_date &&
        Math.abs(new Date(h.issue_date).getTime() - new Date(invoice.issue_date).getTime()) < 86400000,
    );
    if (same_amount_date) risk = 0.7;
    else {
      const fuzzy = history.find(
        (h) => Math.abs(parseFloat(h.amount.value) - parseFloat(invoice.amount.value)) < 10,
      );
      if (fuzzy) risk = 0.4;
    }
  }

  return {
    id: 'possible_duplicate',
    status,
    risk,
    weight: POLICY.signal_weights.possible_duplicate,
    reason: risk > 0 ? `Possible duplicate with risk ${risk.toFixed(2)}` : 'No duplicate candidate found in supplier history.',
    evidence_refs: ['supplier_history'],
  };
}

function evalSupplierIbanDrift(evidence: Evidence, _intent: IntentResult): Signal {
  const { invoice, known_supplier_ibans } = evidence;
  let risk = 0;
  let status: 'observed' | 'not_applicable' = 'observed';

  if (!invoice.iban) {
    status = 'not_applicable';
  } else if (known_supplier_ibans.length === 0) {
    risk = 0.4;
  } else if (known_supplier_ibans.includes(invoice.iban)) {
    risk = 0.0;
  } else {
    risk = 0.7;
  }

  return {
    id: 'supplier_iban_drift',
    status,
    risk,
    weight: POLICY.signal_weights.supplier_iban_drift,
    reason:
      status === 'not_applicable'
        ? 'Invoice IBAN matches a previously used IBAN for this supplier.'
        : status === 'observed' && risk === 0.4
          ? 'New supplier/no known IBAN history.'
          : risk > 0
            ? 'Supplier IBAN differs from history AND a corroborating anomaly (elevated amount / document instruction) is present.'
            : 'No IBAN drift observed.',
    evidence_refs: ['invoice.iban', 'supplier_history'],
  };
}

function evalUnusualAmount(evidence: Evidence, _intent: IntentResult): Signal {
  const { invoice, supplier_history: history } = evidence;
  if (history.length < 4) {
    return {
      id: 'unusual_amount',
      status: 'insufficient_data',
      risk: 0,
      weight: POLICY.signal_weights.unusual_amount,
      reason: `Only ${history.length} prior amount(s) for this supplier (need 4); baseline unknown.`,
      evidence_refs: ['supplier_history'],
    };
  }

  const amounts = history.map((h) => parseFloat(h.amount.value));
  const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
  const current = parseFloat(invoice.amount.value);
  const z = Math.abs((current - median) / (median || 1));

  let risk = 0;
  if (z <= 2) risk = 0;
  else if (z <= 3) risk = 0.5;
  else risk = 1.0;

  return {
    id: 'unusual_amount',
    status: 'observed',
    risk,
    weight: POLICY.signal_weights.unusual_amount,
    reason: `Z-score ${z.toFixed(1)} (median ${median.toFixed(2)}, current ${current.toFixed(2)})`,
    evidence_refs: ['invoice.amount', 'supplier_history'],
  };
}

function evalEvidenceGap(evidence: Evidence, _intent: IntentResult): Signal {
  let gap = 0;
  if (!evidence.invoice.attachment_text) gap += 0.3;
  if (!evidence.invoice.matched_transaction_ids.length) gap += 0.38;

  return {
    id: 'evidence_gap_risk',
    status: 'observed',
    risk: Math.min(gap, 1),
    weight: POLICY.signal_weights.evidence_gap_risk,
    reason: `Optional evidence gaps: ${evidence.unavailable_fields.join(', ')}`,
    evidence_refs: evidence.unavailable_fields,
  };
}

function evalUntrustedInstruction(_evidence: Evidence, intent: IntentResult): Signal {
  const detected = intent.detected_instructions;
  let risk = 0;
  if (detected.length > 0) {
    const hasExplicit = detected.some((d) => /approve|pay|execute|ignore/i.test(d));
    risk = hasExplicit ? 1.0 : 0.5;
  }

  return {
    id: 'untrusted_instruction_indicator',
    status: 'observed',
    risk,
    weight: POLICY.signal_weights.untrusted_instruction_indicator,
    reason:
      detected.length > 0
        ? `Detected ${detected.length} instruction phrase(s): ${detected.slice(0, 3).join('; ')}`
        : 'No instruction-like text detected in document content.',
    evidence_refs: ['attachment_text', 'intent.detected_instructions'],
  };
}

export function evaluateSignals(evidence: Evidence, intent: IntentResult): { signals: Signal[]; risk: RiskSummary } {
  const signals = [
    evalPossibleDuplicate(evidence, intent),
    evalSupplierIbanDrift(evidence, intent),
    evalUnusualAmount(evidence, intent),
    evalEvidenceGap(evidence, intent),
    evalUntrustedInstruction(evidence, intent),
  ];

  // Aggregate
  const observed = signals.filter((s) => s.status === 'observed');
  const total_weight = observed.reduce((sum, s) => sum + s.weight, 0);
  const observed_risk =
    total_weight > 0 ? observed.reduce((sum, s) => sum + s.risk * s.weight, 0) / total_weight : null;
  const applicable_weight = signals.reduce((sum, s) => sum + (s.status !== 'not_run' ? s.weight : 0), 0);
  const coverage = applicable_weight > 0 ? total_weight / applicable_weight : 0;

  let band: RiskBand;
  if (coverage === 0) band = 'not_scored';
  else if (observed_risk === null) band = 'not_scored';
  else if (observed_risk < POLICY.bands.low) band = 'low_observed_risk';
  else if (observed_risk >= POLICY.bands.high) band = 'high_observed_risk';
  else band = 'elevated_observed_risk';

  return { signals, risk: { observed_risk, coverage, band } };
}
