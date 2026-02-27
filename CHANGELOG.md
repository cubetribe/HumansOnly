# Changelog

All notable changes to the Humans Only project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.8.0] - 2026-02-27

### Added

- Final live validation matrix script:
  - `scripts/live-wave6-validation.sh`
- Wave 6 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave6-live-hardening.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave6-live-hardening.md`
  - `Agents/BUILDER_wave6-live-hardening-2026-02-27.md`
  - `Agents/VALIDATOR_wave6-live-hardening-2026-02-27.md`

### Changed

- Rodemap now marks all waves (`0` through `6`) as completed with live validation evidence.
- Final release readiness includes live authz checks, request-id verification, and response-time spot checks on production domain.

## [1.7.0] - 2026-02-27

### Added

- CI quality gate script and workflow:
  - `scripts/ci-quality.sh`
  - `.github/workflows/quality-gates.yml`
- Live-domain smoke automation:
  - `scripts/live-social-smoke.sh`
  - `.github/workflows/live-smoke.yml`
- Operations documentation:
  - `docs/OPERATIONS.md`
- Health endpoint:
  - `GET /api/health`
- Observability utility:
  - `app/src/utilities/observability/index.ts`
- Wave 5 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave5-operations.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave5-operations.md`
  - `Agents/BUILDER_wave5-operations-2026-02-27.md`
  - `Agents/VALIDATOR_wave5-operations-2026-02-27.md`

### Changed

- Middleware now injects and propagates `x-request-id` for request correlation.
- Key account-control/message/follow APIs now emit structured JSON logs and return request-correlated responses via observability helpers.
- README now documents CI quality and live smoke workflows.

## [1.6.0] - 2026-02-27

### Added

- Account safety and controls APIs:
  - `POST /api/users/[username]/block`
  - `POST /api/users/[username]/unblock`
  - `POST /api/users/[username]/mute`
  - `POST /api/users/[username]/unmute`
  - `GET /api/users/blocked`
  - `GET /api/users/muted`
  - `GET/POST /api/users/preferences` (`isPrivate`, `messagePrivacy`)
  - `POST /api/reports` (user/tweet reports)
- New database models:
  - `Block`
  - `Mute`
  - `Report`
- New user preference columns:
  - `User.isPrivate`
  - `User.messagePrivacy`
- Wave 4 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave4-account-controls.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave4-account-controls.md`
  - `Agents/BUILDER_wave4-account-controls-2026-02-27.md`
  - `Agents/VALIDATOR_wave4-account-controls-2026-02-27.md`

### Changed

- Feed/search/profile tweet endpoints now enforce visibility rules for:
  - private accounts
  - mutual block relationships
  - viewer mute relationships
- Interaction endpoints (`like`, `retweet`, `reply`) now reject actions when visibility/account restrictions apply.
- Profile API now exposes account-control state:
  - `isBlockedByMe`, `hasBlockedMe`, `isMutedByMe`, `canViewContent`
- Settings page now includes:
  - private account toggle
  - message privacy selector
  - blocked/muted management lists with actions
- Profile page now includes:
  - block/unblock
  - mute/unmute
  - report user
- Single tweet menu now supports reporting posts for non-authors.

### Fixed

- Build/type safety regressions caused by nullable user payloads in client cache updates.

## [1.5.1] - 2026-02-27

### Fixed

- Resolved production regression in `POST /api/users/create` by moving password hashing inside route-level `try/catch`, preventing unhandled HTML 500 responses when hashing fails.

## [1.5.0] - 2026-02-27

### Added

- Message read-state support via `Message.isRead`.
- Notification preference model and APIs:
  - `GET/POST /api/notifications/preferences`
- Message read endpoint:
  - `POST /api/messages/read`
- Wave 3 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave3-messaging-notifications.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave3-messaging-notifications.md`
  - `Agents/BUILDER_wave3-messaging-notifications-2026-02-27.md`
  - `Agents/VALIDATOR_wave3-messaging-notifications-2026-02-27.md`

### Changed

