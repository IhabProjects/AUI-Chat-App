import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true
  },
});

// Keep track of online users
const onlineUsers = new Set();
// Map to store user ID to socket ID for direct messaging
const userSocketMap = {};

io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    // Handle when a user comes online
    socket.on("user:online", ({ userId }) => {
      console.log("User online:", userId);
      socket.userId = userId; // Store userId in socket for later reference
      onlineUsers.add(userId);
      userSocketMap[userId] = socket.id;

      // Broadcast to all clients that this user is online
      io.emit("user:online", Array.from(onlineUsers));
    });

    // Handle new messages
    socket.on("message:new", (message) => {
      console.log("New message:", message);

      // Get the socket ID of the recipient
      const recipientSocketId = userSocketMap[message.receiverId];

      if (recipientSocketId) {
        // Send the message to the specific recipient
        io.to(recipientSocketId).emit("message:receive", message);
      }

      // Also send it back to the sender to ensure both sides update
      const senderSocketId = userSocketMap[message.senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:receive", message);
      }
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.id);

        if (socket.userId) {
          onlineUsers.delete(socket.userId);
          delete userSocketMap[socket.userId];
          // Let other clients know this user went offline
          io.emit("user:offline", socket.userId);
        }
    });
});

export { io, app, server };
