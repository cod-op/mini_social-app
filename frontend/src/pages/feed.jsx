import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "../components/postcard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import "./feed.css";

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const isMounted = useRef(true);

  async function loadPosts(nextPage = 1, append = false) {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const res = await api.get(`/posts/all?page=${nextPage}&limit=5`);

      if (!isMounted.current) return;

      const newPosts = Array.isArray(res.data?.posts) ? res.data.posts : [];
      const pagination = res.data?.pagination || {};

      setPosts((prevPosts) => {
        if (!append) return newPosts;

        const existingIds = new Set(prevPosts.map((post) => post._id));
        const uniquePosts = newPosts.filter((post) => !existingIds.has(post._id));

        return [...prevPosts, ...uniquePosts];
      });

      setPage(Number(pagination.page || nextPage));
      setHasMore(Boolean(pagination.hasMore));
    } catch (err) {
      if (!isMounted.current) return;

      console.error("Unable to load posts:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load posts."
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    isMounted.current = true;
    loadPosts(1, false);

    return () => {
      isMounted.current = false;
    };
  }, []);

  function openMyProfile() {
    if (!user?.username) return;
    navigate(`/profile/${encodeURIComponent(user.username)}`);
  }

  function toggleLike(id, serverCount, serverLiked) {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id !== id) return post;
        return {
          ...post,
          likeCount: typeof serverCount === "number" ? serverCount : post.likeCount || 0,
          likedByMe: typeof serverLiked === "boolean" ? serverLiked : Boolean(post.likedByMe),
        };
      })
    );
  }

  function updateCommentCount(id, count) {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post._id !== id) return post;
        return {
          ...post,
          commentCount: typeof count === "number" ? count : post.commentCount || 0,
        };
      })
    );
  }

  function handleLoadMore() {
    if (loading || loadingMore || !hasMore) return;
    loadPosts(page + 1, true);
  }

  return (
    <main className="feed-page">
      <div className="feed-container">
        <div className="feed-top-bar">
          <button type="button" className="my-profile-button" onClick={openMyProfile}>
            <span>My Profile</span>
            <span className="profile-arrow">→</span>
          </button>
        </div>

        <header className="feed-header">
          <div>
            <h1>Social Feed</h1>
            <p>See what everyone is sharing.</p>
          </div>
        </header>

        {error && (
          <div className="feed-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="feed-loading">
            <div className="spinner" />
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">✨</div>
            <h3>No posts yet</h3>
            <p>Be the first person to share something.</p>
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post, index) => (
              <PostCard
                key={post._id || index}
                post={post}
                onLike={toggleLike}
                onComment={updateCommentCount}
              />
            ))}
          </div>
        )}

        {!loading && hasMore && (
          <div className="load-more-wrapper">
            <button
              type="button"
              className="load-more-button"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}