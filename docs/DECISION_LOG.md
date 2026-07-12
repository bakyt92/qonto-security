# Decision log

Status vocabulary: **Accepted**, **Provisional**, **Rejected**, **Roadmap**.

## ADR-001 — One supplier-invoice vertical slice

- Status: **Accepted**
- Decision: MVP reviews one supplier invoice and prepares at most one Qonto payment-request/native-approval workflow action discovered from the sandbox.
- Why: one complete safety path is more credible than broad, shallow finance automation.
- Origin: Qonto use case + new design.
- Consequence: cards, client invoices, transfers, budgets, and multi-invoice queues are roadmap.

## ADR-002 — Qonto remains the execution authority

- Status: **Accepted**
- Decision: Finance PR owns intent, evidence, business policy, escalation, and auditability. Qonto owns authentication, scopes, permissions, native approval, SCA, and execution.
- Why: avoids duplicating or misrepresenting bank controls.
- Origin: Qonto requirement.
- Consequence: Finance PR approval is never called Qonto approval.

## ADR-003 — Observe -> Prepare -> Act is a hard separation

- Status: **Accepted**
- Decision: Observe and Prepare contain no Qonto mutation. Act is the only protected workflow path to one allowlisted write.
- Why: reviewers must inspect an immutable proposal before mutation.
- Origin: product requirement + TrustGateway interception concept.
- Consequence: tool adapters are classified read/write and tested with invocation spies.

## ADR-004 — No auto-approval from risk score

- Status: **Accepted**
- Decision: no risk score, model output, trusted vendor, or small amount can authorize Act.
- Why: low risk is not permission and cannot satisfy integrity or approval.
- Origin: threat review; rejects TrustGateway default auto-approve rules.
- Consequence: every sensitive Act requires explicit PR-bound approval.

## ADR-005 — Weighted signals and hard gates are separate

- Status: **Accepted**
- Decision: weighted observations describe risk; gates determine executability.
- Why: hash, approval, expiry, state drift, replay, and intent are binary/unknown safety conditions, not additive risk.
- Origin: new design.
- Consequence: reports display two sections and tests assert gate dominance.

## ADR-006 — Unknown is not zero or pass

- Status: **Accepted**
- Decision: unavailable or insufficient data has an explicit status and lowers coverage.
- Why: TrustGateway's low-history amount pass creates false confidence.
- Origin: critical review of TrustGateway/EXAMPLE.md.
- Consequence: Green requires sufficient coverage and all relevant Prepare gates.

## ADR-007 — Reject the existing 13-signal scoring model

- Status: **Rejected** (as implementation)
- Decision: preserve the exact inventory for audit but do not reuse its formulas/weights wholesale.
- Why: values are synthetic, the score is chosen before signals, and positive safety metrics are added as risk.
- Origin: TrustGateway forensic analysis.
- Consequence: MVP uses five narrowly defined risk signals and named hard gates.

## ADR-008 — Five MVP risk signals

- Status: **Accepted** — confirmed by the completed tool inventory
  (docs/QONTO_TOOL_INVENTORY.md). Sandbox supplier invoices expose `iban: null`,
  so IBAN drift is demonstrated on clearly labelled synthetic history.
- Decision: possible duplicate 0.30, supplier IBAN drift 0.30, unusual amount 0.20, optional evidence gap 0.10, untrusted-instruction indicator 0.10.
- Why: these map to the strongest supplier-invoice review story and minimize correlation.
- Origin: TrustGateway concepts + Qonto/new design.
- Consequence: missing fields may make a signal unavailable; weights are transparent policy defaults, not probabilities.

## ADR-009 — Exact paid/matched duplicate is a gate

- Status: **Accepted**
- Decision: possible duplicate is a weighted signal; evidence that the obligation is already paid/matched/completed blocks Act.
- Why: an aggregate score must not allow an already closed invoice through.
- Origin: Qonto requirement + TrustGateway duplicate concept.

## ADR-010 — Immutable body, append-only lifecycle

- Status: **Accepted**
- Decision: the canonical Finance PR body is immutable; approvals, execution, and events are appended outside it.
- Why: the review target must remain stable while lifecycle evolves.
- Origin: new design inspired by code pull requests.
- Consequence: corrections create a new PR ID and approval.

## ADR-011 — SHA-256 plus human fingerprint

- Status: **Accepted**
- Decision: canonical UTF-8 JSON is hashed with SHA-256; UI uses first 8 hex characters grouped as `ABCD-1234`; Act checks the full hash.
- Why: short fingerprints aid human binding while full hash provides integrity detection.
- Origin: product requirement + new design.
- Consequence: fingerprint is not claimed collision-proof or authentic; signatures are roadmap.

## ADR-012 — Local store with atomic compare-and-set (amended from SQLite)

