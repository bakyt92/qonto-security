export interface Clock {
  now(): string;
}

export function fixedClock(startIso: string, stepMs: number): Clock {
  let current = new Date(startIso).getTime();
  return {
    now() {
      const iso = new Date(current).toISOString();
      current += stepMs;
      return iso;
    },
  };
}

export function frozenClock(iso: string): Clock {
  return { now: () => iso };
}

export function systemClock(): Clock {
  return { now: () => new Date().toISOString() };
}

export function addMinutes(iso: string, min: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + min);
  return d.toISOString();
}

export function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}
