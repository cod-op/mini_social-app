import Post from "../models/Post.js";
import {uploadOnCloudinary } from "../config/cloudinary.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { caption } = req.body;
    let mediaUrl = "";
    let mediaType = "";
    let publicId = "";

    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (req.file) {
      const result = await uploadOnCloudinary(req.file.buffer);
      if (!result) {
        return res.status(500).json({ message: "Cloudinary upload failed" });
      }
      mediaUrl = result.secure_url;
      publicId = result.public_id;
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    }

    if (!caption?.trim() && !mediaUrl) {
      return res.status(400).json({ message: "Caption or media is required" });
    }

    const post = await Post.create({
      userId,
      username: req.user?.username || "Anonymous",
      caption: caption ? caption.trim() : "",
      mediaUrl,
      mediaType,
      publicId,
    });

    return res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// GET ALL POSTS
// GET ALL POSTS
export const getAllPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const currentUserId = (req.user?._id || req.user?.id)?.toString();

    const formattedPosts = posts.map((post) => {
      const likesArray = Array.isArray(post.likes) ? post.likes : [];
      const commentsArray = Array.isArray(post.comments) ? post.comments : [];

      const likedByMe = currentUserId
        ? likesArray.some((like) => {
            if (!like) return false;
            
            // Handle both object schema { userId } and raw ObjectId strings
            const likedUserId = like.userId ? like.userId.toString() : like.toString();
            return likedUserId === currentUserId;
          })
        : false;

      return {
        ...post,
        likedByMe,
        likeCount: likesArray.length,
        commentCount: commentsArray.length,
      };
    });

    return res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// LIKE / UNLIKE POST
// LIKE / UNLIKE POST
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;
    const username = req.user?.username || "Anonymous";

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const userIdStr = userId.toString();

    // Safe lookup handling nulls, objects, and raw ObjectIds
    const isLiked = post.likes.some((like) => {
      if (!like) return false;
      const existingId = like.userId ? like.userId.toString() : like.toString();
      return existingId === userIdStr;
    });

    if (isLiked) {
      // Unlike: Remove matching like while filtering out null items
      post.likes = post.likes.filter((like) => {
        if (!like) return false;
        const existingId = like.userId ? like.userId.toString() : like.toString();
        return existingId !== userIdStr;
      });
    } else {
      // Clean up any pre-existing null values before pushing new like
      post.likes = post.likes.filter(Boolean);
      post.likes.push({ userId, username });
    }

    await post.save();

    return res.status(200).json({
      liked: !isLiked,
      likeCount: post.likes.length,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};

// GET COMMENTS
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).select("comments").lean();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json({ comments: post.comments || [] });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const userId = req.user?._id || req.user?.id;
    const username = req.user?.username || "Anonymous";

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!Array.isArray(post.comments)) {
      post.comments = [];
    }

    const newComment = {
      userId,
      username,
      text: text.trim(),
    };

    post.comments.push(newComment);
    await post.save();

    const addedComment = post.comments[post.comments.length - 1];

    return res.status(201).json({
      comment: addedComment,
      commentCount: post.comments.length,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
};