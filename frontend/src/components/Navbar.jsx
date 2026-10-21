
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <Building2 size={27} />
        <span>
          Hostel<span className="brand-highlight">Ease</span>
        </span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/register">Register</Link>
        <Link to="/login" className="nav-button">
          Login
        </Link>
      </div>
    </nav>
  );
}
