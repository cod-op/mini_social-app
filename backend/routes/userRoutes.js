import express from "express";
import { SignIn, Login, getMe, getProfile } from "../controllers/usercontroller.js";
import isAuth from "../middleware/isAuth.js";

const router = express.Router();

// Auth Routes
router.post("/signup", SignIn);
router.post("/login", Login);

// User Profile Routes
router.get("/me", isAuth, getMe);
router.get("/profile/:username", isAuth, getProfile);

export default router;