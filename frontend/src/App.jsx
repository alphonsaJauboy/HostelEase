
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/register" element={<Register/>}/>
          <Route path="/login" element={<Login/>}/>
          <Route element={<ProtectedRoute role="student"/>}>
            <Route path="/student" element={<StudentDashboard/>}/>
          </Route>

          <Route element={<ProtectedRoute role="admin"/>}>
            <Route path="/admin" element={<AdminDashboard/>}/>
          </Route>

          <Route path="*" element={<Home/>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
