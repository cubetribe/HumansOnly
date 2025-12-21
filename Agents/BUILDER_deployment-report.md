# HumansOnly - VPS Deployment Report

**Date:** 2025-12-21
**Server:** 5.182.17.148 (Ubuntu 24.04)
**Domain:** https://ho.nm-forum.de
**Status:** ERFOLGREICH DEPLOYED

---

## Deployment-Zusammenfassung

Die HumansOnly App wurde erfolgreich auf dem VPS Server deployed und ist unter https://ho.nm-forum.de erreichbar.

### Deployed Services
- **Application:** Next.js 14.2.33 (Production Build)
- **Database:** PostgreSQL 16.11
- **Process Manager:** PM2 (mit systemd startup)
- **Web Server:** Nginx 1.24.0 mit HTTP/2
- **SSL/TLS:** Let's Encrypt (gültig bis 2026-03-21)

---

## 1. Server-Vorbereitung

### Installierte Software
```bash
- Node.js: v20.19.6
- npm: 10.8.2
- PostgreSQL: 16.11
- Nginx: 1.24.0
- PM2: Latest (Global)
- Certbot: 2.9.0
- Build-Tools: gcc, g++, make
```

### System-Update
```bash
apt update && apt upgrade -y
# 46 Pakete aktualisiert
# Kernel-Update verfügbar (6.8.0-90)
```

---

## 2. Datenbank-Konfiguration

### PostgreSQL Setup
```sql
Database: humansonly_prod
User: humansonly_user
Password: HumansOnly2024Prod
Host: localhost
Port: 5432
```

### Prisma Migrationen
Alle 13 Migrationen erfolgreich angewendet:
- 20230415232240_init
- 20230427185458_
- 20230428110554_
- 20230430162624_
- 20230502140912_
- 20230502161449_
- 20230503164723_
- 20230504164320_
- 20230506185544_
- 20230507151031_
- 20230508165206_
- 20230511000542_
- 20230511161421_

**Status:** Alle Datenbanktabellen erstellt und einsatzbereit

---

## 3. Application Deployment

### File Transfer
```bash
Method: rsync über SSH
Files: 259 Dateien (5.5 MB)
Excludes: node_modules, .next, .git, .env
Location: /var/www/humansonly/
```

### Environment Configuration
**File:** `/var/www/humansonly/.env`

```env
# DATABASE
DATABASE_URL="postgresql://humansonly_user:HumansOnly2024Prod@localhost:5432/humansonly_prod?schema=public"
DIRECT_DATABASE_URL="postgresql://humansonly_user:HumansOnly2024Prod@localhost:5432/humansonly_prod?schema=public"

# AUTHENTICATION
JWT_SECRET_KEY="e5ec0b9bc32f87c249e0558edae080866901033d338e958f7424ae4b219ec294"
CREATION_SECRET_KEY="779ef1c1941c2d795ff1b02300725def1d8a7c85c4e13084fb6560fcb89a9744"
BLUE_SECRET_KEY="humansonly_blue_2024"

# APPLICATION
NEXT_PUBLIC_HOST_URL="https://ho.nm-forum.de"
NODE_ENV="production"
PORT=3001

# STORAGE (Placeholder - Upload-Feature temporär deaktiviert)
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
NEXT_PUBLIC_SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_STORAGE_URL="https://placeholder.supabase.co/storage/v1/object/public/"
```

**Hinweis:** Supabase-Credentials sind Platzhalter. Für File-Upload-Funktionalität echte Credentials eintragen.

### Build Process
```bash
cd /var/www/humansonly
npm ci                    # 479 Pakete installiert
cd src && npx prisma generate  # Prisma Client generiert
npm run build            # Production Build erfolgreich

Build Output:
- 27 Static Pages generiert
- Route Optimization: ✓
- Middleware: 26.8 kB
- First Load JS: 87.5 kB (shared)
```

### PM2 Process Manager
```bash
Process Name: humansonly
Script: npm start
Working Dir: /var/www/humansonly
Node Version: 20.19.6
Port: 3001
Status: online
Restart Policy: on-failure
Startup: systemd (enabled)
```

**PM2 Kommandos:**
```bash
pm2 status              # Status anzeigen
pm2 logs humansonly     # Logs anzeigen
pm2 restart humansonly  # App neustarten
pm2 stop humansonly     # App stoppen
pm2 start humansonly    # App starten
```

---

## 4. Nginx Reverse Proxy

### Configuration
**File:** `/etc/nginx/sites-available/humansonly`

```nginx
server {
    listen 80;
    server_name ho.nm-forum.de;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }

    location /storage/ {
        alias /var/www/humansonly/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /_next/static/ {
        alias /var/www/humansonly/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**SSL von Certbot automatisch hinzugefügt**

---

## 5. SSL/TLS Zertifikat

### Let's Encrypt via Certbot
```bash
Domain: ho.nm-forum.de
Certificate: /etc/letsencrypt/live/ho.nm-forum.de/fullchain.pem
Private Key: /etc/letsencrypt/live/ho.nm-forum.de/privkey.pem
Valid Until: 2026-03-21
Auto-Renew: Enabled (systemd timer)
```

**HTTP/2 aktiviert:** ✓
**HTTPS Redirect:** ✓ (automatisch von Certbot)

---

## 6. Firewall (UFW)

### Konfiguration
```bash
Status: active
Enabled on startup: yes

