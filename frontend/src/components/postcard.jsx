import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AvatarName from "./profile.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import "./postcard.css";

function timeAgo(date) {
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export default function PostCard({ post, onLike, onComment }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [openComments, setOpenComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);
  const [liking, setLiking] = useState(false);

  function openProfile() {
    if (!post.username) return;
    navigate(`/profile/${encodeURIComponent(post.username)}`);
  }

  async function toggleComments() {
    const next = !openComments;
    setOpenComments(next);

    if (next && !commentsLoaded) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/posts/${post._id}/comments`);
        setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
        setCommentsLoaded(true);
      } catch (err) {
        console.error("Unable to load comments:", err);
      } finally {
        setLoadingComments(false);
      }
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await api.post(`/posts/${post._id}/comment`, { text });
      if (res.data?.comment) {
        setComments((prev) => [...prev, res.data.comment]);
      }
      setCommentText("");
      onComment?.(post._id, res.data?.commentCount);
      setOpenComments(true);
      setCommentsLoaded(true);
    } catch (err) {
      console.error("Unable to add comment:", err);
    } finally {
      setSending(false);
    }
  }

  // OPTIMISTIC LIKE / UNLIKE HANDLER
  async function likePost() {
    if (liking) return;

    const previousLiked = post.likedByMe;
    const previousCount = post.likeCount || 0;

    const newLiked = !previousLiked;
    const newCount = newLiked ? previousCount + 1 : Math.max(0, previousCount - 1);

    // Immediate UI update
    onLike?.(post._id, newCount, newLiked);
    setLiking(true);

    try {
      const res = await api.post(`/posts/${post._id}/like`);
      if (res.data) {
        onLike?.(post._id, res.data.likeCount, res.data.liked);
      }
    } catch (err) {
      console.error("Unable to like post:", err);
      // Rollback on error
      onLike?.(post._id, previousCount, previousLiked);
    } finally {
      setLiking(false);
    }
  }

  return (
    <article className="post-card">
      <div className="post-header">
        <button
          type="button"
          className="post-profile-button"
          onClick={openProfile}
          aria-label={`Open ${post.username}'s profile`}
        >
          <AvatarName name={post.username} size={44} />
          <div className="post-user">
            <div className="post-username">{post.username}</div>
            <div className="post-time">{timeAgo(post.createdAt)}</div>
          </div>
        </button>
      </div>

      {post.caption && (
        <div className="post-content">
          <p className="post-text">{post.caption}</p>
        </div>
      )}

      {post.mediaUrl && post.mediaType === "image" && (
        <img
          className="post-media"
          src={post.mediaUrl}
          alt={`Post by ${post.username}`}
          loading="lazy"
        />
      )}

      {post.mediaUrl && post.mediaType === "video" && (
        <video
          className="post-media"
          src={post.mediaUrl}
          controls
          preload="metadata"
          playsInline
        />
      )}

      <div className="post-counts">
        <span>
          {post.likeCount || 0} {post.likeCount === 1 ? "like" : "likes"}
        </span>
        <span>
          {post.commentCount || 0} {post.commentCount === 1 ? "comment" : "comments"}
        </span>
      </div>

      <div className="post-divider" />

      <div className="post-actions">
        <button
          type="button"
          onClick={likePost}
          disabled={liking}
          className={`post-action ${post.likedByMe ? "liked" : ""}`}
        >
          <span className="action-icon">{post.likedByMe ? "♥" : "♡"}</span>
          <span>{post.likedByMe ? "Liked" : "Like"}</span>
        </button>

        <button type="button" onClick={toggleComments} className="post-action">
          <span className="action-icon">💬</span>
          <span>Comment</span>
        </button>
      </div>

      {openComments && (
        <div className="comments-section">
          {loadingComments && (
            <p className="loading-comments">Loading comments...</p>
          )}

          {!loadingComments && comments.length === 0 && (
            <p className="no-comments">No comments yet. Be the first to comment.</p>
          )}

          {comments.length > 0 && (
            <div className="comments-list">
              {comments.map((comment) => (
                <div className="comment-item" key={comment._id}>
                  <AvatarName name={comment.username} size={34} />
                  <div className="comment-content">
                    <div className="comment-username">{comment.username}</div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user && (
            <form className="comment-form" onSubmit={submitComment}>
              <input
                type="text"
                maxLength={500}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending || !commentText.trim()}
                aria-label="Add comment"
              >
                {sending ? "..." : "➤"}
              </button>
            </form>
          )}
        </div>
      )}
    </article>
  );
}