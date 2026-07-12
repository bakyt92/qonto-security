Completed the analysis and implementation handoff. No application code was created, no dependencies were installed, and neither source project was modified.

  1. Proposed MVP

     One supplier invoice moves through:

     Observe → Prepare immutable Finance PR → explicit fingerprint-bound approval → fresh-state Act validation → at most one controlled Qonto workflow write

     Synthetic mode is the default. Qonto sandbox integration starts read-only, and writes remain disabled unless one exact test Finance PR is explicitly authorized.

  2. TrustGateway components to keep

     Keep as concepts and independently reimplement:
      - normalized CheckResult contract;
      - deterministic policy checks;
      - request, review, expiry, escalation, and audit lifecycle;
      - duplicate-invoice and amount-anomaly cases;
      - rule boundary, timeout, failure, and terminal-state test cases.

     The analysis found that the advertised 13 signals are a synthetic dashboard schema, while the backend registers eight different checks.

  3. TrustGateway components to drop or postpone

     Drop from the MVP:
      - mock vendor reputation and fabricated WHOIS/SERP data;
      - hard-coded budgets;
      - timing and geo heuristics;
      - LLM policy decisions as authorization;
      - automatic approval based on low risk, small amount, or trusted email domain;
      - FastAPI/PostgreSQL multi-tenancy, OAuth server, WebSockets, and generic dashboards;
      - the existing 13-signal aggregation model.

     Postpone external verification, enterprise policy administration, and a hardened MCP proxy.

  4. FlowTwin components to reuse

     Cleanly reimplement these design patterns:
      - pure deterministic worldAt(time, events) reducer;
      - Play, Pause, Reset, speed, and scrub controls;
      - event tracks and stable movement;
      - dwell-time calculation;
      - guided scenario beats;
      - selected-entity detail panel;
      - event-derived process summary;
      - real/synthetic provenance ledger.

     Drop the hospital floor plan, patient model, multi-floor view, forecasting, clinical data, and Gemini/NVIDIA integrations.

  5. Recommended architecture

     Claude Skill → Qonto MCP reads → evidence normalizer → intent gate → signals and hard gates → immutable Finance PR/SQLite store → fingerprint-bound approval → Act revalidation → one allowlisted Qonto write

     The same append-only events drive the React/Vite visualization.

     Before Qonto, Finance PR handles intent, evidence, risk, policy, integrity, and replay. Inside Qonto, permissions, native approval, SCA, and execution remain Qonto responsibilities, consistent with Qonto’s documented scope model
     (https://docs.qonto.com/get-started/business-api/authentication/oauth/available-scopes) and SCA flows (https://docs.qonto.com/api-reference/business-api/authentication/sca/sca-flows).

  6. Five biggest blind spots
      - A Claude Skill is an operating convention, not technical prevention of direct Qonto tool bypass.
      - A local hash detects mutation but does not authenticate the whole local store against a privileged attacker.
      - Qonto state can change between the final read and write.
      - Sparse supplier history can make risk conclusions weak; coverage must remain visible.
      - Human review can become a rubber stamp even with a fingerprint and report.

  7. Exact implementation order for Claude Code
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

  8. Files created
      - CLAUDE.md
      - README_en.md
      - README_ru.md
      - docs/PRODUCT_SPEC.md
      - docs/ARCHITECTURE.md
      - docs/REUSE_AUDIT.md
      - docs/RISK_SIGNAL_MAPPING.md
      - docs/VISUAL_DEMO_SPEC.md
      - docs/THREAT_MODEL.md
      - docs/IMPLEMENTATION_PLAN.md
      - docs/ACCEPTANCE_TESTS.md
      - docs/DECISION_LOG.md
      - docs/HANDOFF_TO_CLAUDE.md

  9. Licensing and attribution concerns
      - The TrustGateway repository (https://github.com/vpimshin/TrustGateway) states “MIT License” in its README but contains no complete tracked MIT licence text or copyright notice. Concepts can be cleanly reimplemented; source copying should
        wait for a proper licence file.

      - The FlowTwin repository (https://github.com/shipaleks/raise-hackathon-flowtwin) exposes no code licence. Its code, CSS, SVGs, assets, and branding should not be copied without permission. The specification calls for a clean reimplementation
        with inspiration attribution.

      - Claude Code should create ATTRIBUTION.md and a dependency licence report during implementation.

  10. Git status

  - mcp_skills: not a Git repository, so no native Git status is available.
  - TrustGateway: clean, main...origin/main.
  - FlowTwin: local snapshot has no .git metadata.
  - No source repositories were modified.
  - Nothing was committed, pushed, or published.

