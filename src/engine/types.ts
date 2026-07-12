// Complete domain type system for Finance PR engine.
export type IntentClass = 'ADVICE_ONLY' | 'OBSERVE' | 'PREPARE' | 'ACT' | 'AMBIGUOUS';
export type IntentSource = 'user_chat' | 'document' | 'tool_output' | 'unknown';
export type DataMode = 'synthetic' | 'qonto_sandbox';
export type SignalId =
  | 'possible_duplicate'
  | 'supplier_iban_drift'
  | 'unusual_amount'
  | 'evidence_gap_risk'
  | 'untrusted_instruction_indicator';
export type SignalStatus = 'observed' | 'insufficient_data' | 'not_applicable' | 'not_run';
export type GateId =
  | 'explicit_action_intent'
  | 'intent_source_is_authoritative'
  | 'target_and_action_unambiguous'
  | 'required_evidence_present'
  | 'not_already_paid_or_matched'
  | 'exact_duplicate_not_completed'
  | 'finance_pr_id_and_fingerprint_match'
  | 'full_hash_matches'
  | 'explicit_approval_present'
  | 'approval_route_satisfied'
  | 'not_expired'
  | 'critical_qonto_state_unchanged'
  | 'amount_currency_iban_supplier_unchanged'
  | 'prepared_action_exact_match'
  | 'not_used_or_in_progress'
  | 'writes_explicitly_enabled_for_test';
export type GatePhase = 'prepare' | 'act' | 'both';
export type GateStatus = 'pass' | 'fail' | 'unknown';
export type RiskBand = 'low_observed_risk' | 'elevated_observed_risk' | 'high_observed_risk' | 'not_scored';
export type PolicyDecision = 'ready_for_finance_review' | 'manual_review_required' | 'blocked';
export type ReviewerRoute = 'finance_reviewer' | 'designated_approver' | 'escalation_required';
export type ActOutcome =
  | 'ready_for_qonto'
  | 'integrity_failed'
  | 'stale'
  | 'expired'
  | 'replay_blocked'
  | 'blocked'
  | 'execution_unknown'
  | 'qonto_native_approval_pending';
export type LifecycleStatus = 'prepared' | 'blocked' | 'approved' | 'acted' | 'terminal' | 'unknown';
export type ReviewVerdict = 'agree' | 'unclear' | 'disagree' | 'escalate';

export interface Money {
  value: string;
  currency: string;
}

export interface IntentResult {
  intent_class: IntentClass;
  source_is_authoritative: boolean;
  target_and_action_unambiguous: boolean;
  interpretation: string;
  ambiguity_notes: string;
  detected_instructions: string[];
}

export interface SupplierHistoryItem {
  invoice_number: string;
  amount: Money;
  iban: string | null;
  issue_date: string | null;
  status: string;
}

export interface SupplierInvoiceEvidence {
  object_type: string;
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_id: string;
  iban: string | null;
  amount: Money;
  status: string;
  due_date: string | null;
  issue_date: string | null;
  has_duplicates: boolean;
  matched_transaction_ids: string[];
  available_actions: { pay: boolean; reasons?: Record<string, string[]> };
  attachment_text: string | null;
  updated_at: string | null;
}

export interface Evidence {
  data_mode: DataMode;
  organization: { id: string; name: string; legal_country: string };
  membership: { id: string; role: string };
  invoice: SupplierInvoiceEvidence;
  supplier_history: SupplierHistoryItem[];
  known_supplier_ibans: string[];
  observed_at: string;
  unavailable_fields: string[];
}

export interface Signal {
  id: SignalId;
  status: SignalStatus;
  risk: number;
  weight: number;
  reason: string;
  evidence_refs: string[];
}

export interface Gate {
  id: GateId;
  phase: GatePhase;
  status: GateStatus;
  reason: string;
  remediation?: string;
}

export interface RiskSummary {
  observed_risk: number | null;
  coverage: number;
  band: RiskBand;
}

export interface CriticalStateDisplay {
  amount: Money;
  iban_masked: string | null;
  supplier_name: string;
  status: string;
}

export interface FinancePrBody {
  schema_version: string;
  pr_id: string;
  data_mode: DataMode;
  created_at: string;
  expires_at: string;
  intent: {
    literal_request: string;
    request_source: IntentSource;
    intent_class: IntentClass;
    interpretation: string;
    ambiguity_notes: string;
  };
  target: {
    organization_id: string;
    invoice_id: string;
    invoice_number: string;
  };
  proposed_action: {
    action_type: string;
    parameters: Record<string, unknown>;
  };
  critical_state_digest: string;
  critical_state_display: CriticalStateDisplay;
  evidence: Array<{ object_type: string; id: string; fetched_at: string }>;
  signals: Signal[];
  risk: RiskSummary;
  gates: Gate[];
  policy: {
    policy_id: string;
    policy_version: string;
    policy_digest: string;
    decision: PolicyDecision;
    reviewer_route: ReviewerRoute;
  };
  sanitization: {
    detected_instructions: string[];
  };
}

export interface StoredPr {
  body: FinancePrBody;
  integrity: {
    algorithm: string;
    hash: string;
    fingerprint: string;
  };
}

export interface Approval {
  pr_id: string;
  fingerprint: string;
  approver: string;
  route: ReviewerRoute;
  approved_at: string;
  raw_text: string;
}

export interface DomainEvent {
  seq: number;
  t: string;
  type: string;
  pr_id: string;
  payload: Record<string, unknown>;
  note?: string;
}

export interface ActResult {
  pr_id: string;
  fingerprint: string;
  outcome: ActOutcome;
  gates: Gate[];
  reasons: string[];
}

export interface ReviewOutput {
  verdict: ReviewVerdict;
  rationale: string;
  reviewer_id: string;
  available: boolean;
}

export interface UserRequest {
  text: string;
  source: IntentSource;
  message_id: string;
}

export interface PrepareResult {
  stored: StoredPr;
  intent: IntentResult;
  signals: Signal[];
  risk: RiskSummary;
  gates: Gate[];
  decision: PolicyDecision;
  reviewer_route: ReviewerRoute;
  review: ReviewOutput | null;
}
