import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PostFeedPage from "./pages/PostFeedPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route element={<DashboardPage />}>
          <Route path="/dashboard" element={<div><h1>Welcome!</h1></div>}  />
          <Route path="/posts" element={<PostFeedPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;