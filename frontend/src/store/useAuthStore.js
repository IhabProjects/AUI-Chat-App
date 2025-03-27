import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { toast } from "react-hot-toast";

import { io } from "socket.io-client";

const BASE_URL = "http://localhost:5001";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  isCheckingAuth: true,
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
      console.log("Error in signup", error);
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
      console.log("Error in login", error);
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.log("Error in logout", error);
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      toast.error(errorMessage);
      console.log("Error in updateProfile", error);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    // Get existing socket or create new one
    let socket = get().socket;

    // If socket exists but is not connected, try to reconnect
    if (socket && !socket.connected) {
      socket.connect();
    }

    // Only create a new socket if one doesn't exist
    if (!socket) {
      console.log("Creating new socket connection");
      socket = io(BASE_URL, {
        withCredentials: true
      });

      // Set up event handlers
      socket.on("connect", () => {
        console.log("Connected to socket server");
        // Let the server know this user is online
        socket.emit("user:online", { userId: authUser._id });

        // Initialize chat listeners after socket is connected
        // Using dynamic import to avoid circular dependencies
        import('./useChatStore.js').then(module => {
          const useChatStore = module.useChatStore;
          useChatStore.getState().setupSocketListeners();
        });
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("user:online", (data) => {
        set((state) => ({
          onlineUsers: [...new Set([...state.onlineUsers, ...data])]
        }));
      });

      socket.on("user:offline", (userId) => {
        set((state) => ({
          onlineUsers: state.onlineUsers.filter(id => id !== userId)
        }));
      });

      // Save socket in state
      set({ socket });
    }
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));
