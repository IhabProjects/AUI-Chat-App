import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import FeedPage from "./pages/FeedPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import SearchPage from "./pages/SearchPage";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { Toaster } from "react-hot-toast";

// animation loader
import { Loader } from "lucide-react";
import { useThemeStore } from "./store/useThemeStore";

const AppRoutes = () => {
  const { authUser } = useAuthStore();
  const location = useLocation();
  const { selectUserById } = useChatStore();

  // Handle chat user selection from route state
  useEffect(() => {
    const selectedChatUserId = location.state?.selectedChatUserId;
    if (selectedChatUserId && authUser) {
      // If we have a selected chat user in state, select them
      selectUserById(selectedChatUserId);
    }
  }, [location.state, authUser, selectUserById]);

  return (
    <Routes>
      <Route
        path="/"
        element={authUser ? <FeedPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/home"
        element={authUser ? <HomePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/chat"
        element={authUser ? <HomePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/signup"
        element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
      />
      <Route
        path="/login"
        element={!authUser ? <LogInPage /> : <Navigate to="/" />}
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route
        path="/profile"
        element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/user/:userId"
        element={authUser ? <UserProfilePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/feed"
        element={authUser ? <FeedPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/groups"
        element={authUser ? <GroupsPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/groups/:groupId"
        element={authUser ? <GroupDetailPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/search"
        element={authUser ? <SearchPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    // Apply initial theme
    document.documentElement.setAttribute("data-theme", theme);
  }, [checkAuth, theme]);

  console.log({ authUser });
  if (isCheckingAuth & !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  return (
    <div data-theme={theme} className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <AppRoutes />
      </main>
      <Toaster />
    </div>
  );
};
export default App;
