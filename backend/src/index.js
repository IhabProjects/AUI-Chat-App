import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import postRoutes from "./routes/post.route.js";
import groupRoutes from "./routes/group.route.js";

import cookieParser from "cookie-parser";
import cors from "cors";

import { connect } from "mongoose";
import { connectDB } from "./lib/db.js";
import { app, server, io } from "./lib/socket.js";

dotenv.config();
const PORT = process.env.PORT;

// Make io available to routes
app.set('io', io);

// CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === "development"
    ? ["http://localhost:5173"] // Development origins
    : [process.env.FRONTEND_URL]; // Production origin

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);

server.listen(PORT, () => {
  console.log("server is running on port:" + PORT);
  connectDB();
});
