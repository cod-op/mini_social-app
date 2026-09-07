import User from "../models/user.js";
import Post from "../models/post.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate JWT
const makeToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// 1. Sign In / Register
export const SignIn = async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (username.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username must contain at least 2 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingEmail = await User.findOne({ email }).lean();
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const existingUsername = await User.findOne({ username }).lean();
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const token = makeToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 2. Login
export const Login = async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = makeToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Current User
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 4. Get User Profile & Aggregate Stats
export const getProfile = async (req, res, next) => {
  try {
    const username = String(req.params.username || "").trim();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const user = await User.findOne({
      username: {
        $regex: `^${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    })
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Match on `userId` (matches Post model field schema)
    const postsStats = await Post.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          postCount: { $sum: 1 },
          likeCount: {
            $sum: {
              $cond: {
                if: { $isArray: "$likes" },
                then: { $size: "$likes" },
                else: 0,
              },
            },
          },
          commentCount: {
            $sum: {
              $cond: {
                if: { $isArray: "$comments" },
                then: { $size: "$comments" },
                else: 0,
              },
            },
          },
        },
      },
    ]);

    const stats = postsStats[0] || {
      postCount: 0,
      likeCount: 0,
      commentCount: 0,
    };

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        postCount: stats.postCount,
        likeCount: stats.likeCount,
        commentCount: stats.commentCount,
      },
    });
  } catch (error) {
    console.error("❌ GET PROFILE ERROR:", error);
    next(error);
  }
};