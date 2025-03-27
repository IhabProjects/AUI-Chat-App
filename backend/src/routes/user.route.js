import express from "express";
import { searchUsers } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// User search
router.get("/search", protectRoute, searchUsers);

export default router;