Allowed Ports:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
- 19999 (Netdata - bereits vorhanden)
```

---

## 7. Probleme & Lösungen

### Problem 1: PostgreSQL Authentifizierung
**Fehler:** P1000 - Authentication failed
**Ursache:** Sonderzeichen im Passwort (!), nicht korrekt escaped
**Lösung:** Passwort auf alphanumerisch geändert (HumansOnly2024Prod)

### Problem 2: Port 3000 belegt
**Fehler:** EADDRINUSE: address already in use :::3000
**Ursache:** Docker nutzt bereits Port 3000
**Lösung:** App-Port auf 3001 geändert (.env: PORT=3001)

### Problem 3: Supabase Credentials
**Fehler:** Build-Fehler wegen fehlender Supabase-Credentials
**Ursache:** Storage-Utility erwartet zwingend Supabase-Env-Vars
**Lösung:** Placeholder-Werte eingetragen (Upload-Feature temporär inaktiv)

### Problem 4: PM2 Environment Update
**Fehler:** .env-Änderungen wurden nicht geladen
**Ursache:** PM2 cached alte Environment-Variablen
**Lösung:** `pm2 restart humansonly --update-env` verwenden

---

## 8. Deployment-Verifikation

### Funktionstests
| Test | Status | Details |
|------|--------|---------|
| HTTP Access | ✓ | http://ho.nm-forum.de → 307 Redirect zu /login |
| HTTPS Access | ✓ | https://ho.nm-forum.de → 307 Redirect zu /login |
| SSL Certificate | ✓ | Valid bis 2026-03-21 |
| HTTP/2 | ✓ | HTTP/2 aktiviert |
| Database Connection | ✓ | PostgreSQL verbunden, 13 Migrationen applied |
| PM2 Process | ✓ | Online, Auto-Restart enabled |
| Nginx Proxy | ✓ | Requests an Port 3001 weitergeleitet |
| Firewall | ✓ | Ports 22, 80, 443 offen |

### Final Check
```bash
# Local Test
curl -I https://ho.nm-forum.de
# Response: HTTP/2 307 → /login ✓

# Server Test
ssh root@5.182.17.148
curl -I http://localhost:3001
# Response: HTTP/1.1 307 → /login ✓
```

---

## 9. Post-Deployment Aufgaben

### WICHTIG - Noch zu erledigen:

#### A) Supabase Storage einrichten
Die App nutzt Supabase für File-Uploads (Bilder, etc.). Aktuell sind nur Placeholder-Werte gesetzt.

**Optionen:**
1. **Supabase Project erstellen:**
   - Account auf https://supabase.com erstellen
   - Neues Projekt anlegen
   - Storage Bucket "media" erstellen
   - URL und Key in .env eintragen

2. **Alternative: Lokaler File Storage**
   - Code in `src/utilities/storage/index.ts` anpassen
   - Upload-Ordner: `/var/www/humansonly/public/uploads/`
   - Permissions: `chown -R www-data:www-data public/uploads`

**Aktueller Status:** Upload-Feature funktioniert NICHT (Placeholder-Credentials)

#### B) Datenbank-Backups einrichten
```bash
# Beispiel Backup-Script
pg_dump -U humansonly_user -h localhost humansonly_prod > backup_$(date +%F).sql

# Cron Job (täglich 2:00 Uhr)
0 2 * * * /usr/bin/pg_dump -U humansonly_user -h localhost humansonly_prod > /var/backups/humansonly_$(date +\%F).sql
```

#### C) Monitoring einrichten
PM2 bietet integriertes Monitoring:
```bash
pm2 install pm2-logrotate  # Log-Rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

#### D) Security Hardening
- [ ] PostgreSQL Remote-Zugriff deaktivieren (falls nicht benötigt)
- [ ] Fail2ban für SSH/Nginx konfigurieren
- [ ] Security Headers in Nginx (CSP, HSTS, etc.)
- [ ] Rate Limiting in Nginx

---

## 10. Wartung & Management

### App Updates deployen
```bash
# 1. Lokal builden und testen
cd /Users/denniswestermann/Desktop/Coding\ Projekte/HumansOnly/app
npm run build

# 2. Neue Dateien hochladen
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude '.env' \
  ./ root@5.182.17.148:/var/www/humansonly/

# 3. Auf Server: Dependencies & Build
ssh root@5.182.17.148
cd /var/www/humansonly
npm ci
npm run build

# 4. PM2 neu starten
pm2 restart humansonly --update-env
pm2 save
```

### Datenbank-Migrationen
```bash
ssh root@5.182.17.148
cd /var/www/humansonly/src

# Migration erstellen (lokal)
npx prisma migrate dev --name migration_name

# Migration deployen (Server)
npx prisma migrate deploy
```

### Logs anschauen
```bash
# PM2 Logs
pm2 logs humansonly --lines 100

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL Logs
tail -f /var/log/postgresql/postgresql-16-main.log
```

