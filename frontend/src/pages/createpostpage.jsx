import { useNavigate } from "react-router-dom";

import CreatePost from "../components/createpost.jsx";

import "./createpostpage.css";


export default function CreatePostPage() {

  const navigate = useNavigate();


  function handleCreated() {
    navigate("/", {
      replace: true,
    });
  }


  function handleBack() {
    navigate(-1);
  }


  return (
    <main className="create-post-page">

      <div className="create-post-page-container">

        <div className="create-post-page-header">

          <button
            type="button"
            className="back-button"
            onClick={handleBack}
          >
            ← Back
          </button>


          <div>

            <h1>
              Create Post
            </h1>

            <p>
              Share something with everyone.
            </p>

          </div>

        </div>


        <CreatePost
          onCreated={handleCreated}
        />

      </div>

    </main>
  );
}