- `/api/messages/[username]` now returns pagination metadata, `totalUnread`, and per-conversation `unreadCount`.
- `/api/notifications` now returns pagination metadata and `unreadCount`.
- `/api/notifications/create` now applies recipient notification preferences before persisting event notifications.
- Frontend conversation view now marks incoming messages as read when opening a thread.

### Fixed

- Notification unread badge can now use server-provided unread aggregate, reducing client-side counting drift.

## [1.4.0] - 2026-02-27

### Added

- Media audit model in Prisma:
  - `MediaAsset` with ownership, checksum, provider/key, dimensions, and moderation fields.
- Storage provider abstraction for uploads:
  - local filesystem
  - optional Supabase managed storage (`supabase`/`auto` mode)
- Wave 2 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave2-media.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave2-media.md`
  - `Agents/BUILDER_wave2-media-2026-02-27.md`
  - `Agents/VALIDATOR_wave2-media-2026-02-27.md`

### Changed

- `/api/upload` now enforces per-user daily file-count and bandwidth quotas.
- `/api/upload` now supports duplicate media reuse by checksum (per user/type), reducing redundant storage writes.
- Upload responses now include audit metadata (`assetId`, `provider`, `moderationStatus`, `reused`) while preserving `path`.

### Fixed

- Upload pipeline is now auditable end-to-end (DB record + live validation), not just file-write based.

## [1.3.0] - 2026-02-27

### Added

- Centralized Clerk-first auth/session utility:
  - `app/src/utilities/auth/session.ts`
- New Wave 1 agent artifacts:
  - `Agents/RESEARCHER_brief-2026-02-27-wave1-auth.md`
  - `Agents/ARCHITECT_spec-2026-02-27-wave1-auth.md`
  - `Agents/BUILDER_wave1-auth-2026-02-27.md`
  - `Agents/VALIDATOR_wave1-auth-2026-02-27.md`

### Changed

- Protected routes now resolve authenticated users via Clerk-first auth with legacy JWT fallback instead of direct JWT-only checks.
- `/api/auth/session` now exposes a canonical session response with auth source metadata (`clerk`, `legacy`, or `null`).
- Core mutation endpoints no longer depend on client-supplied `tokenOwnerId` for authorization decisions.
- Frontend fetch layer and mutation callers were simplified to stop sending `tokenOwnerId` in request bodies.

### Fixed

- Server-side message sender identity now derives from authenticated session, preventing sender spoofing from request payload.
- Tweet deletion now enforces author ownership server-side prior to deletion.

### Removed

- Unused legacy login/signup dialog components from the frontend codebase.

## [1.2.3] - 2026-02-27

### Fixed

- Added a `bcryptjs` fallback for password hashing/comparison in legacy auth flows to avoid runtime failures when native `bcrypt` is unavailable on the target host.

## [1.2.2] - 2026-02-27

### Added

- `Rodemap.md` with the 6-wave execution and validation plan.

### Changed

- Hardened action payload handling for legacy quoted `tokenOwnerId` values across like/repost/follow/delete routes.
- Home, Messages, and Notifications pages now fail gracefully when users are not signed in instead of hanging in loading states.
- Profile verification flow now validates the code server-side and supports partial profile updates without clearing media.
- API CORS now uses a concrete allowed origin (`NEXT_PUBLIC_HOST_URL`) for credentialed requests.

### Fixed

- Restored frontend/backend ID contract for like/repost/follow/delete actions by removing `JSON.stringify` ID transport in client components.
- Corrected tweet pagination metadata by counting only non-reply posts in `/api/tweets/all`.
- Restricted `/api/upload` to authenticated users only.
- Redacted hardcoded production credentials/secrets from deployment documentation.

## [1.2.1] - 2026-02-27

### Added

- UX mention linking in post bodies via reusable renderer:
  - `src/components/misc/MentionText.tsx`
- Deployment automation assets:
  - `.github/workflows/deploy.yml` (main branch auto-deploy)
  - `scripts/deploy-server.sh` (manual deploy parity script)
- New agent workflow artifacts for UX/deploy hardening:
  - `Agents/RESEARCHER_brief-2026-02-27-ux.md`
  - `Agents/ARCHITECT_spec-2026-02-27-ux.md`

### Changed

- Tweet and single-post views now convert `@username` text into profile links.
- Share interaction now uses native Web Share API when available, with clipboard fallback.
- Like/repost/follow/delete action payloads standardized to object format (`{ tokenOwnerId }`) with route-level backward compatibility.
- Sidebar unauthenticated CTA now uses Clerk modal buttons directly.
- Deploy docs updated with GitHub secrets and auto-deploy flow.

### Fixed

- Avoided accidental deletion of server user uploads during deploy (`public/uploads` excluded from rsync delete).
- Added deploy health-check retry loop to prevent false negatives immediately after PM2 restart.

## [1.2.0] - 2026-02-27

### Added

- Clerk App Router integration (`@clerk/nextjs`) with:
  - `src/proxy.ts` using `clerkMiddleware()`
  - `ClerkProvider` in root layout
  - Clerk auth UI controls (`SignInButton`, `SignUpButton`, `UserButton`, `SignedIn`, `SignedOut`)
- Clerk-to-legacy JWT bridge endpoint: `POST /api/auth/clerk/bridge`
- `ClerkAuthBridge` client sync component to issue/clear legacy JWT cookie based on Clerk session
- Prisma migration `20260227121000_add_clerk_id_to_user` with optional unique `User.clerkId`
- New stabilization scripts:
  - `scripts/baseline-check.sh`
  - `scripts/auth-smoke-local.sh`

### Changed

- Landing page registration/login flow now uses Clerk modal auth components.
- Auth cookie handling centralized via `src/utilities/auth/cookies.ts`.
- Auth endpoints hardened with stricter request validation and sanitized error responses.
- Updated setup docs to include `.env.local` Clerk placeholders and baseline checks.

### Fixed

- Local build blocker from stale Retweet component/import mismatch (legacy Retweet files removed).
- Production runtime DB configuration mismatch corrected on server (`humansonly_prod` connectivity restored).

## [1.0.0] - 2025-12-21

### Project Initialization

Initial setup and production deployment of Humans Only platform, forked from fatiharapoglu/twitter.

### Added

#### Application Features
- User authentication system with JWT and bcrypt password hashing
- User profiles with customizable bio, avatar, and header images
- Tweet/Post creation with text (280 chars) and image support
- Reply system with nested conversations
- Retweet/Repost functionality
- Like system for posts
- Following/Followers relationship management
- Direct messaging (DM) system
- Real-time notifications
- Global search (users and posts)
- Premium/Verified badge system
- Dark/Light theme toggle
- Responsive design (mobile, tablet, desktop)
- Infinite scroll pagination

#### Technical Infrastructure
- Next.js 14.2.33 with App Router (React 18)
- TypeScript 5.0 for type safety
- Prisma 4.16 ORM with PostgreSQL 16 database
- Material UI 5.13 component library
- TanStack React Query 4.29 for data fetching
- Formik 2.2 + Yup 1.1 for form handling
- Framer Motion 10.12 for animations

#### Database Schema
- User model (id, username, password, profile fields, isPremium, timestamps)
- Tweet model (id, text, photoUrl, isRetweet, isReply, relations)
- Message model (sender, recipient, text, photoUrl)
- Notification model (type, content, isRead, timestamps)
- Many-to-many relations: Following, Likes, Retweets

#### Production Deployment
- Ubuntu 24.04 VPS server (5.182.17.148)
- Node.js 20.19.6 runtime
- PostgreSQL 16.11 database (humansonly_prod)
- PM2 process manager with systemd integration
- Nginx 1.24.0 reverse proxy with HTTP/2
- Let's Encrypt SSL certificate (auto-renewing)
- Domain: https://ho.nm-forum.de
- Firewall: UFW with ports 22, 80, 443 open

#### Documentation
- Main README.md (project overview)
- Developer README.md (setup and development)
- DEPLOYMENT.md (production deployment guide)
- API_CONSUMERS.md (31 API endpoints documented)
- Project roadmap and architecture documentation

### Fixed

#### PM2 Crash-Loop Issue (2025-12-21)
- **Problem:** PM2 process crashed continuously (443+ restarts)
- **Root Cause:** Port conflict - App tried to use Port 3000 (blocked by Docker)
- **Solution:**
  - Created PM2 ecosystem.config.js with explicit PORT=3001
  - Killed zombie next-router-worker process (PID 2937980)
  - Configured systemd auto-start
  - Result: 0 restarts, stable operation

#### Port Configuration Issue
- **Problem:** Next.js ignored .env PORT variable
- **Solution:** Explicit port configuration in PM2 ecosystem config

#### Database Authentication Issue
- **Problem:** PostgreSQL authentication failed with special characters in password
- **Solution:** Changed password to alphanumeric (HumansOnly2024Prod)

### Changed

#### Rebranding
- Project name: "Twitter Clone" → "Humans Only"
- Domain: localhost → ho.nm-forum.de
- Database: twitter_clone → humansonly_dev/humansonly_prod
- Terminology: "Tweet" remains (to be changed in v1.1)

#### Environment Configuration
- Development: localhost:3000 → localhost:3001 (Port 3000 blocked)
- Production: Port 3001 (Nginx reverse proxy on 80/443)
- Database: Separate dev/prod databases

### Deployment

#### Initial Deployment (2025-12-21 17:56 CET)
- Total deployment time: ~25 minutes
- 13 Prisma migrations applied
- 27 static pages pre-rendered
- Bundle size: 87.5 kB (First Load JS)
- SSL certificate valid until: 2026-03-21

#### Production Metrics
- PM2 Uptime: 0 restarts (stable)
- Server Memory: 6.3 GB / 24 GB (26% usage)
- Server Disk: 38 GB / 774 GB (5% usage)
- TTFB Performance: 136ms (excellent)
- SSL Grade: A (TLSv1.3)

### Security

#### Implemented
- HTTPS-only enforcement (HTTP → HTTPS redirect)
- JWT token authentication
- Bcrypt password hashing (salt rounds: 10)
- SQL injection protection (Prisma ORM)
- XSS protection (React built-in)
- Firewall configuration (UFW)
- Secure environment variable handling

#### Pending (v1.1)
- Content Security Policy (CSP) headers
- HTTP Strict Transport Security (HSTS)
- Rate limiting
- Fail2ban for SSH/Nginx

### Known Issues

#### Non-Critical
- Supabase storage credentials are placeholders (file upload temporarily disabled)
- No database backup automation (manual backups only)
- No uptime monitoring configured
- Security headers (CSP, HSTS) not yet implemented

#### Documentation TODOs
- Frontend consumer analysis for API_CONSUMERS.md (marked as TBD)
- ARCHITECTURE.md not yet created
- CONTRIBUTING.md referenced but not created
- Repository URL placeholders need updating

### Attribution

This project is based on the excellent work of **Fatih Arapoglu**:
- Original Repository: https://github.com/fatiharapoglu/twitter
- Original License: MIT License
- All original features and architecture credit to Fatih Arapoglu

### Contributors

**Development Team (AI Agents):**
- @architect - System architecture and planning
- @builder - Code implementation and deployment
- @validator - Quality assurance and testing
- @scribe - Documentation and API registry

**Project Maintainer:** d.westermann@ol-mg.de

---

## [1.1.0] - 2025-12-21

### Changed - Complete Rebranding

#### Visual Identity
- **Primary Color:** #1da1f2 (Twitter Blue) → #FF3D1F (Humans Only Red)
- **Color System:** Complete CSS variable overhaul
  - `--twitter-*` → `--ho-*` (20+ variables)
  - Updated all theme colors for dark/light mode
- **Default Theme:** Light mode → Dark mode
- **Favicon:** Updated to Fist logo (Humans Only brand)
- **Landing Page:** New background image
- **Logo:** New HumansOnlyLogo component with animated fist icon

#### Terminology & Branding
- **Package Name:** twitter → humansonly
- **UI Text Replacements:**
  - "Twitter" → "Humans Only" (all instances)
  - "Tweet" → "Post" (all instances)
  - "Retweet" → "Repost" (all instances)
- **Component Names:**
  - `Retweet.tsx` → `Repost.tsx`
  - `RetweetIcon.tsx` → `RepostIcon.tsx`
- **Variable Names:**
  - `retweet` → `repost` (all instances)
  - `isRetweet` → `isRepost` (all instances)

#### Premium Badge System
- **Database Field:** `isPremium` → `isVerifiedHuman`
  - Migration: `20251221_rename_premium_to_verified_human`
- **UI Component:** New `VerifiedHumanBadge` component
- **Badge Text:** "Twitter Blue" → "Verified Human Badge"
- **Badge Icon:** New custom verified human icon

#### Files Modified (50+ files)
- **Components:** 15+ components updated
- **Stylesheets:** 10+ SCSS files rebranded
- **Database:** 1 migration, schema updated
- **Types:** TypeScript interfaces updated
- **Utilities:** Helper functions rebranded

#### Text/Variable Replacements
- **200+ replacements** across the codebase
- All imports and dependencies updated
- All API endpoints terminology updated
- All UI labels and messages updated

### Technical Details

#### Database Migration
```sql
ALTER TABLE "User" RENAME COLUMN "isPremium" TO "isVerifiedHuman";
```

#### Breaking Changes
- API endpoints remain structurally the same (backwards compatible)
- Database field renamed (requires migration)
- Component imports changed:
  - `import Retweet from './Retweet'` → `import Repost from './Repost'`
  - `import RetweetIcon from './RetweetIcon'` → `import RepostIcon from './RepostIcon'`

#### Migration Guide
For existing installations:
```bash
cd app/src
npx prisma migrate deploy
npx prisma generate
```

### Assets Added
- `/public/ho-fist-favicon.svg` - New favicon
- `/public/images/landing-background.jpg` - New landing page image
- New icon components with Humans Only branding

### Documentation Updated
- CHANGELOG.md - This entry
- README.md - Roadmap updated (v1.1 marked as completed)

---

## [Unreleased]

### Planned for v1.2

#### Features
- AI content detection API integration
- Content moderation dashboard
- Enhanced notification system

#### Infrastructure
- Automated database backups (daily)
- Uptime monitoring (UptimeRobot or similar)
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting on API endpoints
- Fail2ban for brute-force protection

#### Documentation
- Complete API_CONSUMERS.md with frontend consumer analysis
- Create ARCHITECTURE.md
- Create CONTRIBUTING.md
- Add API request/response examples

#### Performance
- Bundle size optimization
- Image optimization
- Database query optimization
- Implement caching strategy

### Planned for v2.0

#### Features
- Advanced AI detection models
- User verification process
- Creator monetization (tips, subscriptions)
- Multi-language support
- Video upload support
- Polls and surveys
- Analytics dashboard

#### Infrastructure
- PM2 cluster mode (load balancing)
- Database read replicas
- CDN integration
- Blue-green deployment strategy

---

## Version History

- **1.1.0** (2025-12-21) - Complete rebranding to Humans Only
- **1.0.0** (2025-12-21) - Initial production deployment
- **Unreleased** - Future enhancements

---

## Migration Notes

### From Development to Production

#### Database
```bash
# Production database created
Database: humansonly_prod
User: humansonly_user
13 migrations applied successfully
```

#### Environment Variables
```bash
# Key changes from dev to prod
DATABASE_URL: localhost → localhost (different DB name)
NEXT_PUBLIC_HOST_URL: http://localhost:3000 → https://ho.nm-forum.de
NODE_ENV: development → production
PORT: 3000 → 3001
```

#### Dependencies
```bash
# Production installation
npm ci (479 packages installed)
Build time: ~45 seconds
Zero errors, zero warnings
```

---

## Breaking Changes

### None (v1.0.0 is initial release)

Future breaking changes will be documented here with migration guides.

---

**Maintained by:** Humans Only Team
**Last Updated:** 2025-12-21 (v1.1.0 Rebranding)
**Next Review:** 2025-12-28
