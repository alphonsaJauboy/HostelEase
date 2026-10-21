
import { Link } from "react-router-dom";
import {
  Building2, ShieldCheck, BedDouble, CreditCard,
  ArrowRight, Wifi, Utensils, BookOpen
} from "lucide-react";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">YOUR HOME AWAY FROM HOME</span>

          <h1>
            Comfortable Living.<br />
            <span>Smarter Hostel Management.</span>
          </h1>

          <p>
            Experience convenient hostel accommodation.
            Discover rooms, manage applications and
            access all your hostel services in one place.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">
              Apply for Accommodation <ArrowRight size={18}/>
            </Link>

            <Link to="/login" className="secondary-btn">
              Login
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000"
            alt="Modern hostel room"
          />
        </div>
      </section>

      <section className="features section">
        <div className="section-heading">
          <span className="eyebrow">OUR SERVICES</span>
          <h2>Everything You Need in One Place</h2>
          <p>Simple, transparent and convenient hostel services.</p>
        </div>

        
<div className="feature-grid">
  <Feature
    icon={<BedDouble/>}
    title="Comfortable Accommodation"
    desc="Choose from well-maintained rooms with suitable sharing options to meet your accommodation needs."
  />

  <Feature
    icon={<Wifi/>}
    title="WiFi Connectivity"
    desc="Stay connected with internet access for learning, communication, and entertainment."
  />

  <Feature
    icon={<ShieldCheck/>}
    title="Safe & Secure Living"
    desc="Enjoy a secure hostel environment with safety and student well-being as priorities."
  />
   <Feature
    icon={<BookOpen/>}
    title="Study-Friendly Environment"
    desc="Enjoy a peaceful environment that supports learning, concentration, and academic growth."
  />
</div>

      </section>

      <section className="amenities section">
        <div className="section-heading">
          <span className="eyebrow">HOSTEL FACILITIES</span>
          <h2>Facilities for Better Living</h2>
        </div>

        <div className="amenity-grid">
          <span><Wifi/> WiFi</span>
          <span><BookOpen/> Study Area</span>
          <span><ShieldCheck/> Security</span>
        <span><BedDouble/> Comfortable Rooms</span>
        </div>
      </section>

      <footer>
        <strong><Building2/> HostelEase</strong>
        <p>Making hostel management simpler and smarter.</p>
        <small>© 2026 HostelEase. All rights reserved.</small>
      </footer>
    </>
  );
}

function Feature({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
