import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Pool } from 'pg';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);

// Socket.io for Real-Time Features
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

import authRoutes from './routes/authRoutes';
import busRoutes from './routes/busRoutes';
import requestRoutes from './routes/requestRoutes';
import paymentRoutes from './routes/paymentRoutes';
import noticeRoutes from './routes/noticeRoutes';
import notificationRoutes from './routes/notificationRoutes';
import pollRoutes from './routes/pollRoutes';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/polls', pollRoutes);

// PostgreSQL database configuration (to be updated with real credentials)
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'lankatrip',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Events for live bus tracking, poll updates, etc.
});

app.get('/', (req: Request, res: Response) => {
  res.send('LankaTrip Backend API is running');
});

httpServer.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
