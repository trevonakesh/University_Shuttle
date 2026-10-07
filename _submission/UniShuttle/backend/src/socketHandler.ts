import { Server, Socket } from 'socket.io';

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

export const setupSockets = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Driver joins personal status room
    socket.on('joinStatusRoom', (driverId: string) => {
      const room = `driver_status_${driverId}`;
      socket.join(room);
      console.log(`Driver ${driverId} joined status room ${room}`);
    });

    // Driver joins their own room to broadcast location
    socket.on('joinDriverRoom', (driverId: string) => {
      const room = `driver_${driverId}`;
      socket.join(room);
      console.log(`Driver ${driverId} joined room ${room}`);
    });

    // Student joins a specific driver's room to listen for updates
    socket.on('joinStudentRoom', (driverId: string) => {
      const room = `driver_${driverId}`;
      socket.join(room);
      console.log(`Student joined room ${room}`);

      // Replay the bus's current position so the map is live immediately.
      const last = freshLocation(String(driverId));
      if (last) {
        socket.emit('busLocationUpdate', last);
      }
    });

    // Driver broadcasts location
    socket.on('updateLocation', (data: BusLocation) => {
      if (!data || !data.driverId || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
        return;
      }
      const payload: BusLocation = { ...data, timestamp: data.timestamp || new Date().toISOString() };
      lastLocations.set(String(data.driverId), payload);

      // Broadcast to everyone in the room except the sender
      socket.to(`driver_${data.driverId}`).emit('busLocationUpdate', payload);
    });

    // Driver explicitly stops sharing: tell students and forget the position.
    socket.on('stopBroadcast', (driverId: string) => {
      lastLocations.delete(String(driverId));
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
