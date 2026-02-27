<div align="center">

<!-- Replace with your actual logo file -->
<img src="public/ho-fist-favicon.svg" alt="Humans Only" width="100" />

# HUMANS ONLY

### The AI is building the wall. Against itself.

[Join the Platform](https://humans-only.de/) · [Join the Resistance](#join-the-resistance) · [Roadmap](#roadmap)

---

*Yes, this platform is built with AI tools.*
*Yes, it exists to keep AI-generated content out.*
*No, we don't see a contradiction. We see poetry.*

</div>

---

## What's Happening Here

The internet has an authenticity problem. Your feed is full of AI-generated art posted as "my latest work," LLM-written LinkedIn posts about "my journey," and deepfake selfies from people who look suspiciously like they were rendered at 4K resolution with perfect skin.

**Humans Only is a social platform where every post, every image, every thought comes from an actual human being.** No exceptions. No "but my prompt was really creative." No.

This is a space for artists, musicians, writers, creators, thinkers, overthinkers, and people who still type their own tweets at 2am with typos they refuse to fix.

We're building a home for human expression. And yes - we're using AI to build it.

> *"In a world full of AI-generated cat pictures... be the real cat."*

## The Irony (Let's Talk About It)

We use AI. Every day. We think it's incredible technology.

We also think your social media feed shouldn't be a guessing game of "did a human write this or did someone spend 30 seconds on a prompt?" There's a difference between **AI as a tool** and **AI as the voice.**

So here's what's happening: AI is helping us write the code that will detect and lock out AI-generated content. Read that again. **The AI is building the cage. For itself.**

If that's not the most poetically absurd thing in tech right now, we don't know what is.

Our position is simple:
- **AI building tools for humans?** Great. Do that.
- **AI pretending to be human?** Not here. Not on this platform.

We use AI to build. Humans get to create.

<!-- 
📸 SCREENSHOT PLACEHOLDER
Add a screenshot or GIF of the app here. Show the vibe.
![Humans Only Screenshot](docs/images/screenshot-demo.png)
-->

## What's Already Standing

This isn't a concept. It's not a pitch deck. It's deployed, it's live, and you can use it right now at **[humans-only.de](https://humans-only.de/)**.

**The platform:**
- User profiles with bios and images
- Posts with replies and nested conversations
- Follow system, likes, reposts
- Direct messaging
- Real-time notifications
- Private profiles + message privacy controls
- Block, mute, and report flows
- Global search
- Dark mode (because we're a resistance, not savages)
- Fully responsive - works on your phone, your laptop, your smart fridge (untested, but probably)

**The engine:**
- Next.js 14 / TypeScript / PostgreSQL / Prisma
- Clerk auth with legacy JWT bridge
- SSR, infinite scroll, optimistic updates
- Ubuntu 24.04, Nginx, PM2, HTTP/2, Let's Encrypt SSL

It's real. It works. And it's about to get a lot bigger.

## Join the Resistance

We're one person right now. That needs to change. Not because we're desperate - because this idea is bigger than a solo project.

If you've ever scrolled past a "painting" that was obviously Midjourney and felt something - annoyance, sadness, the slow death of your faith in the internet - this might be your project.

### 🔧 Developers

The stack is Next.js, TypeScript, PostgreSQL. There's real engineering ahead - AI content detection, moderation systems, performance at scale. If that sounds like fun to you, it probably is.

### 🎨 Designers

The platform works. It doesn't look as good as it should yet. We need people who can make a resistance movement feel like somewhere you want to hang out every day.

### 🧠 Thinkers, Testers, Troublemakers

Don't code? Don't design? Don't care. Use the platform. Break things. Tell us what's stupid. Suggest what's missing. The best products are shaped by the people who use them, not just the people who build them.

**How to jump in:**
1. Check the [open issues](https://github.com/cubetribe/HumansOnly/issues)
2. Look at the [Roadmap](#roadmap) - find what pulls you
3. Open an issue, start a conversation, submit a PR
4. Or just show up and say hi

No contribution is too small. Fix a typo. Improve an error message. Roast our color scheme. It all moves this forward.

## Roadmap

### v1.2 - The Detection Layer
- **AI content detection integration** - the AI builds the wall, remember?
- Content moderation tools
- Enhanced notification system
- Performance optimization
- Security hardening (CSP, HSTS, rate limiting)
- Automated backups

### v2.0 - The Full Vision
- Advanced AI detection models
- Human verification process
- Creator monetization (tips, subscriptions)
- Multi-language support
- Video support
- Analytics dashboard

Something on this list keeping you up at night? [That's your invitation.](#join-the-resistance)

## Development

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18.x+ (LTS recommended) |
| npm | 9.x+ |
| PostgreSQL | 14.x+ |

### Local Setup

```bash
# Clone and install
git clone https://github.com/cubetribe/HumansOnly.git
cd HumansOnly/app
npm install

# Database
createdb humansonly_dev

# Environment
cp .env.example .env
# Edit .env with your database credentials

# Clerk auth (local dev)
cat > .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
EOF

# Migrations
cd src
npx prisma migrate dev --name init
npx prisma generate
cd ..

# Run
npm run dev
# → http://localhost:3000
```

### Checks & Deploy

```bash
# Baseline gates (lint, build, prisma)
./scripts/baseline-check.sh

# CI-compatible quality gates (no DB migration status)
./scripts/ci-quality.sh

# Auth smoke test (app must be running on :3000)
./scripts/auth-smoke-local.sh

# Full live-domain social smoke
./scripts/live-social-smoke.sh https://humans-only.de

# Upload compression/resize hardening smoke
./scripts/upload-compression-smoke.sh https://humans-only.de

# Final live validation matrix
./scripts/live-wave6-validation.sh https://humans-only.de

# Deploy (or --dry-run)
./scripts/deploy-server.sh
```

Auto-deploy runs via `.github/workflows/deploy.yml` on pushes to `main`.

### Project Structure

```
HumansOnly/
├── app/                    # Main application
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── prisma/        # Schema + migrations
│   │   ├── hooks/         # Custom hooks
│   │   ├── utilities/     # Helpers
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── ecosystem.config.js
├── docs/
│   ├── DEPLOYMENT.md
│   ├── API_CONSUMERS.md
│   └── OPERATIONS.md      # release gates, backup/restore, rollback
├── scripts/                # Deploy & checks
└── .github/workflows/      # CI/CD
```

### API

45 endpoints across 9 categories:

| Category | Routes | Scope |
|----------|--------|-------|
| Auth | 5 | Session, bridge, login/logout, verify |
| Users | 14 | Profile, social graph, privacy, moderation |
| Posts | 14 | CRUD, likes, reposts, replies, feeds |
| Messages | 4 | DMs + read state |
| Notifications | 4 | Feed, create, read, preferences |
| Upload | 1 | Media upload pipeline |
| Reports | 1 | Abuse reporting |
| Health | 1 | Runtime/service health |
| Search | 1 | Global |

Full docs: [`docs/API_CONSUMERS.md`](docs/API_CONSUMERS.md)

## Credits

Built on the foundation of [Fatih Arapoglu's Twitter Clone](https://github.com/fatiharapoglu/twitter) (MIT License). Real gratitude for the starting point.

Powered by Next.js, Prisma, Material UI, PostgreSQL, Clerk, and the open-source community that makes all of this possible.

## License

MIT - because the resistance doesn't do paywalls.

Based on [twitter](https://github.com/fatiharapoglu/twitter) by Fatih Arapoglu (MIT License).

## Contact

**Maintainer:** d.westermann@ol-mg.de
**Security issues:** Report directly via email, not public issues.

---

<div align="center">

**The AI helped build this. It won't be allowed to post here.**

*For the human internet.*

</div>
