
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Redirect unauthenticated users to the common login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent students from accessing admin pages and vice versa
  if (user.role !== role) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/student"}
        replace
      />
    );
  }

  return <Outlet />;
}
