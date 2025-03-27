import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  likePost,
  unlikePost,
  addComment,
  deletePost,
  searchPosts,
} from "../controllers/post.controller.js";

const router = express.Router();

// Feed
router.get("/feed", protectRoute, getFeedPosts);

// User posts
router.get("/user/:userId", protectRoute, getUserPosts);

// Create post
router.post("/", protectRoute, createPost);

// Post interactions
router.post("/:postId/like", protectRoute, likePost);
router.post("/:postId/unlike", protectRoute, unlikePost);
router.post("/:postId/comment", protectRoute, addComment);

// Delete post
router.delete("/:postId", protectRoute, deletePost);

// Search posts
router.get("/search", protectRoute, searchPosts);

export default router;
