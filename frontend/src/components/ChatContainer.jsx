import React, { useRef, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
//importing the ChatHeader and MessageInput components
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

function ChatContainer() {
  const { messages, getMessages, isMessagesLoading, selectedUser, setupSocketListeners } =
    useChatStore();
  const { authUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    console.log("Current socket status:", socket?.connected ? "Connected" : "Not connected");

    if (selectedUser?._id) {
      console.log("Loading messages for user:", selectedUser._id);
      getMessages(selectedUser._id);
    }
  }, [selectedUser?._id, getMessages, socket]);

  useEffect(() => {
    // Ensure we have socket listeners setup
    console.log("Setting up socket listeners");
    setupSocketListeners();
  }, [setupSocketListeners]);

  // Log when messages change
  useEffect(() => {
    console.log("Messages updated, count:", messages?.length);
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ensure socket connection is active
  useEffect(() => {
    const { connectSocket } = useAuthStore.getState();
    if (authUser && !socket) {
      console.log("No socket connection detected, reconnecting...");
      connectSocket();
    }
  }, [authUser, socket]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-base-content/50 text-center">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${
                message.senderId === authUser._id ? "chat-end" : "chat-start"
              }`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
