# Deploying Uni Shuttle on a Contabo VPS

One Ubuntu server runs everything:

```
                 ┌──────────────────── Contabo VPS (Ubuntu 24.04) ────────────────────┐
 unishuttle.lk ──┤ Nginx :443 ──► Next.js web app  (pm2, 127.0.0.1:3000)              │
api.unishuttle.lk┤ Nginx :443 ──► Express API + Socket.IO (pm2, 127.0.0.1:5000) ──► PostgreSQL
                 └─────────────────────────────────────────────────────────────────────┘
 Mobile app ───────► https://api.unishuttle.lk/api   (and wss:// for live tracking)
```

Domain: `unishuttle.lk` (website, `www.unishuttle.lk`, API at `api.unishuttle.lk`). Commands run **on the server** unless a step says "on your PC".

---

## 1. Buy the server and the domain

1. **Contabo:** order a **Cloud VPS** (the entry plan, about 4 vCPU / 8 GB RAM, is plenty).
   - **Region:** pick the one closest to Sri Lanka, e.g. Singapore or India.
   - **Image:** Ubuntu 24.04.
   - Contabo emails you the server's **IP address** and **root password**.
2. **Domain:** buy one (a `.lk` from the LK Domain Registry, or a `.com` from any registrar).
3. **DNS:** in your domain's DNS settings, create these records pointing at the VPS IP:

   | Type | Name  | Value         |
   |------|-------|---------------|
   | A    | `@`   | `13.140.221.122` |
   | A    | `www` | `13.140.221.122` |
   | A    | `api` | `13.140.221.122` |

   DNS can take a few minutes to a few hours. HTTPS (step 8) only works once these resolve.

## 2. First login and basic security

On your PC:

```bash
ssh root@13.140.221.122
```

Logins use an SSH key (`C:\Users\Trevon\.ssh\id_ed25519` on your PC, added in Contabo under **Reset credentials → SSH-Key**). Two users:

- `root`: admin work (installing packages, Nginx, certificates). `ssh root@13.140.221.122`
- `deploy`: owns the code and runs the apps. It has no password and no sudo. `ssh deploy@13.140.221.122`

Create the app user with the same key, and allow key logins only:

```bash
adduser --disabled-password --gecos "" deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys

cat > /etc/ssh/sshd_config.d/00-hardening.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
sshd -t && systemctl reload ssh
```

Before closing your session, check in a second window that `ssh deploy@13.140.221.122` works.

Firewall: allow only SSH and web traffic. Ports 3000, 5000 and 5432 stay closed to the internet.

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 3. Install the software

As `root`:

```bash
apt update && apt upgrade -y
apt install -y git nginx postgresql build-essential unattended-upgrades certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
node -v   # should print v22.x
```

## 4. Database

Generate a strong password and create the database:

```bash
openssl rand -hex 24          # copy this, it's your DB password
sudo -u postgres psql -c "CREATE USER unishuttle WITH PASSWORD 'PASTE_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE unishuttle OWNER unishuttle;"
```

PostgreSQL installed this way only listens on the server itself, so it is not reachable from the internet.

## 5. Get the code

The repository is private, so the server reads it with its own **read-only deploy key**. As `deploy`:

```bash
ssh-keygen -q -t ed25519 -N "" -C "unishuttle-server" -f ~/.ssh/github_deploy
printf 'Host github.com\n  IdentityFile ~/.ssh/github_deploy\n  IdentitiesOnly yes\n' > ~/.ssh/config
chmod 600 ~/.ssh/config
cat ~/.ssh/github_deploy.pub
```

Add the printed key on GitHub under **Repo → Settings → Deploy keys → Add deploy key**, with "Allow write access" **unticked**. Then:

```bash
cd ~
git clone git@github.com:trevonakesh/University_Shuttle.git
```

## 6. Backend (API)

```bash
cd ~/University_Shuttle/backend
npm ci
npx prisma generate
nano .env
```

