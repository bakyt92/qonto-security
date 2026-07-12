# Attribution & licensing

Finance PR is an original, clean-room implementation. Two local projects were
**inspected as references only**; **no source code, CSS, SVG, assets, data, or
branding from either was copied.**

## TrustGateway — concepts & test ideas only

Inspected: backend risk checks, the "13-signal" dashboard, the normalized
`CheckResult` shape, the request/decision/audit lifecycle, and its tests.

What informed our design (independently reimplemented):

- A normalized check result `{ id, status, risk∈[0,1], weight, reason,
  evidence_refs }` — we **added a first-class `insufficient_data` status** that
  TrustGateway lacked, and an explicit **gate-vs-signal** split.
- Deterministic duplicate (supplier + invoice-number / amount + near-date) and
  amount-anomaly (median-ratio) rules — reimplemented, and **unit-tested** (both
  were untested in the original).
- Request → decision → audit lifecycle and timeout/failure handling as concepts.

What we deliberately did **not** reuse: its three divergent signal vocabularies
(8 backend checks vs 13 mock dashboard signals vs a stale analytics map that
funnels everything into "Other"), the fabricated vendor/budget/geo/timing
signals, and its scoring. We keep **one canonical signal registry**.

Licence state: TrustGateway's `README.md` says "MIT" in prose, but there is **no
`LICENSE`/`NOTICE` file and no copyright line** anywhere in the repo. That is an
incomplete grant, so we treated it as reference only and wrote our own code.

## FlowTwin — interaction/polish patterns only

Inspected: its pure `worldAt(time, events)` reducer, per-entity event tracks,
CSS-transition tweening, rAF play-clock, scrub/speed controls, dwell calculation,
named-offset narrative beats, and end-of-run summary.

What informed our demo (independently reimplemented): the *technique* of a pure
`worldAt(events, cursor) → World` reducer that every component reads; deterministic
positions with CSS `transition: transform` tweening; a rAF clock advancing
`cursor += speed·dt`; a scrubber; named beat offsets; centralized motion tokens
with a `prefers-reduced-motion` collapse; a summary computed from events.

What we dropped entirely: the hospital theme, geometry, floors, patient data,
SVG assets, GSAP/zustand dependencies, and all wording. Our stage is a financial
review floor with a Qonto boundary — a different product.

Licence state: FlowTwin has **no `LICENSE` file and no `license` field** — i.e.
all rights reserved. We copied nothing and reimplemented the generic patterns.

## Third-party dependencies

| Package | Licence | Use |
|---|---|---|
| react, react-dom | MIT | demo UI |
| js-sha256 | MIT | canonical hashing (sync, browser + Node) |
| vite, @vitejs/plugin-react | MIT | build/dev |
| vitest | MIT | tests |
| typescript | Apache-2.0 | types/build |
| tsx | MIT | run the TS CLI |

No runtime network dependency; synthetic mode is fully offline.

## Codex research documents

The `docs/*.md` analysis files (PRODUCT_SPEC, ARCHITECTURE, RISK_SIGNAL_MAPPING,
THREAT_MODEL, VISUAL_DEMO_SPEC, ACCEPTANCE_TESTS, REUSE_AUDIT, DECISION_LOG,
IMPLEMENTATION_PLAN, HANDOFF) were prior research inputs. `docs/BUILD_DECISIONS.md`
records where this implementation followed or diverged from them.
