
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  BedDouble,
  Users,
  ClipboardList,
  CreditCard,
  LogOut,
  Building2,
  RefreshCw,
  Plus
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ROOM_TYPES = {
  "Single Sharing": 1,
  "Double Sharing": 2,
  "Triple Sharing": 3,
  "Four Sharing": 4
};

const INITIAL_FORM = {
  room_type: "Single Sharing",
  capacity: 1,
  quantity: 1,
  fee: "",
  facilities: ""
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("Dashboard");
  const [rooms, setRooms] = useState([]);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const [increaseQuantities, setIncreaseQuantities] = useState({
    "Single Sharing": 1,
    "Double Sharing": 1,
    "Triple Sharing": 1,
    "Four Sharing": 1
  });

  // Load dashboard data
  const loadData = async () => {
    setRefreshing(true);

    try {
      const [r, a, st, p, s] = await Promise.all([
        api.get("?action=rooms"),
        api.get("?action=all_applications"),
        api.get("?action=students"),
        api.get("?action=payments"),
        api.get("?action=stats")
      ]);

      setRooms(Array.isArray(r.data) ? r.data : []);
      setApplications(Array.isArray(a.data) ? a.data : []);
      setStudents(Array.isArray(st.data) ? st.data : []);
      setPayments(Array.isArray(p.data) ? p.data : []);
      setStats(s.data || {});
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.error || "Unable to load dashboard data"
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Change room type
  const changeRoomType = (type) => {
    setForm(previous => ({
      ...previous,
      room_type: type,
      capacity: ROOM_TYPES[type]
    }));
  };

  // Add rooms
  const addRoom = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await api.post("?action=add_room", {
        room_type: form.room_type,
        quantity: Number(form.quantity),
        capacity: Number(form.capacity),
        fee: Number(form.fee),
        facilities: form.facilities.trim()
      });

      setSuccess(response.data.message || "Rooms added successfully!");
      setForm({ ...INITIAL_FORM });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not add rooms");
    } finally {
      setSaving(false);
    }
  };

  // Increase room quantity
  const increaseRoomQuantity = async (type) => {
    const quantity = Number(increaseQuantities[type]);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      setError("Enter a quantity between 1 and 100");
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "?action=increase_room_quantity",
        {
          room_type: type,
          quantity
        }
      );

      setSuccess(response.data.message || "Room quantity increased!");

      setIncreaseQuantities(previous => ({
        ...previous,
        [type]: 1
      }));

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not increase room quantity"
      );
    }
  };

  // Delete room
  const deleteRoom = async (id) => {
    if (!window.confirm("Are you sure you want to delete this room?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.post("?action=delete_room", { room_id: id });
      setSuccess("Room deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete room");
    }
  };

  // Approve or reject application
  const approve = async (id, status) => {
    const remarks = status === "Rejected"
      ? window.prompt("Enter rejection reason:")
      : "";

    if (status === "Rejected" && remarks === null) return;

    if (!window.confirm(`${status} this application?`)) return;

    setError("");
    setSuccess("");

    try {
      await api.post("?action=update_application", {
        application_id: id,
        status,
        remarks
      });

      setSuccess(`Application ${status.toLowerCase()} successfully.`);
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error || "Application update failed"
      );
    }
  };

  // Deactivate student account
  const deactivateStudent = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this student account? The student will no longer be able to log in. Their application and payment history will be preserved."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.post(
        "?action=deactivate_student",
        { student_id: id }
      );

      setSuccess(
        response.data.message || "Student account deactivated successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.error || "Could not deactivate student"
      );
    }
  };

  // Logout
  const signOut = async () => {
    await logout();
    navigate("/");
  };

  // Room statistics
  const getRoomCount = (type) =>
    rooms.filter(room => room.room_type === type).length;

  const totalRooms = rooms.length;

  const totalBeds = rooms.reduce(
    (sum, room) => sum + Number(room.capacity || 0),
    0
  );

  const availableBeds = rooms.reduce(
    (sum, room) => sum + Number(room.available_beds || 0),
    0
  );

  const occupiedBeds = totalBeds - availableBeds;

  // Sidebar navigation
  const menu = [
    ["Dashboard", Home],
    ["Manage Rooms", BedDouble],
    ["Students", Users],
    ["Applications", ClipboardList],
    ["Payments", CreditCard]
  ];

  return (
    <div className="dashboard-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Building2 />
          <span>HostelEase</span>
        </div>

        <div className="sidebar-user">
          <div className="avatar">
            {(user?.full_name || "A").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{user?.full_name || "Administrator"}</strong>
            <small>Administrator</small>
          </div>
        </div>

        <p className="menu-label">ADMIN MENU</p>

        <nav>
          {menu.map(([label, Icon]) => (
            <button
              key={label}
              className={`side-link ${tab === label ? "active" : ""}`}
              onClick={() => {
                setTab(label);
                setError("");
                setSuccess("");
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="side-link logout-link" onClick={signOut}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">

        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <h2>{tab}</h2>
            <p>Hostel administration panel</p>
          </div>

          <button
            className="icon-btn"
            onClick={loadData}
            title="Refresh dashboard"
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? "spin" : ""}
            />
          </button>
        </header>

        {/* MESSAGES */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* DASHBOARD */}
        {tab === "Dashboard" && (
          <>
            <div className="stat-grid">
              <Stat title="Total Students" value={stats.students ?? 0} />
              <Stat title="Total Rooms" value={totalRooms} />
              <Stat title="Pending Applications" value={stats.applications ?? 0} />
              <Stat title="Approved Applications" value={stats.approved ?? 0} />
              <Stat
                title="Total Fee Collection"
                value={`₹${Number(stats.payments || 0).toLocaleString("en-IN")}`}
              />
            </div>

            <div className="stat-grid">
              <Stat
                title="Single Sharing Rooms"
                value={getRoomCount("Single Sharing")}
              />

              <Stat
                title="Double Sharing Rooms"
                value={getRoomCount("Double Sharing")}
              />

              <Stat
                title="Triple Sharing Rooms"
                value={getRoomCount("Triple Sharing")}
              />

              <Stat
                title="Four Sharing Rooms"
                value={getRoomCount("Four Sharing")}
              />

              <Stat title="Total Beds" value={totalBeds} />
              <Stat title="Available Beds" value={availableBeds} />
            </div>

            <div className="panel">
              <h3>Recent Applications</h3>
              <ApplicationTable
                applications={applications.slice(0, 5)}
                approve={approve}
              />
            </div>
          </>
        )}

        {/* MANAGE ROOMS */}
        {tab === "Manage Rooms" && (
          <>
            <div className="panel">
              <h3>
                <Plus size={20} />
                Add New Rooms
              </h3>
            <form className="room-form" onSubmit={addRoom}>

                <div className="form-field">
                  <label>Room Type</label>
                  <select
                    value={form.room_type}
                    onChange={e => changeRoomType(e.target.value)}
                  >
                    {Object.keys(ROOM_TYPES).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Capacity (Beds per Room)</label>
                  <input
                    type="number"
                    value={form.capacity}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Number of Rooms to Add</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    placeholder="e.g. 5"
                    value={form.quantity}
                    onChange={e =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Monthly Fee per Room (₹)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={form.fee}
                    onChange={e =>
                      setForm({ ...form, fee: e.target.value })
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Facilities</label>
                  <input
                    placeholder="e.g. Fan, Wi-Fi, Desk"
                    value={form.facilities}
                    onChange={e =>
                      setForm({ ...form, facilities: e.target.value })
                    }
                  />
                </div>

                <div className="form-field form-submit">
                  <label>&nbsp;</label>
                  <button className="primary-btn" disabled={saving}>
                    {saving ? "Adding Rooms..." : "Add Rooms"}
                  </button>
                </div>

              </form>
            </div>

            <div className="panel">
              <h3>Room Quantity Management</h3>
              <div className="room-quantity-grid">
                {Object.keys(ROOM_TYPES).map(type => {
                  const count = getRoomCount(type);
                  const beds = count * ROOM_TYPES[type];

                  return (
                    <div className="quantity-card" key={type}>
                      <h3>{type}</h3>
                      <h2>{count} Rooms</h2>
                      <p>{beds} Total Beds</p>

                      <label>Additional rooms</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={increaseQuantities[type]}
                        onChange={e =>
                          setIncreaseQuantities({
                            ...increaseQuantities,
                            [type]: e.target.value
                          })
                        }
                        placeholder="Quantity to add"
                      />

                      <button
                        className="primary-btn"
                        disabled={count === 0}
                        onClick={() => increaseRoomQuantity(type)}
                      >
                        <Plus size={16} />
                        Increase Quantity
                      </button>

                      {count === 0 && (
                        <small>Add this room type first.</small>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="panel">
              <h3>Room and Bed Summary</h3>
              <div className="stat-grid">
                <Stat title="Total Rooms" value={totalRooms} />
                <Stat title="Total Beds" value={totalBeds} />
                <Stat title="Occupied Beds" value={occupiedBeds} />
                <Stat title="Available Beds" value={availableBeds} />
              </div>
            </div>

            <div className="panel">
              <h3>All Hostel Rooms ({rooms.length})</h3>

              {rooms.length === 0 ? (
                <p>No rooms added yet. Use the form above to add your first rooms.</p>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Type</th>
                        <th>Capacity</th>
                        <th>Occupied</th>
                        <th>Available</th>
                        <th>Fee</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rooms.map(room => (
                        <tr key={room.id}>
                          <td>{room.room_number}</td>
                          <td>{room.room_type}</td>
                          <td>{room.capacity}</td>
                          <td>{room.occupied}</td>
                          <td>{room.available_beds}</td>
                          <td>
                            ₹{Number(room.fee).toLocaleString("en-IN")}
                          </td>
                          <td>
                            <button
                              className="danger-btn"
                              onClick={() => deleteRoom(room.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* STUDENTS */}
        {tab === "Students" && (
          <div className="panel">
            <h3>Registered Students ({students.length})</h3>

            {students.length === 0 ? (
              <p>No registered students found.</p>
            ) : (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Student ID</th>
                      <th>Email</th>
                      <th>Room</th>
                      <th>Account Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {students.map(student => {
                      const active = Number(student.is_active) === 1;

                      return (
                        <tr key={student.id}>
                          <td>{student.full_name}</td>
                          <td>{student.student_id || "-"}</td>
                          <td>{student.email}</td>
                          <td>{student.room_number || "-"}</td>
                          <td>
                            <span
                              className={`status ${
                                active ? "success" : "cancelled"
                              }`}
                            >
                              {active ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td>
                            {active ? (
                              <button
                                className="danger-btn"
                                onClick={() => deactivateStudent(student.id)}
                              >
                                Deactivate
                              </button>
                            ) : (
                              <span className="no-action">
                                Deactivated
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* APPLICATIONS */}
        {tab === "Applications" && (
          <div className="panel">
            <h3>Student Room Applications</h3>
            <ApplicationTable
              applications={applications}
              approve={approve}
            />
          </div>
        )}

        {/* PAYMENTS */}
        {tab === "Payments" && (
          <div className="panel">
            <h3>Payment Records</h3>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map(payment => (
                    <tr key={payment.id}>
                      <td>{payment.full_name || "-"}</td>
                      <td>{payment.transaction_id}</td>
                      <td>
                        ₹{Number(payment.amount).toLocaleString("en-IN")}
                      </td>
                      <td>{payment.created_at}</td>
                      <td>
                        <span className="status success">
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {payments.length === 0 && (
              <p>No payment records found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


// STATISTIC CARD
function Stat({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}


// APPLICATION TABLE
function ApplicationTable({ applications, approve }) {
  if (!applications.length) {
    return <p>No applications found.</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Student</th>
            <th>Room</th>
            <th>Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {applications.map(application => (
            <tr key={application.id}>
              <td>#{application.id}</td>
              <td>{application.full_name || "Student"}</td>
              <td>{application.room_number}</td>
              <td>{application.created_at}</td>
              <td>
                <span
                  className={`status ${
                    (application.status || "").toLowerCase()
                  }`}
                >
                  {application.status}
                </span>
              </td>
              <td>
                {application.status === "Pending" ? (
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => approve(application.id, "Approved")}
                    >
                      Approve
                    </button>

                    <button
                      className="danger-btn"
                      onClick={() => approve(application.id, "Rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  "Processed"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