Paste this into `.env` and fill in the values:

```env
DATABASE_URL=postgresql://unishuttle:PASTE_DB_PASSWORD@localhost:5432/unishuttle
# New secret for production; never reuse your local one.
# Generate: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET=PASTE_A_96_CHARACTER_RANDOM_STRING
PORT=5000
TRUST_PROXY=1

# PayHere (live account)
PAYHERE_MERCHANT_ID=
PAYHERE_MERCHANT_SECRET=
PAYHERE_MODE=live
PUBLIC_URL=https://api.unishuttle.lk
APP_PUBLIC_URL=https://api.unishuttle.lk

# Email (any SMTP provider: Brevo, Resend, Amazon SES, Gmail App Password...)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="Uni Shuttle <no-reply@unishuttle.lk>"
EMAIL_REPLY_TO=info@unishuttle.lk
BUSINESS_INBOX_EMAIL=info@unishuttle.lk
WEB_APP_URL=https://unishuttle.lk
```

Save with `Ctrl+O`, then `Enter`, then `Ctrl+X`. Then create the tables and your admin account. Use a real email and a strong password, **not** `admin123`:

```bash
chmod 600 .env
npx prisma db push
ADMIN_EMAIL=info@unishuttle.lk ADMIN_PASSWORD='a-long-strong-password' npx ts-node --transpile-only seedAdmin.ts
```

Don't run `seedDemo.ts` on the live server: it deletes all data first.

## 7. Web app

```bash
cd ~/University_Shuttle/web-app
echo "NEXT_PUBLIC_API_URL=https://api.unishuttle.lk" > .env.local
npm ci
npm run build
```

`NEXT_PUBLIC_API_URL` is baked in at build time, so rebuild whenever it changes.

## 8. Keep both apps running (pm2)

Create `~/ecosystem.config.js`:

```bash
nano ~/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: 'unishuttle-api',
      cwd: '/home/deploy/University_Shuttle/backend',
      script: 'node_modules/ts-node/dist/bin.js',
      args: '--transpile-only src/index.ts',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'unishuttle-web',
      cwd: '/home/deploy/University_Shuttle/web-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      env: { NODE_ENV: 'production' }
    }
  ]
};
```

Start them, and make them come back after a reboot:

As `deploy`:

```bash
pm2 start ~/ecosystem.config.js
pm2 save
pm2 status             # both should be "online"
pm2 logs unishuttle-api --lines 30
```

Then once, as `root`, so pm2 starts the apps after a reboot:

```bash
pm2 startup systemd -u deploy --hp /home/deploy
```

The API log should show `Server is running` and the email mode. If it says `JWT_SECRET must be set…`, fix `.env` and run `pm2 restart unishuttle-api`.

## 9. Nginx and HTTPS

As `root`:

```bash
nano /etc/nginx/sites-available/unishuttle
```

```nginx
# Lets live tracking (WebSockets) pass through.
map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

# Requests by bare IP or an unknown name get no answer.
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  return 444;
}

server {
  listen 80;
  listen [::]:80;
  server_name api.unishuttle.lk;
  client_max_body_size 6m;   # uploads are capped at 5 MB

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 75s;
  }
}

server {
  listen 80;
  listen [::]:80;
  server_name unishuttle.lk www.unishuttle.lk;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Enable it and get free HTTPS certificates. Certbot edits the config and renews the certificates automatically:

```bash
ln -sf /etc/nginx/sites-available/unishuttle /etc/nginx/sites-enabled/unishuttle
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
# Only once all three DNS names point at the server:
certbot --nginx -d unishuttle.lk -d www.unishuttle.lk -d api.unishuttle.lk \
  -m info@unishuttle.lk --agree-tos --redirect
```

Check:

```bash
curl https://api.unishuttle.lk/            # → LankaTrip API is running!
curl https://api.unishuttle.lk/api/settings/public
```

Then open `https://unishuttle.lk` and `https://unishuttle.lk/login` (admin) in a browser.

