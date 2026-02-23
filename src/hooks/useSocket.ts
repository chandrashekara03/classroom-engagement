import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SessionEvent, SessionState, Activity, ActivityResponse, Participant } from '@classroom/shared-utils';

// We export a context or a hook to manage the Socket connection
export function useSocket(sessionId?: string, role: 'STUDENT' | 'TEACHER' = 'STUDENT') {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  useEffect(() => {
    // Only connect if we have a sessionId (or always connect if we're a teacher making one)
    if (!sessionId && role !== 'TEACHER') return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    // In a real application, we would connect to the actual backend.
    // For this prototype, we're instantiating the socket.io-client.
    const newSocket = io(socketUrl, {
      query: {
        sessionId,
        role
      },
      autoConnect: true,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (sessionId) {
        newSocket.emit('join-session', { sessionId, role });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('session-state-update', (state: SessionState) => {
      setSessionState(state);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, role]);

  const emitEvent = useCallback((eventName: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    } else {
      console.warn('Socket not connected. Cannot emit:', eventName);
      
      // FOR PROTOTYPE PURPOSES: We use BroadcastChannel to simulate socket communication across tabs
      // when there is no real backend server running.
      if (typeof window !== 'undefined') {
        const bc = new BroadcastChannel(`classroom-session-${sessionId || 'global'}`);
        bc.postMessage({ type: eventName, payload: data });
        bc.close();
      }
    }
  }, [socket, isConnected, sessionId]);

  // Prototype: Listen to BroadcastChannel fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const bc = new BroadcastChannel(`classroom-session-${sessionId || 'global'}`);
    bc.onmessage = (event) => {
      const { type, payload } = event.data;
      if (socket) {
        // We can simulate receiving a socket event
        // socket.emit locally doesn't trigger .on, but we can manually trigger state updates
      }
    };
    return () => bc.close();
  }, [sessionId, socket]);

  return { socket, isConnected, sessionState, emitEvent };
}
