
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home, BedDouble, ClipboardList, CreditCard,
  User, LogOut, Building2
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [applications, setApplications] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("Dashboard");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [r, a, p] = await Promise.all([
        api.get("?action=rooms"),
        api.get("?action=my_applications"),
        api.get("?action=payments")
      ]);

      setRooms(r.data);
      setApplications(a.data);
      setPayments(p.data);
      setError("");
    } catch {
      setError("Unable to load dashboard information.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apply for a room
  const apply = async (roomId) => {
    if (!window.confirm("Submit application for this room?")) return;

    setBusy(true);
    setError("");

    try {
      const res = await api.post("?action=apply", {
        room_id: roomId
      });

      alert(res.data.message);
      await loadData();
      setTab("My Applications");
    } catch (err) {
      setError(err.response?.data?.error || "Application failed");
    } finally {
      setBusy(false);
    }
  };

  // Cancel a pending application
  const cancelApplication = async (applicationId) => {
    if (!window.confirm("Are you sure you want to cancel this application?")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await api.post("?action=cancel_application", {
        application_id: applicationId
      });

      alert(res.data.message || "Application cancelled successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to cancel application."
      );
    } finally {
      setBusy(false);
    }
  };

  // Make payment
  const pay = async () => {
    if (!window.confirm("Proceed with demo payment?")) return;

    setBusy(true);
    setError("");

    try {
      const res = await api.post("?action=pay");

      alert(
        `${res.data.message}\nTransaction: ${res.data.transaction_id}\nAmount: ₹${res.data.amount}`
      );

      await loadData();
      setTab("Payment History");
    } catch (err) {
      setError(err.response?.data?.error || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  // Logout
  const signOut = async () => {
    await logout();
    navigate("/");
  };

  const approved = applications.find(
    a => a.status === "Approved"
  );

  const pending = applications.filter(
    a => a.status === "Pending"
  ).length;

  const hasActiveApplication = applications.some(
    a => a.status === "Pending" || a.status === "Approved"
  );

  const menu = [
    ["Dashboard", Home],
    ["Browse Rooms", BedDouble],
    ["My Applications", ClipboardList],
    ["Fee Payment", CreditCard],
    ["Payment History", ClipboardList],
    ["My Profile", User]
  ];

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="sidebar-brand">
          <Building2 /> HostelEase
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {user?.full_name?.[0]}
          </div>

          <div>
            <strong>{user?.full_name}</strong>
            <small>Student</small>
          </div>
        </div>

        <p className="menu-label">STUDENT MENU</p>

        {menu.map(([label, Icon]) => (
          <button
            key={label}
            className={`side-link ${tab === label ? "active" : ""}`}
            onClick={() => setTab(label)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}

        <button className="side-link logout-link" onClick={signOut}>
          <LogOut size={18} />
          Logout
        </button>

      </aside>

      {/* Main dashboard */}
      <main className="dashboard-main">

        <header className="dashboard-header">
          <div>
            <h2>{tab}</h2>
            <p>Welcome back, {user?.full_name}</p>
          </div>
        </header>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {/* Dashboard */}
        {tab === "Dashboard" && (
          <>
            <div className="stat-grid">

              <Stat
                title="Available Rooms"
                value={rooms.filter(
                  r => Number(r.available_beds) > 0
                ).length}
              />

              <Stat
                title="Pending Applications"
                value={pending}
              />

              <Stat
                title="Allocated Room"
                value={approved?.room_number || "Not allocated"}
              />

              <Stat
                title="Total Payments"
                value={payments.length}
              />

            </div>

            <div className="panel">
              <h3>Recent Applications</h3>

              <Applications
                applications={applications.slice(0, 5)}
              />
            </div>
          </>
        )}

        {/* Browse Rooms */}
        {tab === "Browse Rooms" && (
          <div className="room-grid">

            {rooms.map(room => (
              <div className="room-card" key={room.id}>

                <div className="room-card-icon">
                  <BedDouble size={32} />
                </div>

                <span
                  className={`status ${
                    Number(room.available_beds) > 0
                      ? "success"
                      : "danger"
                  }`}
                >
                  {Number(room.available_beds) > 0
                    ? "Available"
                    : "Full"}
                </span>

                <h3>Room {room.room_number}</h3>
                <p>{room.room_type}</p>
                <p>Capacity: {room.capacity}</p>
                <p>Available beds: {room.available_beds}</p>
                <p>{room.facilities}</p>

                <h3>
                  ₹{Number(room.fee).toLocaleString("en-IN")}
                  <small> / month</small>
                </h3>

                <button
                  className="primary-btn full-btn"
                  disabled={
                    busy ||
                    Number(room.available_beds) <= 0 ||
                    hasActiveApplication
                  }
                  onClick={() => apply(room.id)}
                >
                  {approved || pending
                    ? "Application Already Exists"
                    : Number(room.available_beds) > 0
                    ? "Apply for Room"
                    : "Full"}
                </button>

              </div>
            ))}

          </div>
        )}

        {/* My Applications */}
        {tab === "My Applications" && (
          <div className="panel">

            <h3>My Room Applications</h3>

            <Applications
              applications={applications}
              onCancel={cancelApplication}
              busy={busy}
            />

          </div>
        )}

        {/* Fee Payment */}
        {tab === "Fee Payment" && (
          <div className="panel payment-panel">

            <CreditCard size={42} />

            <h3>Hostel Fee Payment</h3>

            {approved ? (
              <>
                <p>Allocated Room: {approved.room_number}</p>

                <h2>
                  ₹{Number(approved.fee).toLocaleString("en-IN")}
                </h2>

                <p>Monthly hostel fee · Demo payment</p>

                <button
                  className="primary-btn"
                  disabled={
                    busy ||
                    payments.some(p => p.status === "Success")
                  }
                  onClick={pay}
                >
                  {payments.some(p => p.status === "Success")
                    ? "Payment Completed"
                    : busy
                    ? "Processing..."
                    : "Pay Now"}
                </button>
              </>
            ) : (
              <p>
                You need an approved room application before payment.
              </p>
            )}

          </div>
        )}

        {/* Payment History */}
        {tab === "Payment History" && (
          <div className="panel">

            <h3>Payment Records</h3>

            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{p.transaction_id}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.created_at}</td>
                    <td>
                      <span className="status success">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {payments.length === 0 && (
              <p>No payments found.</p>
            )}

          </div>
        )}

        {/* My Profile */}
        {tab === "My Profile" && (
          <div className="panel">

            <h3>My Profile</h3>

            <p><strong>Name:</strong> {user?.full_name}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Student ID:</strong> {user?.student_id || "Not provided"}</p>
            <p><strong>Phone:</strong> {user?.phone || "Not provided"}</p>
            <p><strong>Department:</strong> {user?.department || "Not provided"}</p>
            <p><strong>Year:</strong> {user?.year_of_study || "Not provided"}</p>

          </div>
        )}

      </main>
    </div>
  );
}

// Dashboard statistic card
function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

// Applications table with optional cancellation action
function Applications({ applications, onCancel, busy = false }) {
  if (!applications.length) {
    return <p>No applications submitted yet.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Application</th>
          <th>Room</th>
          <th>Date</th>
          <th>Status</th>
          {onCancel && <th>Action</th>}
        </tr>
      </thead>

      <tbody>
        {applications.map(a => (
          <tr key={a.id}>

            <td>#{a.id}</td>
            <td>{a.room_number}</td>
            <td>{a.created_at}</td>

            <td>
              <span
                className={`status ${a.status.toLowerCase()}`}
              >
                {a.status}
              </span>
            </td>

            {onCancel && (
              <td>
                {a.status === "Pending" ? (
                  <button
                    className="cancel-btn"
                    disabled={busy}
                    onClick={() => onCancel(a.id)}
                  >
                    {busy ? "Please wait..." : "Cancel"}
                  </button>
                ) : (
                  <span className="no-action">—</span>
                )}
              </td>
            )}

          </tr>
        ))}
      </tbody>
    </table>
  );
}
