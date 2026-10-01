import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import PostFeedPage from "./pages/PostFeedPage";
import AlumniListPage from "./pages/AlumniListPage";
import AlumniProfilePage from "./pages/AlumniProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import AboutPage from "./pages/AboutPage";
import NotFoundPage from "./pages/NotFoundPage";
import AppLayout from "./layouts/AppLayout";
import RequireAuth from "./components/RequireAuth";
import GuestOnly from "./components/GuestOnly";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Navigate to="/posts" replace />} />
            <Route path="/posts" element={<PostFeedPage />} />
            <Route path="/alumni" element={<AlumniListPage />} />
            <Route path="/alumni/:id" element={<AlumniProfilePage />} />
            <Route path="/me" element={<MyProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
