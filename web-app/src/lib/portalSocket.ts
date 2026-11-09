import { io, Socket } from 'socket.io-client';
import { API_BASE, getPortalToken } from './portalApi';

// Live-tracking socket, signed in with the portal login. The server refuses
// connections without a valid token.
export const openPortalSocket = (): Socket =>
  io(API_BASE, { auth: { token: getPortalToken() ?? '' }, transports: ['websocket', 'polling'] });
