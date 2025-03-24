import express, { Router } from "express";
import { login, logout, signup } from "../controllers/auth.controller.js";

const router = express.Router();

// sign up
router.post("/signup", signup);

// log in
router.post("/login", login);

// log out
router.post("/logout", logout);
export default router;
