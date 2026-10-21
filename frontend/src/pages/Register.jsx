
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Building2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    student_id: "",
    email: "",
    phone: "",
    department: "",
    year_of_study: "",
    password: "",
    confirm_password: ""
  });

  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    setBusy(true);

    try {
      const { confirm_password, ...details } = form;
      await register(details);
      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const fields = [
    ["full_name", "Full Name"],
    ["student_id", "Student ID"],
    ["email", "Email Address"],
    ["phone", "Phone Number"],
    ["department", "Department"],
    ["year_of_study", "Year of Study"],
    ["password", "Password"],
    ["confirm_password", "Confirm Password"]
  ];

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <Link to="/" className="auth-brand">
          <Building2 size={28}/> HostelEase
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">STUDENT PORTAL</span>
          <h1>Create Account</h1>
          <p>Register to apply for hostel accommodation.</p>
        </div>

        <form onSubmit={submit}>
          <div className="register-grid">
            {fields.map(([name, label]) => (
              <div key={name}>
                <label>{label}</label>
                <input
                  className="form-input"
                  name={name}
                  type={
                    name.includes("password") ? "password" :
                    name === "email" ? "email" : "text"
                  }
                  placeholder={`Enter ${label.toLowerCase()}`}
                  value={form[name]}
                  onChange={change}
                  required
                  minLength={name.includes("password") ? 6 : undefined}
                />
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="primary-btn full-btn" disabled={busy}>
            {busy ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
