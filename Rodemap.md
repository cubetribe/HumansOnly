# Humans Only - Rodemap

Last updated: 2026-02-27
Owner: Codex + Dennis
Execution mode: Parallel workstreams with strict validation gates per wave

## Goal
Build Humans Only into a production-grade social network (photo-first, no video for now) with stable auth, secure media, reliable messaging, robust notifications, and deployment/monitoring maturity.

## Wave Overview

### Wave 0 - Stabilization and Security Baseline
Status: `completed` (v1.2.3, validated live 2026-02-27)

Scope:
- Fix critical frontend/backend contract mismatches (actions: like, repost, follow, conversation delete)
- Remove endless-loading auth UX paths
- Harden upload endpoint (authenticated only)
- Tighten API CORS configuration for credentialed requests
- Fix pagination correctness bugs
- Redact deployment secrets from docs

Acceptance:
- Core interactions work end-to-end
- Lint/build pass
- Baseline script pass
- Live-domain smoke checks pass

### Wave 1 - Auth Consolidation (Clerk-first)
Status: `completed` (v1.3.0, validated live 2026-02-27)

Scope:
- Migrate all route authorization to Clerk server auth
- Keep legacy JWT bridge only as migration fallback
- Remove dead legacy login/signup UI paths
- Define and implement canonical session contract

Acceptance:
- No dual-auth race conditions
- No legacy-only route dependencies in main UX

### Wave 2 - Media Pipeline Hardening
Status: `completed` (v1.4.0, validated live 2026-02-27)

Scope:
- Move media to managed object storage (signed uploads)
- Add content validation, quotas, and abuse controls
- Persist media metadata and moderation flags

Acceptance:
- Uploads are authenticated, auditable, and storage-agnostic

### Wave 3 - Messaging and Notifications Reliability
Status: `pending`

Scope:
- Introduce conversation model + unread tracking
- Add pagination for conversations/messages
- Add realtime delivery strategy (WebSocket/rooms)
- Add notification preferences

Acceptance:
- Messaging scales and remains responsive
- Notification behavior is deterministic and user-configurable

### Wave 4 - Product Completion (Final UX)
Status: `pending`

Scope:
- Complete profile settings (privacy, notification controls)
- Add block/mute/report flows
- Improve empty/error states and guarded routes
- Polish user journeys for onboarding and retention

Acceptance:
- Complete, coherent social UX with robust account controls

### Wave 5 - Operations, Quality, and Observability
Status: `pending`

Scope:
- Add integration + E2E tests for critical journeys
- Add release gates in CI
- Add structured logs, request IDs, metrics, alerts
- Backup/restore drills and deployment rollback playbook

Acceptance:
- Measurable SLOs and reliable release process

### Wave 6 - Live Validation and Hardening Loop
Status: `pending`

Scope:
- Full live-domain verification matrix
- Security sanity checks (authz, uploads, abuse limits)
- Performance and regression sweep
- Final documentation sync (README, CHANGELOG, API docs)

Acceptance:
- Production pass report with zero blocker defects

## Parallel Workstreams
- Track A: Auth/API contracts
- Track B: Frontend interaction correctness
- Track C: Security and infrastructure hardening
- Track D: Documentation and release governance

## Versioning and Release Policy
- Each completed wave increments version and updates changelog
- Only validated waves are pushed
- Live-domain checks are required before marking a wave complete
