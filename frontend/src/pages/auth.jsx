import { useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";

import "./auth.css";

export default function AuthPage() {
  const { login, signup } =
    useAuth();

  const [mode, setMode] =
    useState("login");

  const [form, setForm] =
    useState({
      username: "",
      email: "",
      password: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  function update(e) {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function submit(e) {
    e.preventDefault();

    setError("");
    setBusy(true);

    try {
      if (mode === "signup") {
        if (
          form.username.trim()
            .length < 2
        ) {
          throw new Error(
            "Username must be at least 2 characters."
          );
        }

        await signup(
          form.username,
          form.email,
          form.password
        );
      } else {
        await login(
          form.email,
          form.password
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  function changeMode(
    newMode
  ) {
    setMode(newMode);
    setError("");
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            3W
          </div>

          <div className="auth-header">
            <h1>3W Social</h1>

            <p>
              Share ideas, moments and
              conversations.
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={
                mode === "login"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode("login")
              }
            >
              Login
            </button>

            <button
              type="button"
              className={
                mode === "signup"
                  ? "active"
                  : ""
              }
              onClick={() =>
                changeMode("signup")
              }
            >
              Create account
            </button>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            onSubmit={submit}
            className="auth-form"
          >
            {mode === "signup" && (
              <div className="form-group">
                <label htmlFor="username">
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={
                    form.username
                  }
                  onChange={update}
                  required
                  minLength={2}
                  maxLength={40}
                  autoComplete="username"
                  placeholder="Enter username"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={update}
                required
                autoComplete="email"
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="password-wrapper">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    form.password
                  }
                  onChange={update}
                  required
                  minLength={6}
                  autoComplete={
                    mode ===
                    "signup"
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder="Enter password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={busy}
            >
              {busy
                ? "Please wait..."
                : mode ===
                  "signup"
                ? "Create account"
                : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}