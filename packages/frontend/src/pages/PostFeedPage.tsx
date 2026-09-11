import PostFeed from "../components/PostFeed";

export default function PostFeedPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/";
    return null;
  }

  return (
    <div>
      <PostFeed />
    </div>
  );
}
