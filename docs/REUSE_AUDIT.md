# Reuse audit

## 1. Executive conclusion

Reuse ideas and test cases, not either source application's architecture.

- TrustGateway contains useful verification concepts, normalized check results, deterministic rule tests, lifecycle states, and audit patterns. Its backend has eight active checks, not the 13 signals advertised by its dashboard. Reimplement the narrow pieces around Qonto evidence and immutable Finance PRs.
- FlowTwin contains an excellent deterministic event-replay pattern, time controls, movement, dwell, guided beats, and closing report. Reimplement those patterns for one flat invoice-flow view. Do not copy the hospital product.
- Licensing blocks direct FlowTwin code reuse today. TrustGateway states “MIT License” only in its README but has no tracked licence text or copyright notice. Resolve both issues before copying code.

## 2. TrustGateway audit

Source inspected at `/home/victor/_aprojects/qonto/TrustGateway`, commit `86bf3b746ff4bca2bc3c45a5d140dae138733671` dated 2026-07-12.

### 2.1 What actually exists

TrustGateway has three inconsistent risk surfaces:

1. The dashboard declares 13 signal names and weights in `frontend/dashboard/src/types/dashboard.ts:14-42,147-162`.
2. The dashboard generates those values randomly and independently of backend verification in `frontend/dashboard/src/lib/mockData.ts:78-102,169-223`.
3. The backend registers eight checks in `backend/app/services/checks/__init__.py:43-54` and combines their scores as a weighted average in `backend/app/services/agentic_service.py:276-301`.

The older backend test `test_all_checks_registered` still says six checks (`backend/tests/services/test_agentic_service.py:147-160`), while two additional checks—amount anomaly and duplicate invoice—have no dedicated test files. This is evidence of prototype drift.

### 2.2 Component decisions

| Source component | Decision | Why | Phase | Claude fit |
|---|---|---|---|---|
| `CheckResult` with status, risk score, reason, details | **KEEP concept** | Clear explainable check contract already uses 0=no risk, 1=high risk | MVP | Easy |
| Rule parser and deterministic condition tests | **SIMPLIFY / REIMPLEMENT** | Useful policy-as-code idea, but free-form mini-language, terminal auto-approve, and silent errors are unsafe | MVP | Easy with typed rules |
| Conversation/invoice consistency | **KEEP intent, REIMPLEMENT** | Core to advice/action and hallucination checks; keyword/LLM implementation is insufficient | MVP | Medium |
| Duplicate invoice rules | **KEEP cases, REIMPLEMENT** | Directly relevant, but uses generic `created_at`, weak identity, and unrelated CSV history | MVP | Easy |
| Amount anomaly | **KEEP cases, SIMPLIFY** | Relevant, but z-score and low-history pass are misleading | MVP | Easy with median/range and `insufficient_data` |
| Amount velocity | **SIMPLIFY into unusual amount** | Overlaps amount anomaly and uses mocked statistics | MVP | Easy |
| Policy compliance | **KEEP policy concept, REIMPLEMENT deterministic gates** | Natural-language LLM policy cannot be an authorization source | MVP | Medium |
| Verification request / human decision / timeout lifecycle | **KEEP concept** | Useful state vocabulary and audit touchpoints | MVP | Easy |
| Audit log | **KEEP concept, EXPAND** | Must add prepare hash, evidence, approval binding, revalidation, replay, and execution result | MVP | Easy |
| Vendor reputation | **DROP** | Mock WHOIS/SERP data and LLM conjecture are not evidence | MVP | Saves time |
| Budget check | **DROP** | Hard-coded fake budgets; no confirmed Qonto budget source | MVP | Saves time |
| Timing anomaly | **DROP** | Weak signal, UTC/timezone errors, and unreachable old-invoice branch | MVP | Saves time |
| Multi-tenant RBAC, OAuth server, dashboards, WebSockets, PostgreSQL, Docker | **DROP** | Qonto already owns identity/permissions; too broad for the vertical slice | MVP | Major time saving |
| FastAPI/Next.js application shells | **DROP** | Unnecessary operational surface | MVP | Major time saving |
| LLM-generated risk summary | **DROP for decisions; optional for wording** | Can hallucinate or soften results; deterministic renderer is enough | MVP | Saves time |
| Full MCP verification proxy | **ROADMAP / clean design** | Would prevent direct bypass but needs a new enforcement boundary | Roadmap | Not hackathon-first |

### 2.3 Critical logic defects to avoid

