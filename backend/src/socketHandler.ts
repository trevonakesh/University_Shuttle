import { Server, Socket } from 'socket.io';
import { verifyToken } from './utils/jwt';
import { DriverStatus, RequestStatus, Role } from '@prisma/client';
import prisma from './prismaClient';
import { checkFrozen } from './services/fareService';
import { currentColomboDateString } from './utils/time';

let ioInstance: Server | null = null;

export interface BusLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  speed?: number;   // metres/second, from the device GPS (-1 if unknown)
  heading?: number; // degrees
  timestamp: string;
}

// Last known position per driver, so students who open the tracker after the
// bus started broadcasting see it immediately instead of waiting for the
// next ping. In-memory only: cleared on server restart, which is fine —
// stale positions are worse than none.
const lastLocations = new Map<string, BusLocation>();
const LOCATION_TTL_MS = 5 * 60 * 1000; // treat older positions as offline

const freshLocation = (driverId: string): BusLocation | null => {
  const loc = lastLocations.get(driverId);
  if (!loc) return null;
  if (Date.now() - new Date(loc.timestamp).getTime() > LOCATION_TTL_MS) return null;
  return loc;
};

// Who is on the other end of a socket, resolved once at connect time from
// their JWT. Every handler acts on these ids, never on ids the client sends,
// so nobody can broadcast as (or listen to) a driver they aren't.
interface SocketUser {
  userId: number;
  role: Role;
  driverId: number | null;
  driverApproved: boolean;
  studentId: number | null;
}

const MIN_LOCATION_GAP_MS = 1000; // the app sends at most every 2s

const isLat = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 90;
const isLng = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 180;
const optionalNumber = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

// A student may follow a bus they have an approved seat on, or an approved
// daily ride with today, and only while their account isn't frozen.
const canTrack = async (studentId: number, driverId: number): Promise<boolean> => {
  const [seat, ride] = await Promise.all([
    prisma.seatRequest.findFirst({ where: { studentId, driverId, status: RequestStatus.APPROVED }, select: { id: true } }),
    prisma.dailyRideRequest.findFirst({
      where: { studentId, driverId, status: RequestStatus.APPROVED, date: currentColomboDateString() },
      select: { id: true }
    })
  ]);
  if (!seat && !ride) return false;
  return !(await checkFrozen(studentId)).frozen;
};

export const setupSockets = (io: Server) => {
  ioInstance = io;

  // Reject connections without a valid login. The app sends its JWT as
  // `auth: { token }` when it opens the socket.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== 'string' || !token) return next(new Error('unauthorized'));
      const { userId } = verifyToken<{ userId?: number }>(token);
      if (typeof userId !== 'number') return next(new Error('unauthorized'));
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, deactivatedAt: true, driver: { select: { id: true, status: true } }, student: { select: { id: true } } }
      });
      if (!user || user.deactivatedAt) return next(new Error('unauthorized'));
      const me: SocketUser = {
        userId,
        role: user.role,
        driverId: user.driver?.id ?? null,
        driverApproved: user.driver?.status === DriverStatus.APPROVED,
        studentId: user.student?.id ?? null
      };
      socket.data.user = me;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const me = socket.data.user as SocketUser;
    console.log(`User connected: ${socket.id} (user ${me.userId}, ${me.role})`);
    let lastLocationAt = 0;

    // Driver joins their personal status room (approval, fare updates). The
    // id argument the app sends is ignored: a driver only gets their own room.
    socket.on('joinStatusRoom', () => {
      if (me.driverId === null) return;
      socket.join(`driver_status_${me.driverId}`);
    });

    // Driver joins their own location room
    socket.on('joinDriverRoom', () => {
      if (me.driverId === null) return;
      socket.join(`driver_${me.driverId}`);
    });

    // Student joins a driver's room to listen for updates — only a bus they ride.
    socket.on('joinStudentRoom', async (driverIdArg: unknown) => {
      const driverId = parseInt(String(driverIdArg));
      if (!Number.isInteger(driverId)) return;

      let allowed = me.role === Role.ADMIN || me.driverId === driverId;
      if (!allowed && me.studentId !== null) {
        try {
          allowed = await canTrack(me.studentId, driverId);
        } catch (err) {
          console.error('[socket] tracking check failed:', err);
        }
      }
      if (!allowed) {
        socket.emit('trackingDenied', { driverId, message: 'You can only track a bus you have a seat on.' });
        return;
      }

      socket.join(`driver_${driverId}`);

      // Replay the bus's current position so the map is live immediately.
      const last = freshLocation(String(driverId));
      if (last) {
        socket.emit('busLocationUpdate', last);
      }
    });

    // Driver broadcasts location. Only approved drivers, only for their own
    // bus, and only the known fields are passed on to students.
    socket.on('updateLocation', (data: Partial<BusLocation>) => {
      if (me.driverId === null || !me.driverApproved) return;
      if (!data || !isLat(data.latitude) || !isLng(data.longitude)) return;
      const now = Date.now();
      if (now - lastLocationAt < MIN_LOCATION_GAP_MS) return;
      lastLocationAt = now;

      const driverId = String(me.driverId);
      const payload: BusLocation = {
        driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: optionalNumber(data.speed),
        heading: optionalNumber(data.heading),
        timestamp: new Date(now).toISOString()
      };
      lastLocations.set(driverId, payload);

      // Broadcast to everyone in the room except the sender
      socket.to(`driver_${driverId}`).emit('busLocationUpdate', payload);
    });

    // Driver explicitly stops sharing: tell students and forget the position.
    socket.on('stopBroadcast', () => {
      if (me.driverId === null) return;
      const driverId = String(me.driverId);
      lastLocations.delete(driverId);
      socket.to(`driver_${driverId}`).emit('busOffline', { driverId });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

export const emitDriverStatusUpdated = (driverId: number, status: string) => {
  if (ioInstance) {
    ioInstance.to(`driver_status_${driverId}`).emit('driver_status_updated', { status });
  }
};

// Notifies the driver's open sessions that a fare status changed (e.g. a
// student just paid in-app), so the fare tracker can refresh live.
export const emitFareUpdated = (driverId: number, payload: { studentId: number; month: string; status: string }) => {
  if (ioInstance) {
    ioInstance.to(`driver_status_${driverId}`).emit('fareUpdated', payload);
  }
};
