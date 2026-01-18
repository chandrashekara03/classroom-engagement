import io, { Socket } from "socket.io-client";

class SocketManager {
  private socket: Socket | null = null;
  private roomId: string | null = null;

  connect(sessionId: string) {
    if (this.socket) return;
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001");
    this.roomId = sessionId;
    this.socket.emit("join-room", sessionId);

    // Handle heartbeat
    this.socket.on("heartbeat", () => {
      this.socket?.emit("heartbeat-response");
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.roomId = null;
    }
  }

  emit(event: string, payload: unknown) {
    if (this.socket) {
      this.socket.emit(event, payload);
    }
  }

  on(event: string, handler: (payload: unknown) => void) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler?: (payload: unknown) => void) {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler);
      } else {
        this.socket.off(event);
      }
    }
  }

  get connected() {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();