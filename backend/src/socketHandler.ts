import { Server, Socket } from 'socket.io';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

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
    });

    // Driver broadcasts location
    socket.on('updateLocation', (data: { driverId: string, latitude: number, longitude: number, timestamp: string }) => {
      const room = `driver_${data.driverId}`;
      // Broadcast to everyone in the room except the sender
      socket.to(room).emit('busLocationUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
