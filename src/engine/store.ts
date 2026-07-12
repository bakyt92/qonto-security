import type { ActResult, Approval, DomainEvent, LifecycleStatus, StoredPr } from './types.js';

export interface PrStore {
  putPr(stored: StoredPr): void;
  getPr(id: string): StoredPr | null;
  putApproval(a: Approval): void;
  getApproval(id: string): Approval | null;
  putLifecycle(id: string, status: LifecycleStatus): void;
  getLifecycle(id: string): LifecycleStatus | null;
  appendEvent(e: DomainEvent): void;
  events(id?: string): DomainEvent[];
  putActResult(r: ActResult): void;
  getActResult(id: string): ActResult | null;
  reserveOnce(id: string): boolean;
  isReserved(id: string): boolean;
}

export class MemoryStore implements PrStore {
  private prs = new Map<string, StoredPr>();
  private approvals = new Map<string, Approval>();
  private lifecycle = new Map<string, LifecycleStatus>();
  private eventLog: DomainEvent[] = [];
  private acts = new Map<string, ActResult>();
  private reserved = new Set<string>();

  putPr(stored: StoredPr): void {
    this.prs.set(stored.body.pr_id, structuredClone(stored));
  }
  getPr(id: string): StoredPr | null {
    const pr = this.prs.get(id);
    return pr ? structuredClone(pr) : null;
  }
  putApproval(a: Approval): void {
    this.approvals.set(a.pr_id, structuredClone(a));
  }
  getApproval(id: string): Approval | null {
    const a = this.approvals.get(id);
    return a ? structuredClone(a) : null;
  }
  putLifecycle(id: string, status: LifecycleStatus): void {
    this.lifecycle.set(id, status);
  }
  getLifecycle(id: string): LifecycleStatus | null {
    return this.lifecycle.get(id) ?? null;
  }
  appendEvent(e: DomainEvent): void {
    this.eventLog.push(structuredClone(e));
  }
  events(id?: string): DomainEvent[] {
    const all = structuredClone(this.eventLog);
    return id ? all.filter((e) => e.pr_id === id) : all;
  }
  putActResult(r: ActResult): void {
    this.acts.set(r.pr_id, structuredClone(r));
  }
  getActResult(id: string): ActResult | null {
    const r = this.acts.get(id);
    return r ? structuredClone(r) : null;
  }
  reserveOnce(id: string): boolean {
    if (this.reserved.has(id)) return false;
    this.reserved.add(id);
    return true;
  }
  isReserved(id: string): boolean {
    return this.reserved.has(id);
  }
}
