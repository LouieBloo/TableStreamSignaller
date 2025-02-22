import { Socket } from 'socket.io';

// written by GPT
export const getClientIp = (socket: Socket): string =>{
    // Check for the 'x-forwarded-for' header, which is set by proxies
    const xForwardedFor = socket.handshake.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      // 'x-forwarded-for' can contain multiple IPs, the client's IP is the first one
      const ip = xForwardedFor.split(',')[0].trim();
      if (ip) {
        return ip;
      }
    }
  
    // Fallback to socket.handshake.address for direct connections
    return socket.handshake.address || 'Unknown IP';
  }