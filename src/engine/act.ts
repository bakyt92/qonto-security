import { hashBody, fingerprintFromHash } from './canonical.js';
import { criticalFieldDiffs } from './critical.js';
import { actGates } from './gates.js';
import { isBefore } from './clock.js';
import type { Clock } from './clock.js';
import { EventLog } from './events.js';
import type { ActResult, Approval, SupplierInvoiceEvidence } from './types.js';
import type { PrStore } from './store.js';
import type { WriteAdapter } from './writeAdapter.js';

export function approvalFromText(
  raw: string,
  parsed: { pr_id: string; fingerprint: string },
  approver: string,
  route: any,
  clock: Clock,
): Approval {
  return {
    pr_id: parsed.pr_id,
    fingerprint: parsed.fingerprint,
    approver,
    route,
    approved_at: clock.now(),
    raw_text: raw,
  };
}

export async function act(input: {
  store: PrStore;
  prId: string;
  approval: Approval | null;
  freshInvoice: SupplierInvoiceEvidence;
  clock: Clock;
  events: EventLog;
  writeAdapter?: WriteAdapter;
}): Promise<ActResult> {
  const { store, prId, approval, freshInvoice, clock, events, writeAdapter } = input;

  const stored = store.getPr(prId);
  if (!stored) return { pr_id: prId, fingerprint: '', outcome: 'blocked', gates: [], reasons: ['PR not found'] };

  const recomputedHash = hashBody(stored.body);
  const recomputedFp = fingerprintFromHash(recomputedHash);

  // Re-evaluate gates
  const gates = actGates({
    stored_pr_body: stored.body,
    computed_hash: recomputedHash,
    approval,
    fresh_invoice: freshInvoice,
    current_clock: clock.now(),
    writesEnabled: false,
  });

  const failedGates = gates.filter((g) => g.status !== 'pass');
  const reasons: string[] = failedGates.map((g) => g.reason);

  // Determine outcome priority
  if (recomputedHash !== stored.integrity.hash) {
    events.emit('act_integrity_check_failed', prId, { expected: stored.integrity.hash, computed: recomputedHash });
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'integrity_failed', gates, reasons };
  }

  if (!approval || approval.fingerprint !== recomputedFp) {
    events.emit('act_approval_check_failed', prId, { reason: 'missing or wrong fingerprint' });
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'blocked', gates, reasons };
  }

  if (!isBefore(clock.now(), stored.body.expires_at)) {
    events.emit('act_expired', prId, { expires_at: stored.body.expires_at });
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'expired', gates, reasons };
  }

  const diffs = criticalFieldDiffs(stored.body, freshInvoice);
  if (diffs.length > 0) {
    events.emit('act_stale_detected', prId, { diffs });
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'stale', gates, reasons: diffs };
  }

  if (store.isReserved(prId)) {
    events.emit('act_replay_detected', prId, {});
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'replay_blocked', gates, reasons: ['PR already used'] };
  }

  if (!store.reserveOnce(prId)) {
    events.emit('act_replay_detected', prId, {});
    return { pr_id: prId, fingerprint: recomputedFp, outcome: 'replay_blocked', gates, reasons: ['Reservation failed'] };
  }

  // Default: ready_for_qonto (writes disabled)
  const adapter = writeAdapter || { id: 'disabled', submit: async () => ({ outcome: 'ready_for_qonto', note: '' }) };
  const writeResult = await adapter.submit(stored.body);
  events.emit('qonto_write_outcome', prId, { outcome: writeResult.outcome });

  const outcome: any = writeResult.outcome === 'ready_for_qonto' ? 'ready_for_qonto' : writeResult.outcome;
  return { pr_id: prId, fingerprint: recomputedFp, outcome, gates, reasons };
}
