import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import AvatarName from "../components/profile.jsx";
import { api } from "../lib/api.js";

import "./profilepage.css";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { username: profileUsername } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // Determine active profile username
  const username = profileUsername?.trim() || user?.username?.trim() || "";

  const isOwnProfile =
    !profileUsername ||
    (user?.username &&
      username.toLowerCase() === user.username.toLowerCase());

  // Function to load profile and stats
  const loadProfile = useCallback(async (isMounted) => {
    if (!username) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/auth/profile/${encodeURIComponent(username)}`
      );

      if (!isMounted.current) return;

      const profileData = response.data?.user || response.data;

      if (!profileData) {
        setError("Profile data not found.");
        return;
      }

      setProfile(profileData);
    } catch (err) {
      if (!isMounted.current) return;

      console.error("Unable to load profile:", err);
      setProfile(null);
      setError(
        err.response?.data?.message || "Unable to load profile details."
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [username]);

  useEffect(() => {
    const isMounted = { current: true };
    loadProfile(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, [loadProfile]);

  function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    setLoggingOut(true);

    if (logout) {
      logout();
    } else {
      localStorage.removeItem("3w_token");
      window.dispatchEvent(new Event("auth:logout"));
    }

    navigate("/auth", { replace: true });
  }

  function handleCreatePost() {
    navigate("/create-post");
  }

  function handleBackToFeed() {
    navigate("/");
  }

  // Loading State UI
  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <button
              type="button"
              className="profile-back-button"
              onClick={handleBackToFeed}
            >
              <span>←</span>
              <span>Feed</span>
            </button>
            <div className="profile-header-content">
              <h1>Profile</h1>
              <p>Loading profile...</p>
            </div>
          </div>

          <section className="profile-card profile-loading-card">
            <div className="profile-loading">
              <div className="profile-spinner" />
              <p>Loading details & stats...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // Error State UI
  if (error || !profile) {
    return (
      <main className="profile-page">
        <div className="profile-container">
          <div className="profile-header">
            <button
              type="button"
              className="profile-back-button"
              onClick={handleBackToFeed}
            >
              <span>←</span>
              <span>Feed</span>
            </button>
            <div className="profile-header-content">
              <h1>Profile</h1>
              <p>User profile</p>
            </div>
          </div>

          <section className="profile-card profile-error-card">
            <div className="profile-error-icon">!</div>
            <h2>Profile Not Found</h2>
            <p>{error || "This user profile could not be loaded."}</p>
            <button
              type="button"
              className="profile-error-button"
              onClick={handleBackToFeed}
            >
              Back to Feed
            </button>
          </section>
        </div>
      </main>
    );
  }

  // Safely extract values with fallback guarantees
  const displayUsername = profile.username?.trim() || username || "User";
  const displayEmail = profile.email?.trim() || "No email available";

  // Dynamic counts coming from Backend Schema aggregation/fields
  const postCount = Number(profile.postCount ?? profile.postsCount) || 0;
  const likeCount = Number(profile.likeCount ?? profile.likesCount) || 0;
  const commentCount = Number(profile.commentCount ?? profile.commentsCount) || 0;

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Top Navigation */}
        <div className="profile-header">
          <button
            type="button"
            className="profile-back-button"
            onClick={handleBackToFeed}
          >
            <span>←</span>
            <span>Feed</span>
          </button>

          <div className="profile-header-content">
            <h1>
              {isOwnProfile ? "My Profile" : `${displayUsername}'s Profile`}
            </h1>
            <p>
              {isOwnProfile
                ? "Manage your account and profile."
                : "View this user's profile."}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <section className="profile-card">
          <div className="profile-top">
            <AvatarName name={displayUsername} size={100} />

            <div className="profile-info">
              <h2>{displayUsername}</h2>
              <p>{displayEmail}</p>
              <span className="profile-status">
                <span className="status-dot">●</span> Active account
              </span>
            </div>

            {isOwnProfile && (
              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <span className="logout-spinner" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <span>Logout</span>
                )}
              </button>
            )}
          </div>

          <div className="profile-divider" />

          {/* DYNAMIC STATS SECTION */}
          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{postCount}</strong>
              <span>Posts</span>
            </div>

            <div className="profile-stat">
              <strong>{likeCount}</strong>
              <span>Likes</span>
            </div>

            <div className="profile-stat">
              <strong>{commentCount}</strong>
              <span>Comments</span>
            </div>
          </div>

          {isOwnProfile && (
            <div className="profile-actions">
              <button
                type="button"
                className="create-profile-post-button"
                onClick={handleCreatePost}
              >
                <span className="create-post-plus">+</span>
                <span>Create Post</span>
              </button>
            </div>
          )}
        </section>

        {/* Account Info (Own Profile Only) */}
        {isOwnProfile && (
          <section className="account-card">
            <div className="account-heading">
              <h3>Account</h3>
              <p>Manage your account details.</p>
            </div>

            <div className="account-row">
              <div className="account-row-info">
                <span className="account-icon">👤</span>
                <div>
                  <strong>Username</strong>
                  <p>{displayUsername}</p>
                </div>
              </div>
            </div>

            <div className="account-row">
              <div className="account-row-info">
                <span className="account-icon">✉️</span>
                <div>
                  <strong>Email</strong>
                  <p>{displayEmail}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}