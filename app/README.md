# Humans Only - Anti-AI Social Media Platform

A social media platform built on transparency and human authenticity. Humans Only is a community where only verified human-created content is allowed.

**Live at:** https://ho.nm-forum.de

---

## Project Philosophy

In an era of AI-generated content flooding the internet, Humans Only provides a sanctuary for authentic human interaction. Our mission:

- **AI-Free Zone**: Only human-created content allowed
- **Transparency First**: Clear verification of human authenticity
- **Community Trust**: Built on mutual respect and genuine connections
- **Privacy Focused**: Your data stays protected

---

## Tech Stack

### Core
- **Framework**: Next.js 14.2.33 (React 18)
- **Language**: TypeScript 5.0
- **Database**: PostgreSQL 16
- **ORM**: Prisma 4.14

### Frontend
- **UI Library**: Material UI 5.13
- **Styling**: SCSS/Sass
- **Animations**: Framer Motion 10.12
- **State Management**: TanStack React Query 4.29
- **Forms**: Formik 2.2 + Yup 1.1

### Backend
- **Authentication**: Clerk-first (App Router) with legacy JWT fallback bridge
- **API**: Next.js API Routes
- **Storage**: Supabase (for media uploads)

### Infrastructure (Production)
- **Server**: Ubuntu 24.04 (Node.js 20.19)
- **Process Manager**: PM2 with systemd
- **Web Server**: Nginx 1.24 with HTTP/2
- **SSL**: Let's Encrypt (Certbot)
- **Database**: PostgreSQL 16.11

---

## Features

### Core Features
- User Profiles with customizable bio and images
- Posts and Replies (character-limited)
- Following/Followers system
- Likes and Reposts (with undo support)
- Real-time Notifications
- Global Search (users and posts)
- Direct Messaging (DMs)
- Image Support (posts, replies, profile, header)
- Emoji Support (Emoji Mart)

### Premium Features
- Verified Badge ("Humans Only Blue")
- Premium-only features (coming soon)

### Technical Features
- Clerk-first session auth with legacy JWT compatibility for migration routes
- Real-time data fetching with React Query
- Infinite Scroll pagination
- Optimistic UI updates
- Dark/Light mode
- Responsive design (mobile-first)
- Full Next.js 13+ App Router
- Server-side rendering (SSR)

---

## Quick Start

### Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Node.js | 18.x+ | `node --version` |
| npm | 9.x+ | `npm --version` |
| PostgreSQL | 14.x+ | `psql --version` |

### Local Development Setup

#### 1. Clone Repository
```bash
cd /path/to/your/projects
git clone [YOUR-REPO-URL] humansonly
cd humansonly
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Database Setup

**Option A: Local PostgreSQL**
```bash
# macOS (Homebrew)
brew services start postgresql@16
createdb humansonly_dev

# Linux
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE humansonly_dev;"
```

**Option B: Docker**
```bash
docker run --name humansonly-postgres \
  -e POSTGRES_PASSWORD=dev_password_2024 \
  -e POSTGRES_DB=humansonly_dev \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### 4. Environment Configuration

Create `.env` file in project root:

```env
# DATABASE
DATABASE_URL="postgresql://[USER]:[PASSWORD]@localhost:5432/humansonly_dev?schema=public"
DIRECT_DATABASE_URL="postgresql://[USER]:[PASSWORD]@localhost:5432/humansonly_dev?schema=public"

# AUTHENTICATION
JWT_SECRET_KEY="your_jwt_secret_key_here"
CREATION_SECRET_KEY="your_creation_secret_here"
BLUE_SECRET_KEY="thanksforcaring"

# APPLICATION
NEXT_PUBLIC_HOST_URL="http://localhost:3000"
NODE_ENV="development"
PORT=3000

# STORAGE (Supabase)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_KEY="your_supabase_anon_key"
NEXT_PUBLIC_STORAGE_URL="your_supabase_storage_url"
UPLOAD_STORAGE_PROVIDER="auto"
UPLOAD_MAX_FILES_PER_DAY="40"
UPLOAD_MAX_BYTES_PER_DAY="262144000"
UPLOAD_MAX_REQUEST_BYTES="54525952"
UPLOAD_ALLOWED_MEDIA_HOSTS="cdn.example.com"
```

