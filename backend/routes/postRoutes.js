import express from "express";

import {
  createPost,
  getAllPosts,
  likePost,
  getComments,
  addComment,
} from "../controllers/postcontroller.js";

import isAuth from "../middleware/isAuth.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

// Create Post
router.post("/create", isAuth, upload.single("media"), createPost);

// Get Feed Posts
router.get("/all", isAuth, getAllPosts);

// Like / Unlike Post
router.post("/:id/like", isAuth, likePost);

// Get Comments
router.get("/:id/comments", isAuth, getComments);

// Add Comment
router.post("/:id/comment", isAuth, addComment);

export default router;