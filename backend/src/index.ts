// Must stay the first import: modules below (e.g. the Prisma client) read
// process.env as soon as they load.
import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { Pool } from 'pg';
import { setupSockets } from './socketHandler';
import { assertJwtSecret } from './utils/jwt';

// Refuse to start with a missing or weak JWT secret: anyone could forge logins.
try {
  assertJwtSecret();
} catch (err) {
  console.error(`\n[startup] ${(err as Error).message}\n`);
  process.exit(1);
}

const app: Express = express();

// Behind a reverse proxy / load balancer, set TRUST_PROXY (e.g. 1 = one hop)
// so req.ip is the visitor's address. Rate limits are per IP and would
// otherwise lump every visitor together as the proxy.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isInteger(hops) ? hops : process.env.TRUST_PROXY);
}
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.io for Real-Time Features
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup WebSockets
setupSockets(io);

import authRoutes from './routes/authRoutes';
import busRoutes from './routes/busRoutes';
import requestRoutes from './routes/requestRoutes';
import paymentRoutes from './routes/paymentRoutes';
import noticeRoutes from './routes/noticeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import pollRoutes from './routes/pollRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import contactRoutes from './routes/contactRoutes';
import fareRoutes from './routes/fareRoutes';
import payoutRequestRoutes from './routes/payoutRequestRoutes';
import dailyRideRoutes from './routes/dailyRideRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { startFareReminderJob } from './fareReminders';
import { logEmailMode } from './services/email';
import path from 'path';

// Middleware
app.use(cors());
app.use(express.json());
// PayHere's notify callback posts form-encoded data
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/payout-requests', payoutRequestRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/daily-rides', dailyRideRoutes);
app.use('/api/settings', settingsRoutes);

// Serve uploaded images. Only image files are served, and the headers stop a
// browser from sniffing them into something runnable (HTML, script) even if
// a bad file ever reached the folder.
const IMAGE_FILE = /^\/[\w.-]+\.(jpe?g|png|webp|gif)$/i;
app.use(
  '/uploads',
  (req, res, next) => (IMAGE_FILE.test(req.path) ? next() : res.status(404).end()),
  express.static(path.join(__dirname, '../uploads'), {
    dotfiles: 'ignore',
    index: false,
    setHeaders: res => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    }
  })
);

// PostgreSQL database configuration (to be updated with real credentials)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lankatrip',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Error handling middleware
// Full details go to the server log only; the client gets a plain message.
// Client mistakes caught by middleware (bad JSON, body too large) keep their
// 4xx status instead of being reported as a server crash.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = Number(err?.status || err?.statusCode);
  if (status >= 400 && status < 500) {
    const message =
      err.type === 'entity.parse.failed' ? 'The request body is not valid JSON.' :
      err.type === 'entity.too.large' ? 'The request is too large.' :
      'Bad request.';
    res.status(status).json({ error: message });
    return;
  }
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.get('/', (req: Request, res: Response) => {
  res.send('LankaTrip API is running!');
});

server.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  logEmailMode();
  startFareReminderJob();
});
