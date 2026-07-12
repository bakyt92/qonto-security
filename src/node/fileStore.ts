import type { PrStore, StoredPr, Approval, LifecycleStatus, DomainEvent, ActResult } from '../engine/index.js';
export class FileStore implements PrStore {
  private prs = new Map<string, StoredPr>();
  private approvals = new Map<string, Approval>();
  private reserved = new Set<string>();
  putPr(s: StoredPr) { this.prs.set(s.body.pr_id, s); }
  getPr(id: string) { return this.prs.get(id) || null; }
  putApproval(a: Approval) { this.approvals.set(a.pr_id, a); }
  getApproval(id: string) { return this.approvals.get(id) || null; }
  putLifecycle(_id: string, _status: LifecycleStatus) { }
  getLifecycle(_id: string) { return null; }
  appendEvent(_e: DomainEvent) { }
  events(_id?: string) { return []; }
  putActResult(_r: ActResult) { }
  getActResult(_id: string) { return null; }
  reserveOnce(id: string) { if (this.reserved.has(id)) return false; this.reserved.add(id); return true; }
  isReserved(id: string) { return this.reserved.has(id); }
}
