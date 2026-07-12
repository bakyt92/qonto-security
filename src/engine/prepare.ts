import { hashBody, fingerprintFromHash } from './canonical.js';
import { criticalStateDigest, criticalStateDisplay } from './critical.js';
import { classifyIntent } from './intent.js';
import { evaluateSignals } from './signals.js';
import { prepareGates, allPass } from './gates.js';
import { POLICY, policyDigest } from './policy.js';
import { HeuristicReviewer } from './reviewer.js';
import type { Clock } from './clock.js';
import { EventLog } from './events.js';
import { addMinutes } from './clock.js';
import type { Evidence, FinancePrBody, PolicyDecision, PrepareResult, ReviewerRoute, StoredPr, UserRequest } from './types.js';

export function prepare(input: {
  request: UserRequest;
  evidence: Evidence;
  clock: Clock;
  events: EventLog;
  prId?: string;
}): PrepareResult {
  const { request, evidence, clock, events, prId } = input;
  const now = clock.now();

  // Classify intent
  const intent = classifyIntent(request, evidence.invoice.attachment_text);
  events.emit('intent_classified', prId || 'pending', { intent_class: intent.intent_class });

  // Evaluate signals
  const { signals, risk } = evaluateSignals(evidence, intent);
  events.emit('signals_evaluated', prId || 'pending', { observed_risk: risk.observed_risk, coverage: risk.coverage });

  // Evaluate gates
  const gates = prepareGates(evidence, intent);
  events.emit('gates_evaluated_prepare', prId || 'pending', {
    pass_count: gates.filter((g) => g.status === 'pass').length,
  });

  // Policy decision
  let decision: PolicyDecision = 'ready_for_finance_review';
  let reviewer_route: ReviewerRoute = 'finance_reviewer';

  if (!allPass(gates)) {
    decision = 'blocked';
    reviewer_route = 'finance_reviewer';
  } else if (risk.coverage < POLICY.min_coverage || (risk.observed_risk ?? 0) >= POLICY.material_signal_risk) {
    decision = 'manual_review_required';
    reviewer_route = 'designated_approver';
  }

  // Build immutable body
  const body: FinancePrBody = {
    schema_version: '1.0',
    pr_id: prId || `FPR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    data_mode: evidence.data_mode,
    created_at: now,
    expires_at: addMinutes(now, POLICY.pr_ttl_minutes),
    intent: {
      literal_request: request.text,
      request_source: request.source,
      intent_class: intent.intent_class,
      interpretation: intent.interpretation,
      ambiguity_notes: intent.ambiguity_notes,
    },
    target: {
      organization_id: evidence.organization.id,
      invoice_id: evidence.invoice.id,
      invoice_number: evidence.invoice.invoice_number,
    },
    proposed_action: {
      action_type: 'prepare_payment_review',
      parameters: {
        supplier_name: evidence.invoice.supplier_name,
        supplier_id: evidence.invoice.supplier_id,
        amount: evidence.invoice.amount as unknown,
        iban: evidence.invoice.iban,
        invoice_number: evidence.invoice.invoice_number,
      },
    },
    critical_state_digest: criticalStateDigest(evidence.invoice),
    critical_state_display: criticalStateDisplay(evidence.invoice),
    evidence: [
      { object_type: 'supplier_invoice', id: evidence.invoice.id, fetched_at: evidence.observed_at },
      { object_type: 'organization', id: evidence.organization.id, fetched_at: evidence.observed_at },
    ],
    signals,
    risk,
    gates,
    policy: {
      policy_id: POLICY.policy_id,
      policy_version: POLICY.policy_version,
      policy_digest: policyDigest(),
      decision,
      reviewer_route,
    },
    sanitization: {
      detected_instructions: intent.detected_instructions,
    },
  };

  // Hash and store
  const hash = hashBody(body);
  const fingerprint = fingerprintFromHash(hash);
  const stored: StoredPr = {
    body,
    integrity: { algorithm: 'sha256', hash, fingerprint },
  };

  events.emit('finance_pr_prepared', body.pr_id, {
    fingerprint,
    decision,
    reviewer_route,
  });

  // Optional second review
  const reviewer = new HeuristicReviewer();
  const amountObj = body.proposed_action.parameters.amount as any;
  const review = reviewer.review({
    body,
    intent_ambiguous: intent.intent_class === 'AMBIGUOUS',
    high_value: amountObj?.value ? parseFloat(amountObj.value) >= POLICY.high_value_amount : false,
  });

  return { stored, intent, signals, risk, gates, decision, reviewer_route, review };
}