- Status: **Accepted as amended.** The implementation uses a file-backed store
  (`src/node/fileStore.ts`) whose one-shot reservation is an atomic exclusive
  create (`open "wx"`), plus an in-memory store for browser/tests — the same
  compare-and-set guarantee the constitution requires, without a SQLite
  dependency in a TypeScript codebase.
- Decision: immutable PR bodies written once; approvals, acts, lifecycle, and
  events stored outside the hashed body; reservation is single-winner atomic.
- Why: the original SQLite suggestion assumed a Python engine; the final engine
  is TypeScript and the file primitive gives equivalent replay protection.
- Origin: new design, amended during implementation.
- Consequence: distributed production execution still requires a centralized store.

## ADR-013 — Skill orchestrates; it is not enforcement

- Status: **Accepted**
- Decision: build a Claude Skill for the protected workflow and disclose that raw Qonto writes can be invoked outside it if another client/tool path remains.
- Why: honest scope is stronger than claiming a security boundary the hackathon build does not have.
- Origin: threat model.
- Consequence: hardened MCP proxy/capability broker is roadmap.

## ADR-014 — Synthetic mode is default

- Status: **Accepted**
- Decision: all core flows and the visual work from synthetic fixtures with mandatory provenance; sandbox is used for read integration and an optional controlled write.
- Why: deterministic judging, privacy, repeatability, and no dependency on one account state.
- Origin: Qonto reference material + new design.
- Consequence: synthetic data is never described as real sandbox data.

## ADR-015 — Exact Qonto write deferred to tool discovery

- Status: **Accepted**
- Decision: do not name or design against a write tool until Claude inspects the authenticated MCP surface.
- Why: local allowlist proves five read tools only and MCP contracts can change.
- Origin: Qonto requirement.
- Consequence: MVP can honestly end at verified `ready_for_qonto` if no safe matching write exists.

## ADR-016 — Clean-reimplement FlowTwin visual patterns

- Status: **Accepted**
- Decision: reuse deterministic replay, controls, dwell, beats, and summary as ideas; do not copy hospital code/assets.
- Why: smallest domain-fit and no FlowTwin code licence is present.
- Origin: FlowTwin audit + licensing.
- Consequence: flat invoice flow with one explicit Qonto boundary.

## ADR-017 — Do not copy TrustGateway code before licence fix

- Status: **Accepted**
- Decision: use concepts and independently rewrite tests; request a complete MIT licence before copying source.
- Why: README says MIT but the standard text/copyright notice is absent.
- Origin: reuse/licence audit.

## ADR-018 — Optional second model can only escalate

- Status: **Accepted**
- Decision: disabled by default; no Qonto tools; sanitized minimum context; can only preserve/increase review; unavailability fails manual when required.
- Why: independent ambiguity review may help, but cannot become a second authorization source.
- Origin: product requirement + new design.

## ADR-019 — Designated approver is a local policy concept

- Status: **Accepted**
- Decision: use `designated_approver`. CFO/CEO may be display labels in synthetic business policy only, never represented as native Qonto roles without evidence.
- Why: avoids false Qonto capability claims and supports small businesses.
- Origin: product threat review.

## ADR-020 — Visual state comes only from domain events

- Status: **Accepted**
- Decision: scenario fixtures are produced through the Finance PR core; animation interpolates but does not invent transitions or outcomes.
- Why: prevents a disconnected “wow” animation that contradicts the product.
- Origin: FlowTwin's deterministic engine + new design.

## ADR-021 — No automatic retry after a write

- Status: **Accepted**
- Decision: definite failure is recorded; ambiguous outcome becomes `execution_unknown` and requires read reconciliation.
- Why: a timeout may occur after Qonto accepted a mutation; retry could duplicate it.
- Origin: threat model + Qonto integration design.

## ADR-022 — Privacy-minimal review artifacts

- Status: **Accepted**
- Decision: mask IBANs and object IDs; omit temporary URLs; minimize member/personal data; sanitize second-model context.
- Why: Finance PR is an audit artifact, not a data dump.
- Origin: Qonto data sensitivity + threat model.

## ADR-023 — No fraud or savings claims

- Status: **Accepted**
- Decision: use “risk signal,” “possible duplicate,” “manual verification required,” and “no material inconsistency observed.” Do not claim fraud prevented or money saved.
- Why: the MVP has neither calibrated fraud labels nor outcome data.
- Origin: product scope and reference review.

## ADR-024 — Controlled sandbox write is optional validation

- Status: **Accepted**
- Decision: writes remain disabled until a specific test PR is explicitly confirmed. Run at most the exact intended controlled validation; no batch or hidden retry.
- Why: proves the boundary without turning the project into an autonomous payment bot.
- Origin: Qonto requirement + threat model.

