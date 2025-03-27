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
  firstTimeUser: false,

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
      set({ authUser: res.data, firstTimeUser: true });
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
      set({ authUser: res.data, firstTimeUser: false });
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
      set({ authUser: null, firstTimeUser: false });
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
      console.log("Reconnecting existing socket...");
      socket.connect();
    }

    // Only create a new socket if one doesn't exist
    if (!socket) {
      // Use the backend URL directly instead of relative path
      const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
      console.log("Creating new socket connection via:", BACKEND_URL);

      try {
        socket = io(BACKEND_URL, {
          withCredentials: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket'], // Force WebSocket transport only
          upgrade: false // Disable transport upgrade
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
          console.error("Socket connection error:", error.message);
          toast.error("Connection error: " + error.message);
        });

        socket.on("connect_timeout", () => {
          console.error("Socket connection timeout");
          toast.error("Connection timed out");
        });

        socket.on("error", (error) => {
          console.error("Socket error:", error);
          toast.error("Socket error: " + error.message);
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

        // Friend request events
        socket.on("friend:request:received", (data) => {
          console.log("Friend request received:", data);
          set((state) => {
            // Only update if we have an authUser
            if (!state.authUser) return state;

            // Update friendRequests.received array
            const updatedAuthUser = {
              ...state.authUser,
              friendRequests: {
                ...state.authUser.friendRequests,
                received: [...(state.authUser.friendRequests?.received || []), data.from]
              }
            };

            toast.success(`New friend request from ${data.user.fullName || data.user.username}!`);

            return {
              ...state,
              authUser: updatedAuthUser
            };
          });
        });

        socket.on("friend:request:accepted", (data) => {
          console.log("Friend request accepted:", data);
          set((state) => {
            // Only update if we have an authUser
            if (!state.authUser) return state;

            // Make sure the friends array exists
            const currentFriends = Array.isArray(state.authUser.friends)
              ? state.authUser.friends
              : [];

            // Check if the friend is already in the list to prevent duplicates
            const friendId = data.friend._id;
            const friendAlreadyAdded = currentFriends.includes(friendId);

            // Add to friends list and remove from requests
            const updatedAuthUser = {
              ...state.authUser,
              friends: friendAlreadyAdded
                ? currentFriends
                : [...currentFriends, friendId],
              friendRequests: {
                received: (state.authUser.friendRequests?.received || [])
                  .filter(id => id !== friendId),
                sent: (state.authUser.friendRequests?.sent || [])
                  .filter(id => id !== friendId)
              }
            };

            // Show a toast notification
            toast.success(`You are now friends with ${data.friend.fullName || data.friend.username}!`);

            // Force emit an event to refresh the feed
            if (socket) {
              console.log("Emitting friend list changed event");
              socket.emit("friend:list:changed");
            }

            return {
              ...state,
              authUser: updatedAuthUser
            };
          });
        });

        // Listen for friend list changes that should trigger feed refresh
        socket.on("friend:list:changed", () => {
          console.log("Friend list changed event received");
          // This event will be used by components that need to refresh when friends list changes
          // We don't need to update any state here - components will listen for this event
        });

        // Save socket in state
        set({ socket });
      } catch (err) {
        console.error("Failed to initialize socket:", err);
        toast.error("Failed to connect: " + err.message);
      }
    }
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
  clearFirstTimeStatus: () => {
    set({ firstTimeUser: false });
  },
}));
