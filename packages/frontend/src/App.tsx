import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PostFeedPage from "./pages/PostFeedPage";
import NotFoundPage from "./pages/NotFoundPage";
import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Navigate to="/posts" replace />} />
            <Route path="/posts" element={<PostFeedPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
