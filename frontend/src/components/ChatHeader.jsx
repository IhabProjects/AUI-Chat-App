import { User, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useNavigate } from "react-router-dom";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  const handleProfileClick = () => {
    if (selectedUser?._id) {
      navigate(`/user/${selectedUser._id}`);
    }
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div
              className="size-10 rounded-full relative cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleProfileClick}
              title="View Profile"
            >
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
              <div className="absolute bottom-0 right-0 bg-base-300 rounded-full p-0.5">
                <User className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
        <button onClick={() => setSelectedUser(null)}>
          <X />
        </button>
      </div>
    </div>
  );
};
export default ChatHeader;