- `AmountAnomalyCheck` returns pass when fewer than five category records exist (`amount_anomaly.py:54-66`). Finance PR must return `insufficient_data`, lower coverage, and normally route to manual review.
- The timing check tests `age_days > 30` before `age_days > 90`, making the “very old” branch unreachable (`timing_anomaly.py:77-84`). It also uses `datetime.utcnow()` and invoice record creation time, not necessarily invoice issue time.
- The vendor lookup produces fabricated age/rating data for unknown domains (`vendor_reputation.py:148-165`) and uses Python's process-randomized `hash`, despite claiming consistency.
- Amount velocity receives fixed mock totals (`agentic_service.py:255-274`), so demo results are not based on invoice history.
- Budget results use static in-source budgets (`budget_check.py:17-27`).
- The default rules auto-approve a small amount or a hard-coded email domain (`rule_service.py:342-386`). The pipeline then skips all other checks (`verification_pipeline.py:93-110,180-241`). Finance PR never auto-authorizes Act.
- Rule evaluation errors are printed and skipped (`rule_service.py:158-162`), which can make a broken policy appear clear. Finance PR must fail closed or manual.
- Agent-check exceptions receive risk 0.5 and remain in the weighted average (`agentic_service.py:179-190`). Unknown is not a synthetic mid-risk observation; keep availability separate from risk.
- The dashboard creates a risk level first, then generates correlated random signals from that level, while displaying signal contributions as if they created the score (`mockData.ts:78-102,169-223`). This is circular demo logic.
- Several dashboard signals are safety metrics but are added as risks. See `RISK_SIGNAL_MAPPING.md`.
- The duplicate check compares `created_at` as the invoice date (`duplicate_invoice.py:43,58`). Qonto invoice issue date, creation date, and payment date must not be conflated.
- Human decision can be recorded for a merely `pending` request, before verification completes (`verification_service.py:226-229`). Finance PR approval is only valid for an immutable prepared body.

### 2.4 Tests worth porting as specifications

Do not copy until licensing is resolved. Recreate equivalent tests with Finance PR names and Qonto-shaped fixtures.

**KEEP / MVP:**

- Rule parsing and operator boundary cases from `backend/tests/services/test_rule_service.py`.
- Human decision rejection for terminal requests, expiry, audit creation, and status transitions from `test_verification_service.py`, `test_timeout_service.py`, and `test_verification_pipeline.py`.
- Workflow consistency cases for empty history, missing supplier, missing amount, tool messages, and LLM failure from `checks/test_workflow_consistency.py`.
- Amount velocity boundaries (normal, high value, no history, vendor history) from `checks/test_amount_velocity.py`, rewritten as `unusual_amount` and `insufficient_data`.
- Policy cases for missing PO/evidence, role threshold, multiple approval, and LLM failure from `checks/test_policy_compliance.py`, rewritten as typed policy gates.
- Result clamping and normalized score contract from `checks/base.py`.

**DROP or rewrite:**

- Vendor mock-database tests validate fabricated data and should not be ported.
- Budget tests validate hard-coded demo budgets and should not be ported.
- Timing tests validate a low-value behavioral assumption and contain implementation defects.
- Auto-approve tests directly contradict the Finance PR safety constitution.

**Missing upstream coverage to add:**

- There are no dedicated amount-anomaly or duplicate-invoice test files.
- There are no tests for canonical hashes, fingerprint-bound approval, state drift, replay, changed IBAN, already-paid/matched status, prompt authority, redaction, ambiguous write outcome, or direct bypass claims.

## 3. FlowTwin audit

Source inspected at `/home/victor/_aprojects/qonto/FlowTwin`. The local snapshot has no `.git` directory, so a local commit cannot be established.

### 3.1 Framework and architecture

- React 19 + TypeScript + Vite 8 (`frontend/package.json`).
- Zustand store for playback, selected entity, time, speed, and scenario actions (`frontend/src/store.ts`).
- Pure deterministic simulation functions: the same `(time, action state)` tuple returns the same world (`frontend/src/sim/engine.ts:1-5,1517-1541`).
- SVG map and glyphs, with GSAP for plate/scene transitions (`MapView.tsx`, `BuildingView.tsx`).
- Event tracks converted into current entity location, dwell, movement route, zone load, details, and summary.
- `requestAnimationFrame` advances simulated minutes at the selected speed (`frontend/src/App.tsx:14-32`).
- Scenario beats are defined in seed JSON and rendered deterministically (`data/seed/scenario.json`, `frontend/src/sim/beats.ts`).
- Day-review components reduce the same world state rather than a separate animation dataset (`WrapUp.tsx`, `engine.ts:1184-1284`).

### 3.2 Reuse decisions