### Performance Monitoring
```bash
# PM2 Monitoring
pm2 monit

# Disk Space
df -h

# Memory Usage
free -h

# Database Size
sudo -u postgres psql -c "\l+ humansonly_prod"
```

---

## 11. Zugangsdaten & Wichtige Pfade

### SSH Access
```bash
Host: 5.182.17.148
User: root
Password: vyWGV2Wy4TCtgI77qW8o0Dxb
SSH: ssh root@5.182.17.148
```

### Database
```bash
Host: localhost
Port: 5432
Database: humansonly_prod
User: humansonly_user
Password: HumansOnly2024Prod

# Connect:
PGPASSWORD='HumansOnly2024Prod' psql -h localhost -U humansonly_user -d humansonly_prod
```

### Important Paths
```bash
Application: /var/www/humansonly/
Nginx Config: /etc/nginx/sites-available/humansonly
SSL Cert: /etc/letsencrypt/live/ho.nm-forum.de/
PM2 Logs: /root/.pm2/logs/
Uploads: /var/www/humansonly/public/uploads/
.env File: /var/www/humansonly/.env
```

---

## 12. Nützliche Befehle

### PM2
```bash
pm2 list                      # Alle Prozesse
pm2 info humansonly           # Details
pm2 logs humansonly           # Live Logs
pm2 logs humansonly --lines 50  # Letzte 50 Zeilen
pm2 restart humansonly        # Restart
pm2 stop humansonly           # Stop
pm2 delete humansonly         # Remove
pm2 save                      # Config speichern
pm2 resurrect                 # Nach Reboot wiederherstellen
```

### Nginx
```bash
nginx -t                      # Config testen
systemctl reload nginx        # Config neu laden
systemctl restart nginx       # Nginx neustarten
systemctl status nginx        # Status
tail -f /var/log/nginx/access.log  # Access Log
tail -f /var/log/nginx/error.log   # Error Log
```

### PostgreSQL
```bash
systemctl status postgresql   # Status
sudo -u postgres psql         # Als postgres connecten
\l                           # Datenbanken auflisten
\c humansonly_prod           # Datenbank wechseln
\dt                          # Tabellen anzeigen
\du                          # User anzeigen
```

### SSL/Certbot
```bash
certbot certificates          # Zertifikate anzeigen
certbot renew --dry-run      # Renewal testen
certbot renew                # Manuell erneuern
```

---

## 13. Troubleshooting

### App startet nicht
```bash
# Logs prüfen
pm2 logs humansonly --lines 100

# Häufige Ursachen:
# - Port belegt: lsof -i :3001
# - DB nicht erreichbar: pg_isready -h localhost
# - .env Fehler: cat /var/www/humansonly/.env
# - Build-Fehler: cd /var/www/humansonly && npm run build
```

### 502 Bad Gateway
```bash
# PM2 Prozess läuft?
pm2 status

# Port erreichbar?
curl http://localhost:3001

# Nginx Config OK?
nginx -t

# Nginx läuft?
systemctl status nginx
```

### Database Connection Error
```bash
# PostgreSQL läuft?
systemctl status postgresql

# Connection String korrekt?
cat /var/www/humansonly/.env | grep DATABASE_URL

# User hat Rechte?
sudo -u postgres psql -c "\du humansonly_user"

# Manuell connecten
PGPASSWORD='HumansOnly2024Prod' psql -h localhost -U humansonly_user -d humansonly_prod
```

---

## 14. Performance-Optimierung (Optional)

### PostgreSQL Tuning
```bash
# /etc/postgresql/16/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

### Nginx Caching
```nginx
# Static Asset Caching (bereits konfiguriert)
location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### PM2 Cluster Mode (Für hohe Last)
```bash
# Aktuell: Fork Mode (1 Instanz)
# Bei Bedarf: Cluster Mode (mehrere Instanzen)
pm2 delete humansonly
pm2 start npm --name humansonly -i max -- start
```

---

## 15. Zusammenfassung

### Deployment Status: ERFOLGREICH ✓

**URL:** https://ho.nm-forum.de
**Status:** Online und erreichbar
**SSL:** Gültig bis 2026-03-21
**Database:** PostgreSQL 16.11 (13 Migrationen applied)
**Runtime:** Node.js 20.19.6
**Process Manager:** PM2 (Auto-Restart enabled)

### Einschränkungen:
- **File-Upload:** Nicht funktional (Supabase Placeholder-Credentials)
- **Kernel-Update:** Verfügbar (6.8.0-90), Reboot empfohlen
- **Dependencies:** 2 Vulnerabilities (1 moderate, 1 high) - `npm audit fix` empfohlen

### Nächste Schritte:
1. Supabase Storage einrichten ODER lokalen File-Upload implementieren
2. Datenbank-Backup-Strategie implementieren
3. Monitoring/Alerting einrichten
4. Security Hardening durchführen
5. Performance-Optimierung bei Bedarf

---

**Deployment completed:** 2025-12-21 17:56 CET
**Total Duration:** ~25 Minuten
**Builder:** Claude Code (Sonnet 4.5)