## 10. PayHere (live payments)

1. In your **live** PayHere merchant account, go to **Settings → Domains & Credentials** and add `api.unishuttle.lk`. Students open the checkout page on that domain.
2. Copy the merchant ID and the merchant secret PayHere generates for that domain into `backend/.env`. Set `PAYHERE_MODE=live`.
3. Run `pm2 restart unishuttle-api`.
4. Make one small real payment end to end: the student pays, the fare shows PAID, and the driver's wallet goes up.

PayHere's notify callback goes to `https://api.unishuttle.lk/api/payments/notify`, which is why `PUBLIC_URL` must be the public HTTPS address.

## 11. Mobile app

On your PC, the app still points at `localhost`. In `mobile-app/lib/services/api_service.dart`, change `baseUrl` to return the live API for release builds:

```dart
static String get baseUrl => 'https://api.unishuttle.lk/api';
```

Then build a signed release. You need your own upload keystore; see Flutter's "Build and release an Android app" guide.

```bash
cd mobile-app
flutter build appbundle --release   # for the Play Store
flutter build apk --release         # for direct installs
```

## 12. Backups (do not skip)

Back up the database (all payments and accounts) and the uploaded photos every night, and keep 14 days:

As `root`:

```bash
mkdir -p /var/backups/unishuttle && chmod 700 /var/backups/unishuttle
nano /etc/cron.d/unishuttle-backup
```

```cron
0 2 * * * root sudo -u postgres pg_dump unishuttle | gzip > /var/backups/unishuttle/db-$(date +\%F).sql.gz
15 2 * * * root tar czf /var/backups/unishuttle/uploads-$(date +\%F).tar.gz -C /home/deploy/University_Shuttle/backend uploads 2>/dev/null
30 2 * * * root find /var/backups/unishuttle -mtime +14 -delete
```

Those backups live on the same server. Also keep copies elsewhere, for example by downloading them weekly or using Contabo's snapshot / auto-backup add-on, in case the VPS itself is lost. From your PC:

```bash
scp -r root@13.140.221.122:/var/backups/unishuttle ./unishuttle-backups
```

Restore a database backup (as `root`):

```bash
gunzip -c db-YYYY-MM-DD.sql.gz | sudo -u postgres psql unishuttle
```

## 13. Deploying updates

After pushing changes to GitHub, log in as `deploy` (`ssh deploy@13.140.221.122`):

```bash
cd ~/University_Shuttle && git pull

cd backend && npm ci && npx prisma generate && npx prisma db push
pm2 restart unishuttle-api

cd ../web-app && npm ci && npm run build
pm2 restart unishuttle-web
```

`prisma db push` warns before anything that would delete data. Read the warning, and take a backup first, before accepting it.

## 14. Day-to-day commands

| What | Command |
|---|---|
| Are the apps up? | `pm2 status` |
| API logs / errors | `pm2 logs unishuttle-api` |
| Web logs | `pm2 logs unishuttle-web` |
| Restart after editing `.env` | `pm2 restart unishuttle-api` |
| Nginx errors | `sudo tail -f /var/log/nginx/error.log` |
| Disk space | `df -h` |
| Security updates | `sudo apt update && sudo apt upgrade -y` (monthly) |

## Launch checklist

- [ ] DNS records resolve and HTTPS works for all three hostnames
- [ ] `JWT_SECRET` in the server `.env` is new and random (96 characters)
- [ ] Admin account uses a strong password (not `admin123`)
- [ ] PayHere is live, the domain is approved, and one real test payment went through
- [ ] SMTP is configured; sign up a test account and check the welcome email arrives
- [ ] `WEB_APP_URL` is your real site, so links in emails work
- [ ] Mobile release build points at `https://api.unishuttle.lk/api`
- [ ] Nightly backups exist in `/var/backups/unishuttle`, with a copy off the server
- [ ] `ufw status` shows only OpenSSH and Nginx Full allowed
