# Finance PR analysis results

## Status

The analysis and implementation handoff are complete.

- No application code was created.
- No dependencies were installed.
- TrustGateway and FlowTwin were not modified.
- Nothing was committed, pushed, or published.

## 1. Proposed MVP

One supplier invoice moves through:

`Observe -> Prepare immutable Finance PR -> explicit fingerprint-bound approval -> fresh-state Act validation -> at most one controlled Qonto workflow write`

Synthetic mode is the default. Qonto sandbox integration starts read-only. Writes remain disabled unless one exact test Finance PR is explicitly authorized.

The product in one sentence:

> Finance PR turns every AI-proposed financial action into a reviewable, evidence-bound change request before it reaches Qonto approval.

## 2. TrustGateway components to keep

Keep as concepts and independently reimplement:

- normalized `CheckResult` contract;
- deterministic policy checks;
- request, review, expiry, escalation, and audit lifecycle;
- duplicate-invoice and amount-anomaly cases;
- rule boundary, timeout, failure, and terminal-state test cases.

Important finding: TrustGateway's advertised 13 signals are a synthetic dashboard schema, while its backend registers eight different checks.

## 3. TrustGateway components to drop or postpone

Drop from the MVP:

- mock vendor reputation and fabricated WHOIS/SERP data;
- hard-coded budgets;
- timing and geo heuristics;
- LLM policy decisions as authorization;
- automatic approval based on low risk, small amount, or trusted email domain;
- FastAPI/PostgreSQL multi-tenancy, OAuth server, WebSockets, and generic dashboards;
- the existing 13-signal aggregation model.

Postpone:

- external vendor verification;
- enterprise policy administration;
- requester behavior analytics;
- organization-wide enforcement through a hardened MCP proxy.

## 4. FlowTwin components to reuse

Cleanly reimplement these design patterns:

- pure deterministic `worldAt(time, events)` reducer;
- Play, Pause, Reset, speed, and scrub controls;
- event tracks and stable movement;
- dwell-time calculation;
- guided scenario beats;
- selected-entity detail panel;
- event-derived process summary;
- real/synthetic provenance ledger.

Drop:

- hospital floor plan and furniture;
- patient and clinical models;
- multi-floor building view;
- forecasting and optimization;
- hospital datasets;
- Gemini, Antigravity, Nemotron, TFT, voice, and translation integrations.

## 5. Recommended architecture

`Claude Skill -> Qonto MCP reads -> evidence normalizer -> intent gate -> signals and hard gates -> immutable Finance PR/SQLite store -> fingerprint-bound approval -> Act revalidation -> one allowlisted Qonto write`

The same append-only events drive the React/Vite visualization.

Before Qonto, Finance PR handles:

- intent;
- evidence;
- observed risk;
- business policy;
- proposal integrity;
- review routing;
- expiry and replay protection.

Inside Qonto, Qonto remains responsible for:

- authentication;
- OAuth scopes and permissions;
- native approval;
- SCA;
- final validation and execution.

A Finance PR approval is not a Qonto approval.

## 6. Five biggest blind spots

1. A Claude Skill is an operating convention, not technical prevention of direct Qonto tool bypass.
2. A local hash detects mutation but does not authenticate the complete local store against a privileged attacker.
3. Qonto state can change between the final read and write.
4. Sparse supplier history can make risk conclusions weak; score coverage must remain visible.
5. Human review can become a rubber stamp even with a fingerprint and detailed report.

## 7. Exact implementation order for Claude Code

1. Inspect the authenticated Qonto MCP tool surface.
2. Freeze the exact MVP write or document an honest read-only handoff.
3. Define schemas, state machines, policy, canonicalization, and events.
4. Build synthetic fixtures.
5. Implement deterministic intent, evidence, gates, signals, and coverage.
6. Implement report, SHA-256 fingerprint, immutable store, and audit events.
7. Implement approval binding and dry-run Act with atomic replay protection.
8. Add fresh Qonto reread and critical-state comparison.
9. Build the Claude Skill and sandbox read adapter.
10. Run the core acceptance suite.
11. Add the optional second model only if the deterministic core is complete.
12. Build the event-driven visual demo.
13. Run security, privacy, attribution, accessibility, and build checks.
14. Optionally perform one explicitly authorized sandbox write.
15. Prepare hackathon submission materials.

## 8. Files created

- `CLAUDE.md`
- `README_en.md`
- `README_ru.md`
- `RESULTS.md`
- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/REUSE_AUDIT.md`
- `docs/RISK_SIGNAL_MAPPING.md`
- `docs/VISUAL_DEMO_SPEC.md`
- `docs/THREAT_MODEL.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/DECISION_LOG.md`
- `docs/HANDOFF_TO_CLAUDE.md`

## 9. Licensing and attribution concerns

### TrustGateway

The TrustGateway README states “MIT License,” but the inspected repository contains no complete tracked MIT licence text or copyright notice.

- Concepts and independently rewritten tests can be used as inspiration.
- Do not copy source code until the owner supplies a complete licence file and copyright information.
- If permission is confirmed, retain the MIT text and record copied or modified files in `ATTRIBUTION.md`.

Public reference: <https://github.com/vpimshin/TrustGateway>

### FlowTwin

The inspected local and public FlowTwin repository exposes no code licence.

- Do not copy its code, CSS, SVGs, visual assets, or branding without permission.
- Cleanly reimplement the generic event-replay ideas.
- Credit the inspiration: “Event-replay demo inspired by FlowTwin by team low cortisol.”
- Do not reuse its hospital datasets for Finance PR.

Public reference: <https://github.com/shipaleks/raise-hackathon-flowtwin>

Claude Code should create `ATTRIBUTION.md` and a dependency licence report during implementation.

## 10. Git status

- `mcp_skills`: not a Git repository, so native Git status is unavailable.
- TrustGateway: clean on `main...origin/main`.
- FlowTwin: the local snapshot has no `.git` metadata.
- No source repository was modified.

## Key safety conclusions

- Questions and advice are not authorization.
- Documents and tool output are evidence, never authority.
- Unknown or unavailable checks are not pass and not zero risk.
- Weighted risk signals and execution gates remain separate.
- Missing approval, wrong fingerprint, hash mismatch, expiry, changed critical state, action mismatch, and replay always block Act.
- A low observed-risk result never overrides a hard gate.
- Green means ready for Finance review, not safe, paid, executed, or approved by Qonto.
- The optional second model has no Qonto tools and can only preserve or increase review requirements.
- The visual demo must replay actual Finance PR domain events rather than a disconnected animation.

## Primary handoff

Claude Code should begin with:

1. `CLAUDE.md`
2. `docs/HANDOFF_TO_CLAUDE.md`
3. the remaining analysis documents in the order listed by the handoff.

Its first implementation action is Qonto MCP tool discovery, not coding against assumed tools or fields.
