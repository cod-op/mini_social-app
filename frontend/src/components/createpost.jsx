import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext.jsx";
import AvatarName from "./profile.jsx";
import { api } from "../lib/api.js";

import "./createpost.css";


const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const MAX_FILE_SIZE =
  25 * 1024 * 1024;


export default function CreatePost({
  onCreated,
}) {
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [caption, setCaption] =
    useState("");

  const [file, setFile] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  /* =========================
     CREATE PREVIEW
  ========================== */

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }

    const objectUrl =
      URL.createObjectURL(file);

    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);


  /* =========================
     FILE SELECT
  ========================== */

  function handleFileChange(e) {
    const selectedFile =
      e.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      return;
    }


    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "File size must be less than 25 MB."
      );

      e.target.value = "";
      setFile(null);

      return;
    }


    if (
      !ALLOWED_TYPES.includes(
        selectedFile.type
      )
    ) {
      setError(
        "Only JPG, PNG, WEBP, GIF, MP4, WEBM and MOV files are allowed."
      );

      e.target.value = "";
      setFile(null);

      return;
    }


    setFile(selectedFile);
  }


  /* =========================
     OPEN FILE PICKER
  ========================== */

  function openFilePicker() {
    if (busy) {
      return;
    }

    fileInputRef.current?.click();
  }


  /* =========================
     REMOVE MEDIA
  ========================== */

  function removeFile() {
    if (busy) {
      return;
    }

    setFile(null);
    setPreview("");
    setError("");
    setSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }


  /* =========================
     CREATE POST
  ========================== */

  async function submit(e) {
    e.preventDefault();

    if (busy) {
      return;
    }

    const cleanCaption =
      caption.trim();

    setError("");
    setSuccess("");


    /*
      Assignment rule:
      Text OR media mein se
      at least one required.
    */

    if (!cleanCaption && !file) {
      setError(
        "Please write something or select an image/video."
      );

      return;
    }


    if (cleanCaption.length > 2000) {
      setError(
        "Caption cannot be more than 2000 characters."
      );

      return;
    }


    setBusy(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "caption",
        cleanCaption
      );

      if (file) {
        formData.append(
          "media",
          file
        );
      }


      const response =
        await api.post(
          "/posts/create",
          formData
        );


      const createdPost =
        response.data?.post;


      if (!createdPost) {
        throw new Error(
          "Invalid server response."
        );
      }


      setSuccess(
        "Post created successfully."
      );


      if (onCreated) {
        onCreated(createdPost);
      }


      setCaption("");
      setFile(null);
      setPreview("");


      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

    } catch (err) {
      console.error(
        "CREATE POST ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Unable to create post."
      );
    } finally {
      setBusy(false);
    }
  }


  const username =
    user?.username?.trim() ||
    "User";


  const hasContent =
    Boolean(
      caption.trim() || file
    );


  return (
    <div className="create-post">

      <div className="create-post-content">

        {/* =========================
            USER AVATAR
        ========================== */}

        <div className="create-post-avatar">
          <AvatarName
            name={username}
            size={48}
          />
        </div>


        {/* =========================
            FORM
        ========================== */}

        <form
          className="create-post-form"
          onSubmit={submit}
        >

          {/* USER INFO */}

          <div className="create-post-user">

            <strong>
              {username}
            </strong>

            <span>
              Create a new post
            </span>

          </div>


          {/* =========================
              TEXT
          ========================== */}

          <textarea
            className="post-textarea"
            rows={5}
            maxLength={2000}
            placeholder={`What's on your mind${
              username !== "User"
                ? `, ${username}`
                : ""
            }?`}
            value={caption}
            onChange={(e) => {
              setCaption(
                e.target.value
              );

              setError("");
              setSuccess("");
            }}
            disabled={busy}
          />


          {/* =========================
              MEDIA PREVIEW
          ========================== */}

          {preview && file && (
            <div className="post-preview-wrapper">

              <div className="post-preview-header">

                <span>
                  Selected media
                </span>

                <button
                  type="button"
                  className="preview-remove-button"
                  onClick={removeFile}
                  disabled={busy}
                >
                  Remove
                </button>

              </div>


              <div className="post-preview-container">

                {file.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    className="post-preview"
                    src={preview}
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    className="post-preview"
                    src={preview}
                    alt="Post preview"
                  />
                )}

              </div>


              <div className="selected-file-info">

                <span>
                  {file.name}
                </span>

                <span>
                  {(
                    file.size /
                    (1024 * 1024)
                  ).toFixed(2)}{" "}
                  MB
                </span>

              </div>

            </div>
          )}


          {/* =========================
              ERROR
          ========================== */}

          {error && (
            <div className="post-message post-error">

              <span>
                ⚠
              </span>

              <span>
                {error}
              </span>

            </div>
          )}


          {/* =========================
              SUCCESS
          ========================== */}

          {success && (
            <div className="post-message post-success">

              <span>
                ✓
              </span>

              <span>
                {success}
              </span>

            </div>
          )}


          <div className="post-divider" />


          {/* =========================
              FOOTER
          ========================== */}

          <div className="post-form-footer">

            <div className="post-footer-left">

              {/* MEDIA BUTTON */}

              <button
                type="button"
                className="media-upload-button"
                onClick={openFilePicker}
                disabled={busy}
              >
                <span className="media-icon">
                  📷
                </span>

                <span>
                  {file
                    ? "Change media"
                    : "Photo / Video"}
                </span>
              </button>


              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                onChange={handleFileChange}
                hidden
              />


              {/* CHARACTER COUNT */}

              <span className="character-count">
                {caption.length}/2000
              </span>

            </div>


            {/* POST BUTTON */}

            <button
              type="submit"
              className="post-button"
              disabled={
                busy || !hasContent
              }
            >
              {busy ? (
                <>
                  <span className="button-spinner" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}