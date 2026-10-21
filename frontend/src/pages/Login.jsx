
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Building2, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="loading">Loading...</div>;

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/student"}
        replace
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
  const res = await login(email.trim(), password);

  navigate(
    res.user.role === "admin" ? "/admin" : "/student"
  );
} catch (err) {
  setError(err.response?.data?.error || "Unable to log in");
} finally {
  setBusy(false);
}
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <Building2 size={30} /> HostelEase
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">HOSTEL MANAGEMENT SYSTEM</span>
          <h1>Welcome back!</h1>
          <p>Sign in to access your account.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email Address</label>
          <div className="input-wrap">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="input-wrap">
            <LockKeyhole size={18} />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="primary-btn full-btn" disabled={busy}>
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
