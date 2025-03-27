import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { MessageCircle, Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    unreadMessages,
    setupSocketListeners
  } = useChatStore();

  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getUsers();
    setupSocketListeners();
  }, [getUsers, setupSocketListeners]);

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        {/* ADD SEARCHBAR */}
        {/* ADD Online filter toggle */}
      </div>

      <div className="overflow-y-auto w-full py-3">
        {users.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
              selectedUser?._id === user._id
                ? "bg-base-300 ring-1 ring-base-300"
                : ""
            }`}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
              )}

              {/* Unread message indicator */}
              {unreadMessages[user._id] > 0 && (
                <div className="absolute -top-1 -right-1 bg-primary text-primary-content rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {unreadMessages[user._id]}
                </div>
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400 flex items-center gap-1">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}

                {/* Unread message indicator (text) */}
                {unreadMessages[user._id] > 0 && (
                  <span className="flex items-center gap-1 text-primary">
                    <MessageCircle className="w-3 h-3" />
                    {unreadMessages[user._id]} new
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
