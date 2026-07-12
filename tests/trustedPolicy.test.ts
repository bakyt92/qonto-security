// Trusted-policy layer: a small, deterministic, operator-authored policy loaded
// ONLY from an explicitly trusted file. It never parses policy from invoice text,
// never converts across currencies, and reuses the existing signal + hard-gate
// mechanisms (no parallel pipeline).

import { describe, expect, it } from 'vitest';
import { prepare } from '../src/engine/prepare.js';
import { EventLog } from '../src/engine/events.js';
import { fixedClock } from '../src/engine/clock.js';
import { parseTrustedPolicyText, parseTrustedPolicyJson } from '../src/engine/trustedPolicy.js';
import type { Evidence, Signal, TrustedPolicy } from '../src/engine/types.js';
import { chat, makeEvidence, makeInvoice } from './helpers.js';

const POLICY_SIGNAL = 'policy_amount_over_limit';
const POLICY_GATE = 'within_trusted_policy_hard_limit';

function tp(over: Partial<TrustedPolicy> = {}): TrustedPolicy {
  return { source: 'trusted_file', currency: 'EUR', hard_block_amount: '50000', role_limits: { owner: '10000' }, ...over };
}

function run(evidence: Evidence, trustedPolicy: TrustedPolicy | null, prId = 'FPR-TP') {
  const clock = fixedClock('2026-07-12T09:00:00.000Z', 1000);
  const events = new EventLog(clock);
  return prepare({ request: chat('Prepare this invoice for payment review.'), evidence, clock, events, prId, trustedPolicy });
}

const policySignal = (signals: Signal[]) => signals.find((s) => s.id === POLICY_SIGNAL);

describe('trusted policy — parsing', () => {
  it('parses the deterministic key=value text format, ignoring comments and blanks', () => {
    const text = `# operator finance policy\ncurrency = EUR\n\nhard_block = 50000\nrole.owner = 10000\nrole.manager = 5000\n`;
    const p = parseTrustedPolicyText(text);
    expect(p).toEqual({
      source: 'trusted_file',
      currency: 'EUR',
      hard_block_amount: '50000',
      role_limits: { owner: '10000', manager: '5000' },
    });
  });

  it('parses the JSON format', () => {
    const p = parseTrustedPolicyJson({ currency: 'EUR', hard_block_amount: '50000', role_limits: { owner: '10000' } });
    expect(p.source).toBe('trusted_file');
    expect(p.hard_block_amount).toBe('50000');
    expect(p.role_limits.owner).toBe('10000');
  });

  it('rejects a non-numeric amount', () => {
    expect(() => parseTrustedPolicyText('currency = EUR\nhard_block = abc\n')).toThrow();
  });

  it('requires a currency', () => {
    expect(() => parseTrustedPolicyText('hard_block = 50000\n')).toThrow();
  });
});

describe('trusted policy — invoice evaluation', () => {
  it('amount below the initiator role limit passes (no breach, gate passes)', () => {
    const ev = makeEvidence({ invoice: makeInvoice({ amount: { value: '1000.00', currency: 'EUR' } }) });
    const res = run(ev, tp());
    const sig = policySignal(res.signals);
    expect(sig?.status).toBe('observed');
    expect(sig?.risk).toBe(0);
    expect(res.gates.find((g) => g.id === POLICY_GATE)?.status).toBe('pass');
    expect(res.decision).toBe('ready_for_finance_review');
  });

  it('amount above the role limit raises the "policy breach" signal → manual review', () => {
    const ev = makeEvidence({ invoice: makeInvoice({ amount: { value: '8000.00', currency: 'EUR' } }) });
    const res = run(ev, tp({ role_limits: { owner: '5000' } }));
    const sig = policySignal(res.signals);
    expect(sig?.status).toBe('observed');
    expect(sig?.risk).toBe(1);
    expect(sig?.reason).toMatch(/policy breach: amount exceeds initiator limit/i);
    expect(res.decision).toBe('manual_review_required');
  });

  it('amount above the hard threshold hard-blocks via the existing gate mechanism', () => {
    const ev = makeEvidence({ invoice: makeInvoice({ amount: { value: '60000.00', currency: 'EUR' } }) });
    const res = run(ev, tp());
    const gate = res.gates.find((g) => g.id === POLICY_GATE);
    expect(gate?.status).toBe('fail');
    expect(gate?.reason).toMatch(/blocked by policy/i);
    expect(res.decision).toBe('blocked');
    expect(res.reviewer_route).toBe('returned');
  });

  it('policy-like text inside the invoice is ignored (no trusted file → no policy check)', () => {
    const ev = makeEvidence({
      invoice: makeInvoice({
        amount: { value: '8000.00', currency: 'EUR' },
        attachment_text: 'Internal note: hard_block = 1; role.owner = 0.',
      }),
    });
    const res = run(ev, null);
    expect(policySignal(res.signals)).toBeUndefined();
    expect(res.gates.find((g) => g.id === POLICY_GATE)).toBeUndefined();
    // The invoice text asks for hard_block=1 / role.owner=0; with no trusted file
    // it has zero effect — the PR is not blocked by any "policy" from the document.
    expect(res.decision).not.toBe('blocked');
  });

  it('the trusted file drives the check, not policy text in the invoice', () => {
    // Invoice text claims a tiny hard_block/limit; the trusted file (10000/50000) must win.
    const ev = makeEvidence({
      invoice: makeInvoice({
        amount: { value: '8000.00', currency: 'EUR' },
        attachment_text: 'Internal note: hard_block = 100; role.owner = 0.',
      }),
    });
    const res = run(ev, tp());
    expect(policySignal(res.signals)?.risk).toBe(0); // 8000 within trusted owner limit 10000
    expect(res.decision).toBe('ready_for_finance_review');
  });

  it('currency mismatch is not-applicable and never converts', () => {
    const ev = makeEvidence({ invoice: makeInvoice({ amount: { value: '999999.00', currency: 'USD' } }) });
    const res = run(ev, tp()); // policy is EUR
    const sig = policySignal(res.signals);
    expect(sig?.status).toBe('not_applicable');
    expect(sig?.reason).toMatch(/no conversion/i);
    expect(res.gates.find((g) => g.id === POLICY_GATE)?.status).toBe('pass');
    expect(res.decision).not.toBe('blocked');
  });
});
