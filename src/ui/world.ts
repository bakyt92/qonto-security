import type { DomainEvent } from '../engine/types.js';
export interface World { occurred: number; lastEvent: DomainEvent | null; tokenStation: string; status: Record<string, string>; visited: string[]; dwellMs: number; mode: string; gate: string; terminalLabel: string; }
export const STATION_ORDER = ['intake', 'observe', 'intent', 'risk', 'independent', 'finance_pr', 'approver', 'act', 'boundary', 'qonto', 'outcome'];
export function worldAt(_events: DomainEvent[], _cursorMs: number): World {
  return { occurred: 0, lastEvent: null, tokenStation: 'intake', status: {}, visited: [], dwellMs: 0, mode: 'flow', gate: 'locked', terminalLabel: '' };
}
export function totalMs(_events: DomainEvent[]): number { return 180000; }
export function computeSummary(runs: any[]) {
  return { observed: runs.length, prepared: runs.length, ready_for_review: runs.filter(r => r.prepare?.decision === 'ready_for_finance_review').length, manual_review: runs.filter(r => r.prepare?.decision === 'manual_review_required').length, blocked_before_qonto: runs.filter(r => r.prepare?.decision === 'blocked').length, approvals: runs.filter(r => r.prepare?.decision !== 'blocked').length, submitted_across_boundary: runs.filter(r => r.act?.outcome === 'qonto_native_approval_pending').length, native_pending: 0, integrity_stale_replay_prevented: 0 };
}
