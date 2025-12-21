# Humans Only

> *"In einer Welt voller AI-generierter Katzenbilder... sei die echte Katze."*

Anti-AI Social Media Platform - Ein Zufluchtsort für authentischen, menschlichen Content.

**Live at:** [https://ho.nm-forum.de](https://ho.nm-forum.de)

---

## Vision

In einer Ära, in der AI-generierter Content das Internet flutet (ja, wir schauen dich an, ChatGPT-Kunst auf LinkedIn), bietet **Humans Only** eine Oase der Authentizität.

Keine AI-generierten Bilder. Keine AI-geschriebenen Posts. Nur echte Menschen mit echten Gedanken, echten Fehlern und echtem Kaffee-Bedarf um 8 Uhr morgens.

**Target Audience:** Künstler, Musiker, Kreative - Menschen, die ihre authentische Arbeit zeigen wollen. Und vielleicht auch Menschen, die einfach genug von "Prompt: hyperrealistic portrait of a CEO doing synergy" haben.

---

## Project Status

| Metric | Value | Commentary |
|--------|-------|------------|
| **Version** | 1.0.0 | *Technically stable* |
| **Deployed** | 2025-12-21 | *Weihnachtsgeschenk an die Menschheit* |
| **Server** | Ubuntu 24.04 @ 5.182.17.148 | *Der Server, der nie schläft* |
| **Domain** | [ho.nm-forum.de](https://ho.nm-forum.de) | *Kurz für "Hey, das läuft!"* |
| **Status** | Stable | *Klopf auf Holz* |

---

## Tech Stack

### Core
- **Framework:** Next.js 14.2.33 (React 18, App Router)
- **Language:** TypeScript 5.0 - *Weil JavaScript mit Typen einfach besser schläft*
- **Database:** PostgreSQL 16 - *Der zuverlässige Elefant*
- **ORM:** Prisma 4.16 - *SQL schreiben? In 2024? Nein danke.*

### Frontend
- **UI:** Material UI 5.13, SCSS/Sass
- **State:** TanStack React Query 4.29 - *Caching done right*
- **Forms:** Formik 2.2 + Yup 1.1 - *Validation ohne Kopfschmerzen*
- **Animations:** Framer Motion 10.12 - *Damit es fancy aussieht*

### Infrastructure (Production)
- **Server:** Ubuntu 24.04 (Node.js 20.19)
- **Process Manager:** PM2 - *Weil "node index.js" keine Produktionsstrategie ist*
- **Web Server:** Nginx 1.24 mit HTTP/2
- **SSL:** Let's Encrypt - *Kostenlos und sicher, wie es sein sollte*

---

## Quick Start

### Prerequisites

```
 _____________________
< Ohne diese kein Spaß >
 ---------------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

| Tool | Version | Pro-Tipp |
|------|---------|----------|
| Node.js | 18.x+ | LTS-Version empfohlen |
| npm | 9.x+ | Kommt mit Node |
| PostgreSQL | 14.x+ | `brew install postgresql` auf Mac |

### Local Development

```bash
# 1. Clone repository
git clone https://github.com/cubetribe/HumansOnly.git
cd HumansOnly/app

# 2. Install dependencies (Hol dir einen Kaffee, dauert eine Minute)
npm install

# 3. Setup PostgreSQL database
createdb humansonly_dev

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials
# (Nein, 'password123' ist kein gutes Passwort)

# 5. Run database migrations
cd src
npx prisma migrate dev --name init
npx prisma generate
cd ..

# 6. Start development server
npm run dev
# Open http://localhost:3000 und staune!
```

Für detaillierte Setup-Anweisungen, siehe `/app/README.md`

---

## Project Structure

```
HumansOnly/
├── app/                        # Main application (wo die Magie passiert)
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # React components (UI-Bausteine)
│   │   ├── prisma/            # Database schema + migrations
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utilities/         # Helper functions (die Helden im Hintergrund)
│   │   └── types/             # TypeScript types
│   ├── public/                # Static assets
│   └── ecosystem.config.js    # PM2 configuration
├── docs/                       # Documentation
│   ├── DEPLOYMENT.md          # Production deployment guide
│   └── API_CONSUMERS.md       # API endpoint registry (31 endpoints!)
├── Agents/                     # AI agent reports (oh, the irony)
├── Context/                    # Project context
└── .gitignore                  # Das wichtigste File nach package.json
```

---

## Features

### Core Features (Die Basics)
- User profiles mit anpassbarem Bio und Bildern
- Posts (zeichenlimitiert, wie früher bei Twitter, bevor... naja)
- Replies und verschachtelte Konversationen
- Following/Followers System
- Likes und Reposts
- Real-time Notifications
- Direct Messaging (DMs)
- Globale Suche (User und Posts)

### Technical Features (Für die Nerds unter uns)
- Custom JWT Auth mit bcrypt
- Server-side Rendering (SSR)
- Infinite Scroll Pagination
- Optimistic UI Updates
- Dark/Light Mode (weil wir alle nachts coden)
- Responsive Design (mobile-first)
- HTTP/2 Support

---

## API Endpoints

31 API-Routes, organisiert nach Kategorie:

| Kategorie | Routes | Beschreibung |
|-----------|--------|--------------|
| **Authentication** | 3 | login, logout, verify |
| **Users** | 7 | CRUD, follow/unfollow |
| **Tweets** | 15 | CRUD, like/retweet/reply |
| **Messages** | 3 | Direct Messages |
| **Notifications** | 3 | Benachrichtigungen |
| **Search** | 1 | Globale Suche |

Full API Dokumentation: `/docs/API_CONSUMERS.md`

---

## Roadmap

### Phase 1 (v1.0) - COMPLETED
- Basic Social Features
- Direct Messaging
- User Profiles
- Premium Badges
- Production Deployment mit SSL

### Phase 2 (v1.1) - Coming Soon
- AI Content Detection Integration (die Ironie ist uns bewusst)
- Content Moderation Tools
- Enhanced Notification System
- Performance Optimization

### Phase 3 (v2.0) - The Dream
- Advanced AI Detection Models
- User Verification Process
- Creator Monetization
- Multi-language Support
- Video Support

---

## Credits

### Original Project

Dieses Projekt baut auf der exzellenten Arbeit von **Fatih Arapoglu's Twitter Clone** auf:

- **Repository:** https://github.com/fatiharapoglu/twitter
- **Author:** Fatih Arapoglu
- **License:** MIT License

Vielen Dank an den Original-Creator für diese solide Foundation!

### Technology Stack

Ein Dankeschön an alle, deren Schultern wir stehen:
- Next.js Team (Vercel)
- Prisma Team
- Material UI Team
- PostgreSQL Community
- Alle Open-Source Contributors

---

## License

MIT License - weil Sharing Caring ist.

**Original Project Attribution:**
Based on https://github.com/fatiharapoglu/twitter by Fatih Arapoglu (MIT License)

---

## Development Team

**Project Maintainer:** d.westermann@ol-mg.de

**Development Stack:**
- Architecture: @architect (AI Agent)
- Implementation: @builder (AI Agent)
- Validation: @validator (AI Agent)
- Documentation: @scribe (AI Agent)

*Ja, wir benutzen AI um eine Anti-AI Plattform zu bauen. Die Ironie ist uns nicht entgangen. Aber hey, unsere AI schreibt nur Code, keine Fake-Bilder.*

---

## Support & Contact

### Issues & Bugs
- Report via GitHub Issues

### Security
- Security Issues bitte direkt an: d.westermann@ol-mg.de

### Pro-Tipp
Wenn du einen Bug findest, der kein Bug ist, sondern ein Feature, dann hast du das Projekt verstanden.

---

<div align="center">

**Built with coffee, frustration, and an unhealthy amount of Stack Overflow.**

*Für das menschliche Internet.*

Last Updated: 2025-12-21

</div>
