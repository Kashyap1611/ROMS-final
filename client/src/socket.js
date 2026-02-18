import { io } from 'socket.io-client';

// Connect to same origin (works when client is served via dev proxy to server)
// If your client runs on a different host/port in production, provide the base URL here.
const socket = io(process.env.REACT_APP_API_URL, {
  autoConnect: true,
  transports: ['websocket'],
});

export default socket;
