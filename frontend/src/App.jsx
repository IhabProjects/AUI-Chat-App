import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import LogInPage from "./pages/LogInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import FeedPage from "./pages/FeedPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import { useAuthStore } from "./store/useAuthStore";
import { Toaster } from "react-hot-toast";

// animation loader
import { Loader } from "lucide-react";
import { useThemeStore } from "./store/useThemeStore";

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
        <Routes>
          <Route
            path="/"
            element={authUser ? <FeedPage /> : <Navigate to="/login" />}
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
        </Routes>
      </main>
      <Toaster />
    </div>
  );
};
export default App;
