import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getGroups,
  getGroupById,
  joinGroup,
  approveJoinRequest,
  leaveGroup,
  createGroupPost,
  getGroupPosts,
  searchGroups
} from "../controllers/group.controller.js";

const router = express.Router();

// Group management
router.post("/", protectRoute, createGroup);
router.get("/", protectRoute, getGroups);
// Group search - need to be above dynamic routes
router.get("/search", protectRoute, searchGroups);
router.get("/:groupId", protectRoute, getGroupById);
router.post("/:groupId/join", protectRoute, joinGroup);
router.post("/:groupId/leave", protectRoute, leaveGroup);
router.post("/:groupId/approve/:userId", protectRoute, approveJoinRequest);

// Group posts
router.post("/:groupId/post", protectRoute, createGroupPost);
router.get("/:groupId/posts", protectRoute, getGroupPosts);

export default router;