| FlowTwin material | Decision | Why | Phase | Claude fit |
|---|---|---|---|---|
| Pure `worldAt` reducer and memoization | **KEEP pattern / REIMPLEMENT** | Ensures visual and report use the same events | MVP | Easy |
| Event track -> current state/dwell | **KEEP pattern / REIMPLEMENT** | Makes review delay and bottlenecks truthful | MVP | Easy |
| Play/Pause, speed, scrub and restart | **KEEP pattern / REIMPLEMENT** | Strong demo controls | MVP | Easy |
| Stable entity placement and transition interpolation | **KEEP pattern / SIMPLIFY** | Clear invoice movement without random jitter | MVP | Medium |
| Guided beats and presenter shortcuts | **KEEP pattern / SIMPLIFY** | Reliable 60–90 second demo | MVP | Easy |
| Detail sheet / selected entity drill-down | **SIMPLIFY** | Useful for PR evidence, signals and gates | MVP | Medium |
| Closing review summary | **KEEP pattern / REIMPLEMENT** | Shows outcomes and dwell from event log | MVP | Easy |
| Honesty ledger (real/synthetic/assumption) | **KEEP pattern / REIMPLEMENT** | Prevents sandbox/synthetic confusion | MVP | Easy |
| SVG hospital floor/rooms/lifts/furniture | **DROP** | Domain-specific, visually busy, and unlicensed | MVP | Saves time |
| Multi-floor building view | **DROP** | Does not clarify the Qonto boundary | MVP | Saves time |
| Patient/persona and clinical schema | **DROP** | Irrelevant and privacy-sensitive | MVP | Saves time |
| Admin forecasting and optimization | **DROP** | Disconnected from Finance PR | MVP | Saves time |
| Gemini, Antigravity, Nemotron, TFT, voice/translation | **DROP** | Unnecessary dependencies and claims | MVP | Saves time |
| Hospital data builders/datasets | **DROP** | Not reusable for finance and carry separate terms | MVP | Saves time |
| Rich comparison/replay analytics | **ROADMAP** | Useful once real operational volume exists | Roadmap | Medium |

### 3.3 Smallest adaptation

Build a single horizontal process map with ten compact state cards and a visible vertical Qonto boundary. Invoices are simple tokens carrying a masked supplier label, amount band, Finance PR fingerprint, and decision color. A token occupies exactly one state determined by the latest event. Interpolate only while moving between two recorded states.

Minimum UI:

- Play, Pause, Reset, 1x/2x/4x speed, scrubber;
- three scenario buttons: Normal, Changed IBAN, Tampered/Replay;
- dwell time above each occupied state;
- selected invoice panel showing intent, exact proposed action, evidence, signals, gates, fingerprint, and lifecycle;
- boundary legend: “Before Qonto” versus “Inside Qonto”;
- summary: prepared, manual review, blocked, crossed boundary, native pending, completed, returned, and prevented replays.

This is implementable within the hackathon and materially smaller than adapting the hospital map.

## 4. Licensing and attribution

### TrustGateway

The README says “MIT License,” both locally (`README.md:84-86`) and on the public repository, but the repository contains no tracked `LICENSE`, `COPYING`, or `NOTICE` file. A one-line label is incomplete for normal MIT compliance because it omits the copyright and permission/disclaimer text.

Decision:

- Concepts and independently written specifications are safe to use as inspiration.
- Before copying code, ask the owner to add a full MIT licence file and identify the copyright holder/year.
- If permission is confirmed, retain the full MIT text and a NOTICE listing copied/modified files.

Public reference: [vpimshin/TrustGateway](https://github.com/vpimshin/TrustGateway).

### FlowTwin

Neither the local snapshot nor the public repository exposes a code licence file or a code-licence declaration. Its README only documents data-source terms. Public visibility is not permission to copy, modify, or redistribute code.

Decision:

- Do not copy FlowTwin source, CSS, artwork, layout, or branded assets for the hackathon submission without written permission or an explicit licence.
- Reimplement generic ideas—event sourcing, deterministic replay, scrubber, dwell, scenario beats, and summary—from this specification.
- Credit inspiration in the submission: “Event-replay demo inspired by FlowTwin by team low cortisol,” with a link, even for a clean reimplementation.
- Do not reuse hospital datasets. If ever reused, follow the Hospital Authority/data.gov.hk terms, PhysioNet/MIMIC restrictions, and Synthea Apache-2.0 notice documented in `FlowTwin/data/README.md:69-72`.

Public reference: [shipaleks/raise-hackathon-flowtwin](https://github.com/shipaleks/raise-hackathon-flowtwin).

### Dependency licences

Claude Code must generate a dependency licence report before submission. Prefer dependencies already needed by the implementation. A source project's dependency licence does not license that source project's own code.

## 5. Attribution record for the future repository

Add an `ATTRIBUTION.md` during implementation containing:

- TrustGateway link, inspected commit, concepts used, and whether code was copied;
- FlowTwin link, team attribution, concepts used, and a statement that the visual was cleanly reimplemented unless permission changes;
- Qonto trademark/API attribution and a statement that the project is a hackathon prototype, not Qonto approval;
- third-party dependency licences;
- synthetic fixture provenance.

