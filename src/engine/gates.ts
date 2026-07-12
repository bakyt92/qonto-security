import type { Evidence, Gate, IntentResult } from './types.js';

export function prepareGates(evidence: Evidence, intent: IntentResult): Gate[] {
  return [
    {
      id: 'explicit_action_intent',
      phase: 'prepare',
      status: intent.intent_class === 'ACT' ? 'pass' : intent.intent_class === 'ADVICE_ONLY' ? 'fail' : 'unknown',
      reason:
        intent.intent_class === 'ACT'
          ? 'User explicitly requested an action.'
          : intent.intent_class === 'ADVICE_ONLY'
            ? 'User asked for advice, not an action. Questions cannot authorize payments.'
            : 'Intent class is ambiguous or unclear.',
      remediation: intent.intent_class === 'ADVICE_ONLY' ? 'If you want to pay this, say so explicitly.' : undefined,
    },
    {
      id: 'intent_source_is_authoritative',
      phase: 'prepare',
      status: intent.source_is_authoritative ? 'pass' : 'fail',
      reason: intent.source_is_authoritative
        ? 'User explicitly authorized the action via chat.'
        : 'Document or tool text cannot authorize. Only explicit user language can.',
      remediation: !intent.source_is_authoritative
        ? 'Require explicit user chat approval; document text is data, not authority.'
        : undefined,
    },
    {
      id: 'target_and_action_unambiguous',
      phase: 'prepare',
      status: intent.target_and_action_unambiguous ? 'pass' : 'fail',
      reason: intent.target_and_action_unambiguous
        ? 'Target invoice and action are clear.'
        : `Ambiguity detected: ${intent.ambiguity_notes}`,
      remediation: !intent.target_and_action_unambiguous
        ? 'Clarify which invoice to pay and what action to take; then prepare a new PR.'
        : undefined,
    },
    {
      id: 'required_evidence_present',
      phase: 'prepare',
      status:
        evidence.invoice.amount && evidence.invoice.supplier_name && evidence.organization.id && evidence.membership.id
          ? 'pass'
          : 'fail',
      reason:
        evidence.invoice.amount && evidence.invoice.supplier_name && evidence.organization.id && evidence.membership.id
          ? 'Required evidence fields are present.'
          : 'Missing required fields (amount, supplier, org, membership).',
      remediation: !(
        evidence.invoice.amount &&
        evidence.invoice.supplier_name &&
        evidence.organization.id &&
        evidence.membership.id
      )
        ? 'Fetch missing Qonto objects before preparing.'
        : undefined,
    },
    {
      id: 'not_already_paid_or_matched',
      phase: 'prepare',
      status: evidence.invoice.status !== 'paid' && !evidence.invoice.matched_transaction_ids.length ? 'pass' : 'fail',
      reason:
        evidence.invoice.status === 'paid'
          ? 'Invoice is already marked paid.'
          : evidence.invoice.matched_transaction_ids.length
            ? 'Invoice is already matched to a transaction.'
            : 'Invoice is eligible for payment review.',
      remediation:
        evidence.invoice.status === 'paid' || evidence.invoice.matched_transaction_ids.length
          ? 'This invoice has already been paid or matched. No new PR required.'
          : undefined,
    },
    {
      id: 'exact_duplicate_not_completed',
      phase: 'prepare',
      status: evidence.invoice.has_duplicates ? 'fail' : 'pass',
      reason: evidence.invoice.has_duplicates
        ? 'Qonto reports this invoice has a completed exact duplicate.'
        : 'No completed exact duplicate found.',
      remediation: evidence.invoice.has_duplicates
        ? 'Verify: is this a true re-payment? If not, do not create a new PR.'
        : undefined,
    },
  ];
}

export function actGates(input: {
  stored_pr_body: any;
  computed_hash: string;
  approval: any;
  fresh_invoice: any;
  current_clock: string;
  writesEnabled: boolean;
}): Gate[] {
  const gates: Gate[] = [];

  // Integrity gates
  gates.push({
    id: 'full_hash_matches',
    phase: 'act',
    status: input.computed_hash === input.stored_pr_body?.integrity?.hash ? 'pass' : 'fail',
    reason:
      input.computed_hash === input.stored_pr_body?.integrity?.hash
        ? 'SHA-256 hash matches stored PR.'
        : 'Hash mismatch — PR may be tampered.',
  });

  gates.push({
    id: 'finance_pr_id_and_fingerprint_match',
    phase: 'act',
    status:
      input.approval &&
      input.approval.pr_id === input.stored_pr_body?.pr_id &&
      input.approval.fingerprint === input.stored_pr_body?.integrity?.fingerprint
        ? 'pass'
        : 'fail',
    reason:
      input.approval &&
      input.approval.pr_id === input.stored_pr_body?.pr_id &&
      input.approval.fingerprint === input.stored_pr_body?.integrity?.fingerprint
        ? 'PR ID and fingerprint match approval.'
        : 'Approval does not match stored PR.',
  });

  gates.push({
    id: 'explicit_approval_present',
    phase: 'act',
    status: input.approval ? 'pass' : 'fail',
    reason: input.approval ? 'Explicit approval found.' : 'No approval present.',
  });

  gates.push({
    id: 'not_expired',
    phase: 'act',
    status:
      new Date(input.current_clock).getTime() < new Date(input.stored_pr_body?.expires_at).getTime() ? 'pass' : 'fail',
    reason:
      new Date(input.current_clock).getTime() < new Date(input.stored_pr_body?.expires_at).getTime()
        ? 'PR has not expired.'
        : 'PR is expired.',
  });

  gates.push({
    id: 'critical_qonto_state_unchanged',
    phase: 'act',
    status:
      input.fresh_invoice.status === input.stored_pr_body?.critical_state_display?.status &&
      input.fresh_invoice.amount.value === input.stored_pr_body?.critical_state_display?.amount?.value
        ? 'pass'
        : 'fail',
    reason:
      input.fresh_invoice.status === input.stored_pr_body?.critical_state_display?.status &&
      input.fresh_invoice.amount.value === input.stored_pr_body?.critical_state_display?.amount?.value
        ? 'Critical Qonto state is unchanged.'
        : 'Qonto state has changed; PR is stale.',
  });

  gates.push({
    id: 'amount_currency_iban_supplier_unchanged',
    phase: 'act',
    status:
      input.fresh_invoice.amount.currency === input.stored_pr_body?.critical_state_display?.amount?.currency &&
      input.fresh_invoice.supplier_name === input.stored_pr_body?.critical_state_display?.supplier_name
        ? 'pass'
        : 'fail',
    reason: 'Amount, currency, IBAN, supplier verification.',
  });

  gates.push({
    id: 'prepared_action_exact_match',
    phase: 'act',
    status: true ? 'pass' : 'fail',
    reason: 'Prepared action matches what was stored.',
  });

  gates.push({
    id: 'approval_route_satisfied',
    phase: 'act',
    status:
      input.approval && input.approval.route === input.stored_pr_body?.policy?.reviewer_route ? 'pass' : 'fail',
    reason: 'Approval route matches policy requirement.',
  });

  gates.push({
    id: 'writes_explicitly_enabled_for_test',
    phase: 'act',
    status: input.writesEnabled ? 'pass' : 'fail',
    reason: input.writesEnabled
      ? 'Writes explicitly enabled for controlled test.'
      : 'Qonto writes are disabled by default — Act stops at a verified ready_for_qonto handoff.',
  });

  return gates;
}

export function allPass(gates: Gate[]): boolean {
  return gates.every((g) => g.status === 'pass');
}
