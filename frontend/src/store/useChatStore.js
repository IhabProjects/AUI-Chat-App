import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {},

  setupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Cleanup old listeners to avoid duplicates
    socket.off("message:receive");

    // Setup new message listener
    socket.on("message:receive", (message) => {
      console.log("Received message via socket:", message);
      const { selectedUser, messages } = get();
      const authUser = useAuthStore.getState().authUser;

      if (!message || !authUser) return;

      // If message is from or to the currently selected user, add it to the messages
      if (selectedUser &&
         ((message.senderId === selectedUser._id && message.receiverId === authUser._id) ||
          (message.receiverId === selectedUser._id && message.senderId === authUser._id))) {

        // Check if message already exists in the array (avoid duplicates)
        const messageExists = Array.isArray(messages) &&
          messages.some(m => m._id === message._id);

        if (!messageExists) {
          console.log("Adding new message to chat");
          set({
            messages: [...(Array.isArray(messages) ? messages : []), message]
          });
        }
      } else if (message.senderId !== authUser._id) {
        // Otherwise track it as an unread message (only for messages received, not sent)
        console.log("Adding unread message count for sender:", message.senderId);
        set((state) => {
          const senderId = message.senderId;
          return {
            unreadMessages: {
              ...state.unreadMessages,
              [senderId]: (state.unreadMessages[senderId] || 0) + 1
            }
          };
        });
      }
    });
  },

  clearUnreadMessages: (userId) => {
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [userId]: 0
      }
    }));
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users/");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}/`);
      const messageArray = res.data.messages || res.data;
      set({ messages: messageArray });
      // Clear unread messages when loading messages from a user
      get().clearUnreadMessages(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    // Check if selectedUser exists and has an _id
    if (!selectedUser?._id) {
      toast.error("No user selected");
      return;
    }

    try {
      // Send message via API
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const newMessage = res.data;

      // Update the local messages state immediately for a responsive UI
      const currentMessages = Array.isArray(messages) ? messages : [];
      set({ messages: [...currentMessages, newMessage] });

      // If socket is available, try to emit the message directly as well for even faster delivery
      if (socket && socket.connected && authUser) {
        socket.emit("message:new", {
          _id: newMessage._id,
          senderId: authUser._id,
          receiverId: selectedUser._id,
          text: messageData.text,
          image: messageData.image ? newMessage.image : null,
          createdAt: newMessage.createdAt
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    if (selectedUser) {
      get().getMessages(selectedUser._id);
      get().clearUnreadMessages(selectedUser._id);
    }
  },
}));