**Note:** For Supabase credentials, create a free project at https://supabase.com

Create `.env.local` for Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="YOUR_PUBLISHABLE_KEY"
CLERK_SECRET_KEY="YOUR_SECRET_KEY"
```

#### 5. Database Migration
```bash
cd src
npx prisma migrate dev --name init
npx prisma generate
cd ..
```

#### 6. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## Available Scripts

```bash
npm run dev         # Start development server (localhost:3000)
npm run build       # Production build
npm run start       # Start production server
npm run lint        # Run ESLint
```

---

## Production Deployment

Deployed on Ubuntu 24.04 VPS with PM2 and Nginx.

See detailed deployment documentation:
- **Full Guide**: `/docs/DEPLOYMENT.md`
- **Architecture**: `/docs/ARCHITECTURE.md`

### Quick Deployment Commands

```bash
# On server
cd /var/www/humansonly
git pull origin main
npm ci
npm run build
cd src && npx prisma migrate deploy
pm2 restart humansonly --update-env
```

### Production URLs
- **Live Site**: https://ho.nm-forum.de
- **Server**: 5.182.17.148 (Ubuntu 24.04)

---

## Project Structure

```
humansonly/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (pages)/        # Page components
│   │   ├── api/            # API routes
│   │   └── globals.scss    # Global styles
│   ├── components/          # React components
│   │   ├── common/         # Shared components
│   │   ├── forms/          # Form components
│   │   └── layout/         # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── utilities/          # Utility functions
│   ├── types/              # TypeScript types
│   ├── schema.prisma       # Prisma database schema
│   └── middleware.ts       # Next.js middleware
├── public/                 # Static assets
├── docs/                   # Documentation
├── ecosystem.config.js     # PM2 configuration
├── .env                    # Environment variables (not in git)
└── package.json
```

---

## Database Schema

### Core Tables
- **User**: User accounts and profiles
- **Tweet**: Posts/tweets
- **Like**: Tweet likes
- **Retweet**: Tweet reposts
- **Follower**: Following relationships
- **Notification**: User notifications
- **Message**: Direct messages
- **Conversation**: DM conversations

See full schema: `/src/schema.prisma`

---

## API Routes

### Authentication
- `POST /api/auth/clerk/bridge` - Sync Clerk session to legacy cookie
- `POST /api/auth/login` - Login
- `GET /api/auth/logout` - Logout
- `GET /api/auth/session` - Canonical session payload (`source: clerk|legacy|null`)
- `POST /api/auth/verify` - Verify legacy JWT payload (compatibility)

### Users
- `GET /api/users/[username]` - Get user profile
- `PATCH /api/users/[username]` - Update profile
- `GET /api/users/[username]/followers` - Get followers
- `GET /api/users/[username]/following` - Get following

### Tweets
- `POST /api/tweets` - Create tweet
- `GET /api/tweets/[id]` - Get tweet
- `DELETE /api/tweets/[id]` - Delete tweet
- `POST /api/tweets/[id]/like` - Like tweet
- `POST /api/tweets/[id]/retweet` - Retweet

### Messages
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/[id]` - Get conversation

Full API documentation: `/docs/API_CONSUMERS.md`

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `DIRECT_DATABASE_URL` | Direct Prisma connection string for migrate/validate | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET_KEY` | JWT signing secret | Random 64-char hex string |
| `CREATION_SECRET_KEY` | Account creation secret | Random 64-char hex string |
| `BLUE_SECRET_KEY` | Premium verification code | `thanksforcaring` |
| `NEXT_PUBLIC_HOST_URL` | App URL | `https://ho.nm-forum.de` |
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Server port | `3000` (dev), `3001` (prod) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase anon key | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server upload key (optional managed storage) | From Supabase dashboard |
| `SUPABASE_STORAGE_BUCKET` | Supabase bucket for media uploads | `humansonly-media` |
| `UPLOAD_STORAGE_PROVIDER` | Upload backend mode | `local`, `supabase`, or `auto` |
| `UPLOAD_MAX_FILES_PER_DAY` | Per-user upload count limit (24h) | `40` |
| `UPLOAD_MAX_BYTES_PER_DAY` | Per-user upload byte budget (24h) | `262144000` |
| `UPLOAD_MAX_REQUEST_BYTES` | Hard request cap for multipart upload body | `54525952` |
| `UPLOAD_ALLOWED_MEDIA_HOSTS` | Optional comma-separated host allowlist for external media URLs | `cdn.example.com,images.example.com` |

