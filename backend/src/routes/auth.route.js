import express, { Router } from "express";
import {
  checkAuth,
  login,
  logout,
  signup,
  updateProfile,
  getUserProfile,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  getFriendRequests,
  searchUsers,
  getFriends
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Authentication
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", protectRoute, checkAuth);

// Profile
router.put("/update-profile", protectRoute, updateProfile);
router.get("/profile/:userId", protectRoute, getUserProfile);

// Friend Requests
router.get("/friends/requests", protectRoute, getFriendRequests);
router.post("/friends/request/:friendId", protectRoute, sendFriendRequest);
router.post("/friends/accept/:friendId", protectRoute, acceptFriendRequest);
router.post("/friends/reject/:friendId", protectRoute, rejectFriendRequest);
router.post("/friends/cancel/:friendId", protectRoute, cancelFriendRequest);
router.post("/friends/remove/:friendId", protectRoute, removeFriend);
router.get("/friends", protectRoute, getFriends);

// User Search
router.get("/search", protectRoute, searchUsers);

export default router;
