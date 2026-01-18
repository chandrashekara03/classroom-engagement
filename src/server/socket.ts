import { Server as HTTPServer } from "http";
import { Server as SocketServer } from "socket.io";

export function setupSocket(server: HTTPServer) {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Heartbeat mechanism
    const heartbeat = setInterval(() => {
      socket.emit("heartbeat", { timestamp: Date.now() });
    }, 30000); // Every 30 seconds

    socket.on("heartbeat-response", () => {
      // Client is alive
    });

    socket.on("join-room", (sessionId: string) => {
      socket.join(sessionId);
      console.log(`User ${socket.id} joined room ${sessionId}`);
      // Update participant count
      io.to(sessionId).emit("participant-update", { count: io.sockets.adapter.rooms.get(sessionId)?.size || 0 });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      clearInterval(heartbeat);
      // Update counts for all rooms
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          io.to(room).emit("participant-update", { count: (io.sockets.adapter.rooms.get(room)?.size || 1) - 1 });
        }
      });
    });

    socket.on("sync-time", (payload) => {
      socket.emit("time-sync", { serverTime: Date.now(), clientTime: payload.clientTime });
    });

    // Teacher events
    socket.on("SESSION_START", (payload) => {
      io.to(payload.sessionId).emit("SESSION_START", payload);
    });

    socket.on("QUESTION_START", (payload) => {
      io.to(payload.sessionId).emit("QUESTION_START", payload);
    });

    socket.on("QUESTION_END", (payload) => {
      io.to(payload.sessionId).emit("QUESTION_END", payload);
    });

    socket.on("RESULTS_REVEAL", (payload) => {
      io.to(payload.sessionId).emit("RESULTS_REVEAL", payload);
    });

    socket.on("SESSION_END", (payload) => {
      io.to(payload.sessionId).emit("SESSION_END", payload);
    });

    socket.on("POLL_START", (payload) => {
      io.to(payload.sessionId).emit("POLL_START", payload);
    });

    socket.on("POLL_END", (payload) => {
      io.to(payload.sessionId).emit("POLL_END", payload);
    });

    socket.on("FEEDBACK_START", (payload) => {
      io.to(payload.sessionId).emit("FEEDBACK_START", payload);
    });

    socket.on("FEEDBACK_END", (payload) => {
      io.to(payload.sessionId).emit("FEEDBACK_END", payload);
    });

    // Student events
    socket.on("ANSWER_SUBMITTED", (payload) => {
      // Save to DB and broadcast
      io.to(payload.sessionId).emit("ANSWER_SUBMITTED", payload);
    });

    socket.on("VOTE_SUBMITTED", (payload) => {
      io.to(payload.sessionId).emit("VOTE_SUBMITTED", payload);
    });

    socket.on("FEEDBACK_SUBMITTED", (payload) => {
      io.to(payload.sessionId).emit("FEEDBACK_SUBMITTED", payload);
    });
  });

  return io;
}