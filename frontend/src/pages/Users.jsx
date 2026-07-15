import { useEffect, useState } from "react";
import API from "../services/api";
import Icon from "../components/Icon";

const label = (role) => role.replace("_", " ");

export default function Users() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [employeeId, setEmployeeId] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    API.get("/users")
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.error || "Unable to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([API.get("/users"), API.get("/employees")])
      .then(([userResponse, employeeResponse]) => {
        if (active) {
          setUsers(userResponse.data);
          setEmployees(employeeResponse.data);
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.error || "Unable to load users.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        username: username.trim(),
        role,
        employee_id: role === "employee" ? Number(employeeId) : null
      };

      if (password && password.trim().length > 0) {
        payload.password = password;
      }

      if (editingUser) {
        await API.patch(`/users/${editingUser.id}`, payload);
        setMessage("User updated successfully.");
        setEditingUser(null);
      } else {
        await API.post("/users", payload);
        setMessage("User created successfully.");
      }

      setUsername("");
      setPassword("");
      setRole("employee");
      setEmployeeId("");
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save user.");
    }
  };

  const startEdit = (user) => {
    setError("");
    setMessage("");
    setEditingUser(user);
    setUsername(user.username);
    setPassword("");
    setRole(user.role);
    setEmployeeId(user.employee_id || "");
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setUsername("");
    setPassword("");
    setRole("employee");
    setEmployeeId("");
  };

  const deleteUser = async (user) => {
    const currentUsername = localStorage.getItem("username");
    if (user.username === currentUsername) {
      setError("You cannot delete your own logged-in account.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      setError("");
      setMessage("");
      try {
        await API.delete(`/users/${user.id}`);
        setMessage(`User "${user.username}" deleted successfully.`);
        if (editingUser && editingUser.id === user.id) {
          cancelEdit();
        }
        loadUsers();
      } catch (err) {
        setError(err.response?.data?.error || "Unable to delete user.");
      }
    }
  };

  const toggleUser = async (user) => {
    setError("");
    try {
      await API.patch(`/users/${user.id}`, { is_active: !user.is_active });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update user.");
    }
  };

  return (
    <section className="fade-in">
      <div className="page-header">
        <p className="eyebrow">Administration</p>
        <h1>User management</h1>
        <p>Create accounts, update roles, reset passwords, and remove users.</p>
      </div>

      <form className="user-form panel" onSubmit={handleSubmit}>
        <div>
          <div className="panel-title">
            {editingUser ? `Edit user: ${editingUser.username}` : "Add a user"}
          </div>
          <div className="panel-subtitle">
            {editingUser 
              ? "Modify user properties. Leave password blank to keep current." 
              : "Employee accounts are linked to a BioTime employee record."}
          </div>
        </div>

        <input
          className="form-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          aria-label="Username"
          required
        />

        <input
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={editingUser ? "Password (optional)" : "Temporary password"}
          type="password"
          minLength="8"
          aria-label={editingUser ? "New Password (optional)" : "Temporary password"}
          required={!editingUser}
        />

        <select
          className="form-input role-select"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setEmployeeId("");
          }}
          aria-label="Role"
        >
          <option value="employee">Employee</option>
          <option value="admin">Administrator</option>
          <option value="super_admin">Super Admin</option>
        </select>

        {role === "employee" && (
          <select
            className="form-input role-select"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            aria-label="Employee record"
            required
          >
            <option value="">Select employee record</option>
            {employees.map((employee) => (
              <option value={employee.id} key={employee.id}>
                {employee.full_name} — {employee.department || "Unassigned"}
              </option>
            ))}
          </select>
        )}

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-primary" type="submit">
            <Icon name={editingUser ? "settings" : "plus"} size={16} /> 
            {editingUser ? "Save changes" : "Add user"}
          </button>
          {editingUser && (
            <button className="btn btn-ghost" type="button" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">System users</div>
            <div className="panel-subtitle">{users.length} user accounts</div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Employee record</th>
                <th>Role</th>
                <th>Status</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="table-message">
                    Loading users…
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="strong-cell">{user.username}</td>
                    <td className="td-muted">{user.full_name || "—"}</td>
                    <td>
                      <span className="badge badge-orange">{label(user.role)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span className={`badge ${user.is_active ? "badge-green" : "badge-red"}`}>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                        {user.must_change_password && (
                          <span className="badge badge-orange" style={{ fontSize: "9px", padding: "2px 6px", width: "fit-content" }}>
                            Reset Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-ghost" onClick={() => toggleUser(user)}>
                          {user.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn btn-ghost" onClick={() => startEdit(user)}>
                          Edit
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ color: "#c44b55", borderColor: "#fcdada" }} 
                          onClick={() => deleteUser(user)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
