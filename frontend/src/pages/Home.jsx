
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

          <div className="image-label">
            <BedDouble size={20}/>
            <div>
              <strong>Comfortable Rooms</strong>
              <small>Designed for student living</small>
            </div>
          </div>
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
            title="Room Booking"
            desc="Explore available rooms and submit accommodation requests."
          />

          <Feature
            icon={<ShieldCheck/>}
            title="Secure Access"
            desc="One login with automatic role-based student and administrator access."
          />

          <Feature
            icon={<CreditCard/>}
            title="Online Fee Management"
            desc="Manage hostel fee payments and payment receipts."
          />

          <Feature
            icon={<Building2/>}
            title="Room Management"
            desc="Efficient room allocation and availability tracking."
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
          <span><Utensils/> Dining</span>
          <span><BookOpen/> Study Area</span>
          <span><ShieldCheck/> Security</span>
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
