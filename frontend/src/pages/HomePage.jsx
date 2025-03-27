import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { Users, Newspaper, UserPlus } from "lucide-react";

const HomePage = () => {
  const { selectedUser, getUsers } = useChatStore();
  const { authUser } = useAuthStore();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  // Determine if we're on the explicit chat route
  const isOnChatRoute = location.pathname === "/chat";

  // Don't redirect if explicitly on the chat route
  const hasFriends = authUser?.friends?.length > 0;
  const isMessageAttempt = Boolean(selectedUser);

  useEffect(() => {
    // Always fetch users when on chat page
    if (isOnChatRoute) {
      const initChat = async () => {
        setLoading(true);
        try {
          await getUsers();
        } catch (error) {
          console.error("Failed to load chat users:", error);
        } finally {
          setLoading(false);
        }
      };

      initChat();
    }
  }, [isOnChatRoute, getUsers]);

  // If user has no friends and is not trying to message, show onboarding
  if (!hasFriends && !isMessageAttempt && !isOnChatRoute) {
    return (
      <div className="min-h-screen bg-base-200 flex items-start justify-center">
        <div className="max-w-4xl w-full bg-base-100 rounded-lg shadow-lg p-8 m-4">
          <h1 className="text-3xl font-bold mb-6 text-center">Welcome to AUI Connect!</h1>

          <div className="text-center mb-8">
            <p className="text-lg mb-2">Get started by connecting with friends and exploring the platform</p>
            <p className="text-base-content/70">This is your social network for the AUI community</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="bg-base-200 p-6 rounded-lg text-center">
              <UserPlus className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Find Friends</h3>
              <p className="mb-4">Search for classmates and connect with them</p>
              <Link to="/profile" className="btn btn-primary btn-sm">Search Users</Link>
            </div>

            <div className="bg-base-200 p-6 rounded-lg text-center">
              <Newspaper className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Share Posts</h3>
              <p className="mb-4">Share updates, thoughts, and experiences</p>
              <Link to="/" className="btn btn-primary btn-sm">Go to Feed</Link>
            </div>

            <div className="bg-base-200 p-6 rounded-lg text-center">
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Join Groups</h3>
              <p className="mb-4">Find communities based on interests</p>
              <Link to="/groups" className="btn btn-primary btn-sm">Explore Groups</Link>
            </div>
          </div>

          <div className="mt-10 p-4 bg-primary/10 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Complete your profile with a photo and bio</li>
              <li>Send friend requests to connect with others</li>
              <li>Create your first post on the feed</li>
              <li>Join or create groups based on your interests</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show normal chat UI
  return (
    <div className="h-full bg-base-200">
      <div className="flex items-center justify-center mx-auto px-4 max-w-6xl h-[calc(100vh-64px)]">
        <div className="bg-base-100 rounded-lg shadow-md w-full h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <div className="flex h-full rounded-lg overflow-hidden">
              <Sidebar />
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default HomePage;