---

## Development Workflow

### Creating New Features
1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature
3. Test locally: `npm run dev`
4. Build test: `npm run build`
5. Create pull request

### Database Changes
1. Modify `/src/schema.prisma`
2. Create migration: `npx prisma migrate dev --name migration_name`
3. Test migration locally
4. Deploy to production: `npx prisma migrate deploy`

### Deploying to Production
1. Push to main branch
2. SSH into server: `ssh root@5.182.17.148`
3. Pull changes: `cd /var/www/humansonly && git pull`
4. Install & build: `npm ci && npm run build`
5. Restart app: `pm2 restart humansonly --update-env`

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check PostgreSQL status
systemctl status postgresql  # Linux
brew services list            # macOS
```

### Prisma Issues
```bash
# Regenerate Prisma Client
cd src && npx prisma generate

# Reset database (DEV ONLY!)
npx prisma migrate reset
```

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Commit Convention
```
feat: New feature
fix: Bug fix
docs: Documentation changes
style: Code style/formatting
refactor: Code refactoring
test: Test additions/changes
chore: Maintenance tasks
```

---

## Security

### Reporting Vulnerabilities
Please email security issues to: d.westermann@ol-mg.de

### Security Features
- Bcrypt password hashing (salt rounds: 10)
- JWT token authentication
- HTTPS-only in production
- SQL injection protection (Prisma)
- XSS protection (React built-in)
- CSRF protection (Next.js middleware)

---

## Performance

### Optimization Techniques
- Server-side rendering (SSR)
- Static page generation where possible
- Image optimization (Next.js Image)
- Code splitting (React.lazy)
- Infinite scroll (virtualization)
- React Query caching
- Optimistic UI updates

### Production Metrics
- Bundle size: ~87.5 kB (First Load JS)
- Static pages: 27 pre-rendered
- Lighthouse Score: (TBD - run audit)

---

## License

This project is licensed under the MIT License.

### Original Project Attribution
This project is built upon the excellent work of Fatih Arapoglu's Twitter Clone:
- **Original Repository**: https://github.com/fatiharapoglu/twitter
- **Original Author**: Fatih Arapoglu
- **Original License**: MIT License

Thank you to the original creator for providing such a solid foundation!

---

## Credits & Acknowledgements

### Original Creator
- **Fatih Arapoglu** - Original Twitter Clone
  - GitHub: https://github.com/fatiharapoglu
  - Portfolio: https://fatiharapoglu.com.tr
  - LinkedIn: https://www.linkedin.com/in/fatiharapoglu/

### Technology Providers
- Next.js Team (Vercel)
- Prisma Team
- Material UI Team
- Supabase Team
- All open-source contributors

### Fonts
- Google Fonts (Poppins & Roboto)

---

## Contact & Support

### Project Maintainer
- **Email**: d.westermann@ol-mg.de
- **Project Repository**: [YOUR-REPO-URL]

### Community
- Report issues: [YOUR-REPO-URL]/issues
- Discussions: [YOUR-REPO-URL]/discussions

---

## Roadmap

### Current Phase (v1.0)
- [x] Basic social features (posts, likes, follows)
- [x] Direct messaging
- [x] User profiles
- [x] Premium badges
- [x] Production deployment
- [x] SSL/HTTPS

### Near Future (v1.1)
- [ ] AI content detection API integration
- [ ] Content moderation tools
- [ ] Enhanced notification system
- [ ] Performance optimization
- [ ] Mobile app (PWA)

### Future Enhancements (v2.0)
- [ ] Advanced AI detection models
- [ ] User verification process
- [ ] Monetization features
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Video support
- [ ] Polls and surveys

---

**Built with care for the human internet.**

Last updated: 2025-12-21
