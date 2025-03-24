import express, { Router } from "express";
import { login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// sign up
router.post("/signup", signup);

// log in
router.post("/login", login);

// log out
router.post("/logout", logout);

//log out
router.put("/update-profile",protectRoute, updateProfile)



export default router;
