import type { Clock } from './clock.js';
import type { DomainEvent } from './types.js';

export class EventLog {
  private seq = 0;
  private events: DomainEvent[] = [];

  constructor(private clock: Clock) {}

  emit(type: string, pr_id: string, payload: Record<string, unknown>, note?: string): void {
    this.events.push({
      seq: ++this.seq,
      t: this.clock.now(),
      type,
      pr_id,
      payload,
      note,
    });
  }

  all(): DomainEvent[] {
    return this.events;
  }
}
