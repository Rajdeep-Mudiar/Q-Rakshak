import { useState, useEffect, useRef } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Stethoscope,
  Microscope,
  User,
  KeyRound,
  RefreshCw,
  X,
} from "lucide-react";
import { usersApi } from "../../api/users";
import { animateEntrance, animateCardStagger } from "../../utils/motion";
import SquareLoader from "../../components/common/SquareLoader.jsx";

export default function UserManagementConsole() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const containerRef = useRef(null);

  // Modal States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    secondary_email: "",
    emergency_phone: "",
    role: "patient",
    hospital_affiliation: "",
    license_number: "",
  });

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.listUsers();
      if (data?.users) setUsers(data.users);
    } catch (err) {
      setError(err.message || "Failed to load platform users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    if (containerRef.current) {
      animateEntrance(containerRef.current, { y: 15, duration: 0.35 });
      animateCardStagger(containerRef.current, ".panel");
    }
  }, []);

  async function handleCreate(e) {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await usersApi.createUser(newUser);
      setSuccessMsg(`User account '${newUser.username}' created successfully.`);
      setCreateModalOpen(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        email: "",
        secondary_email: "",
        emergency_phone: "",
        role: "patient",
        hospital_affiliation: "",
        license_number: "",
      });
      loadUsers();
    } catch (err) {
      setError(err.message || "Failed to create user.");
    }
  }

  async function handleUpdate(e) {
    if (e) e.preventDefault();
    if (!editUser) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await usersApi.updateUser(editUser.user_id, {
        name: editUser.name,
        email: editUser.email,
        secondary_email: editUser.secondary_email,
        emergency_phone: editUser.emergency_phone,
        role: editUser.role,
        hospital_affiliation: editUser.hospital_affiliation,
        license_number: editUser.license_number,
      });
      setSuccessMsg(`User account '${editUser.username}' updated successfully.`);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update user.");
    }
  }

  async function handleDelete(userId) {
    setError(null);
    setSuccessMsg(null);
    try {
      await usersApi.deleteUser(userId);
      setSuccessMsg(`User account '${userId}' deleted.`);
      setDeleteUserModal(null);
      setDeleteConfirmText("");
      loadUsers();
    } catch (err) {
      setError(err.message || "Failed to delete user.");
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchQuery =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchQuery && matchRole;
  });

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>
      {/* Header Bar */}
      <div className="panel" style={{ padding: "18px 22px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderLeft: "3px solid var(--primary)", borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ padding: "10px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "var(--radius-sm)" }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span className="step-badge">ADMIN GOVERNANCE</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.35rem", fontWeight: 800, color: "var(--ink-primary)", margin: 0 }}>
                  Enterprise User & Authority Management
                </h2>
              </div>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
                Manage role access control, credentials, institutional profiles, and emergency routing in SQLite.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateModalOpen(true)}
            style={{ padding: "8px 16px", fontSize: "0.78rem" }}
          >
            <UserPlus size={14} />
            <span>Add New User Account</span>
          </button>
        </div>

        {/* Search & Role Filter Bar */}
        <div style={{ display: "flex", gap: "8px", marginTop: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "7px 12px 7px 32px", border: "1px solid var(--border-default)", fontSize: "0.78rem", background: "var(--bg-canvas)", borderRadius: "var(--radius-sm)" }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "patient", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                className={`view-pill-btn ${filterRole === r ? "active" : ""}`}
                style={{ borderRadius: "var(--radius-sm)", padding: "5px 12px", fontSize: "0.72rem", textTransform: "capitalize" }}
                onClick={() => setFilterRole(r)}
              >
                {r === "all" ? "All Users" : (r === "patient" ? "Patients" : "Admins")}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={loadUsers}
            style={{ padding: "6px 12px", fontSize: "0.74rem" }}
            title="Refresh user list"
          >
            <RefreshCw size={12} className={loading ? "spin" : ""} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: "var(--state-success-bg)", color: "var(--state-success)", border: "1px solid var(--state-success)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: "0.76rem", fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Bento Stat Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
        <div className="bento-stat" style={{ borderRadius: "var(--radius-md)" }}>
          <div className="corner-tag-arrow">↗</div>
          <div className="bento-stat-num">{users.length}</div>
          <div className="bento-stat-label">Total Accounts</div>
        </div>
        <div className="bento-stat" style={{ background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)" }}>
          <div className="corner-tag-arrow">↗</div>
          <div className="bento-stat-num" style={{ color: "var(--primary)" }}>
            {users.filter((u) => u.role === "patient").length}
          </div>
          <div className="bento-stat-label">Patients</div>
        </div>
        <div className="bento-stat" style={{ background: "var(--bg-surface-alt)", borderRadius: "var(--radius-md)" }}>
          <div className="corner-tag-arrow">↗</div>
          <div className="bento-stat-num" style={{ color: "var(--primary)" }}>
            {users.filter((u) => u.role === "doctor" || u.role === "clinician").length}
          </div>
          <div className="bento-stat-label">Doctors</div>
        </div>
        <div className="bento-stat" style={{ borderRadius: "var(--radius-md)" }}>
          <div className="corner-tag-arrow">↗</div>
          <div className="bento-stat-num" style={{ color: "var(--ink-primary)" }}>
            {users.filter((u) => u.role === "admin").length}
          </div>
          <div className="bento-stat-label">Admins</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-panel" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", padding: 0 }}>
        <div className="data-table-wrap" style={{ borderRadius: "var(--radius-md)", border: "none" }}>
          <table className="clinical-data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name & Username</th>
                <th>Authority Role</th>
                <th>Primary Contact</th>
                <th>Hospital / Lab Affiliation</th>
                <th>Medical License</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td><code>{u.id}</code></td>
                    <td>
                      <strong style={{ display: "block" }}>{u.name}</strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>@{u.username}</span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 6px",
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-sm)",
                        background: u.role === "admin" ? "var(--accent-violet-soft)" : (u.role === "doctor" || u.role === "clinician") ? "rgba(217, 119, 6, 0.15)" : "var(--risk-low-bg)",
                        color: u.role === "admin" ? "var(--accent-violet)" : (u.role === "doctor" || u.role === "clinician") ? "var(--gold)" : "var(--risk-low)",
                        textTransform: "capitalize",
                      }}>
                        {u.role === "admin" ? "Administrator" : (u.role === "doctor" || u.role === "clinician") ? "Doctor" : "Patient"}
                      </span>
                    </td>
                    <td>
                      <div>{u.email}</div>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{u.emergency_phone}</span>
                    </td>
                    <td>{u.hospital_affiliation || "—"}</td>
                    <td><code style={{ fontSize: "0.70rem" }}>{u.license_number || "—"}</code></td>
                    <td style={{ textAlign: "right" }}>
                      {u.role === "patient" ? (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                            padding: "3px 8px",
                            background: "var(--bg-surface-alt)",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-default)",
                            fontStyle: "italic",
                          }}
                        >
                          Protected (Patient)
                        </span>
                      ) : (
                        <div style={{ display: "inline-flex", gap: "4px" }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setEditUser(u)}
                            style={{ padding: "3px 8px", fontSize: "0.68rem", borderRadius: "var(--radius-sm)" }}
                            title="Edit user profile & authority"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setDeleteUserModal(u)}
                            style={{ padding: "3px 8px", fontSize: "0.68rem", color: "var(--risk-high)", borderColor: "var(--risk-high)", borderRadius: "var(--radius-sm)" }}
                            title="Delete user account"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "28px 16px" }}>
                    {loading ? (
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <SquareLoader size="sm" label="Loading users from SQLite database..." />
                      </div>
                    ) : (
                      "No matching user profiles found."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add New User */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-modal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <strong style={{ fontSize: "1.05rem", color: "var(--primary)" }}>Register New Platform User</strong>
              <button type="button" onClick={() => setCreateModalOpen(false)} style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Username</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    autoComplete="username"
                    placeholder="e.g. rahul.user"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Password</label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    autoComplete="new-password"
                    placeholder="Enter password"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    autoComplete="name"
                    placeholder="e.g. Rahul Verma"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Authority Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem", background: "var(--bg-surface)" }}
                  >
                    <option value="patient">Patient (Autonomous Health Checkups & Twin)</option>
                    <option value="admin">Administrator (Audit & Security)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Primary Email</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="patient@healthnet.org"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Emergency Phone Number</label>
                  <input
                    type="text"
                    value={newUser.emergency_phone}
                    onChange={(e) => setNewUser({ ...newUser, emergency_phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Hospital / Lab Affiliation</label>
                  <input
                    type="text"
                    value={newUser.hospital_affiliation}
                    onChange={(e) => setNewUser({ ...newUser, hospital_affiliation: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Health Record / Staff ID</label>
                  <input
                    type="text"
                    value={newUser.license_number}
                    onChange={(e) => setNewUser({ ...newUser, license_number: e.target.value })}
                    placeholder="PT-REC-2026-XXXX"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User Authority & Profile */}
      {editUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-modal)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-default)", paddingBottom: "10px" }}>
              <strong style={{ fontSize: "1.05rem", color: "var(--primary)" }}>Edit Authority: {editUser.name}</strong>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: "transparent", border: 0, cursor: "pointer", color: "var(--text-muted)" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Full Name</label>
                  <input
                    type="text"
                    value={editUser.name || ""}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Authority Role</label>
                  <select
                    value={editUser.role || "patient"}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem", background: "var(--bg-surface)" }}
                  >
                    <option value="patient">Patient (Autonomous Health Checkups & Twin)</option>
                    <option value="admin">Administrator (Audit & Security)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Email</label>
                  <input
                    type="email"
                    value={editUser.email || ""}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={editUser.emergency_phone || ""}
                    onChange={(e) => setEditUser({ ...editUser, emergency_phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>Affiliation</label>
                  <input
                    type="text"
                    value={editUser.hospital_affiliation || ""}
                    onChange={(e) => setEditUser({ ...editUser, hospital_affiliation: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>License Number</label>
                  <input
                    type="text"
                    value={editUser.license_number || ""}
                    onChange={(e) => setEditUser({ ...editUser, license_number: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", fontSize: "0.78rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Confirmation */}
      {deleteUserModal && (
        <div className="modal-overlay" style={{ backdropFilter: "blur(6px)" }}>
          <div className="modal-content" style={{ maxWidth: "480px", padding: "24px", borderRadius: "var(--radius-md)", border: "1px solid var(--state-error)", background: "#FFFFFF", boxShadow: "var(--shadow-modal)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--state-error)", marginBottom: "12px", borderBottom: "1px solid var(--border-default)", paddingBottom: "12px" }}>
              <AlertCircle size={22} />
              <div>
                <strong style={{ fontSize: "0.95rem", textTransform: "uppercase" }}>Confirm User Account Deletion</strong>
                <span style={{ fontSize: "0.65rem", display: "block", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  TARGET: {deleteUserModal.name} ({deleteUserModal.username})
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.80rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 14px 0" }}>
              Are you sure you want to permanently delete user <strong>{deleteUserModal.name}</strong> (<code>{deleteUserModal.username}</code>) from SQLite? This action will be logged in the immutable WORM audit trail.
            </p>

            <div style={{ marginBottom: "16px", background: "var(--bg-canvas)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Type <code style={{ color: "var(--state-error)", fontWeight: 800, background: "var(--state-error-bg)", padding: "2px 6px", borderRadius: "var(--radius-xs)" }}>confirm deletion account</code> to authorize:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="confirm deletion account"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: deleteConfirmText.trim().toLowerCase() === "confirm deletion account" ? "2px solid var(--state-success)" : "1px solid var(--border-default)",
                  fontSize: "0.80rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDeleteUserModal(null);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  if (deleteConfirmText.trim().toLowerCase() === "confirm deletion account") {
                    handleDelete(deleteUserModal.id);
                    setDeleteConfirmText("");
                  }
                }}
                disabled={deleteConfirmText.trim().toLowerCase() !== "confirm deletion account"}
                style={{
                  background: deleteConfirmText.trim().toLowerCase() === "confirm deletion account" ? "var(--risk-high)" : "#CBD5E1",
                  borderColor: deleteConfirmText.trim().toLowerCase() === "confirm deletion account" ? "var(--risk-high)" : "#CBD5E1",
                  cursor: deleteConfirmText.trim().toLowerCase() === "confirm deletion account" ? "pointer" : "not-allowed",
                  textTransform: "uppercase",
                  fontWeight: 800,
                }}
              >
                Permanently Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
