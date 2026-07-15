const bcrypt = require("bcrypt");
const pool = require("../config/db");

const roles = ["super_admin", "admin", "employee"];
const publicUser = ({ id, username, role, is_active, created_at, employee_id, full_name, must_change_password }) => ({ id, username, role, is_active, created_at, employee_id, full_name, must_change_password });

exports.list = async (_req, res) => {
  try {
    const result = await pool.query("SELECT users.id, users.username, users.role, users.is_active, users.created_at, users.employee_id, users.must_change_password, employees.full_name FROM users LEFT JOIN employees ON employees.id = users.employee_id ORDER BY users.created_at ASC");
    return res.json(result.rows.map(publicUser));
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  const { username, password, role = "employee", employee_id = null } = req.body || {};
  if (!username || !password || password.length < 8) return res.status(400).json({ error: "Username and a password of at least 8 characters are required." });
  if (!roles.includes(role)) return res.status(400).json({ error: "Invalid role." });
  if (role === "employee" && !employee_id) return res.status(400).json({ error: "Select the employee who will use this account." });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    if (employee_id) {
      const employee = await pool.query("SELECT id FROM employees WHERE id = $1", [employee_id]);
      if (!employee.rows[0]) return res.status(400).json({ error: "Selected employee was not found." });
    }
    const result = await pool.query("INSERT INTO users (username, password_hash, role, employee_id, must_change_password) VALUES ($1, $2, $3, $4, TRUE) RETURNING id, username, role, is_active, created_at, employee_id, must_change_password", [username.trim(), passwordHash, role, employee_id || null]);
    return res.status(201).json(publicUser(result.rows[0]));
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That username is already in use." });
    return res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  const { username, role, is_active, password, employee_id, must_change_password } = req.body || {};
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user ID." });
  if (role !== undefined && !roles.includes(role)) return res.status(400).json({ error: "Invalid role." });
  if (password !== undefined && password.trim().length > 0 && password.length < 8) {
    return res.status(400).json({ error: "Passwords must be at least 8 characters." });
  }
  if (id === req.user.id && is_active === false) return res.status(400).json({ error: "You cannot deactivate your own account." });
  try {
    const current = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (!current.rows[0]) return res.status(404).json({ error: "User not found." });
    const user = current.rows[0];

    // Check if username is changing and is already in use
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const exists = await pool.query("SELECT id FROM users WHERE LOWER(username) = LOWER($1)", [username.trim()]);
      if (exists.rows.length > 0) {
        return res.status(409).json({ error: "That username is already in use." });
      }
    }

    const hasNewPassword = password && password.trim().length > 0;
    const passwordHash = hasNewPassword ? await bcrypt.hash(password, 12) : user.password_hash;
    
    // Automatically require password change if admin changes/resets password,
    // or if the must_change_password flag is explicitly set.
    const newMustChange = must_change_password !== undefined 
      ? must_change_password 
      : (hasNewPassword ? true : user.must_change_password);

    const result = await pool.query("UPDATE users SET username = $1, role = $2, is_active = $3, password_hash = $4, employee_id = $5, must_change_password = $6, updated_at = NOW() WHERE id = $7 RETURNING id, username, role, is_active, created_at, employee_id, must_change_password", [username ? username.trim() : user.username, role ?? user.role, is_active ?? user.is_active, passwordHash, employee_id !== undefined ? employee_id : user.employee_id, newMustChange, id]);
    return res.json(publicUser(result.rows[0]));
  } catch (error) { return res.status(500).json({ error: error.message }); }
};

exports.delete = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user ID." });
  if (id === req.user.id) return res.status(400).json({ error: "You cannot delete your own account." });
  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "User not found." });
    return res.json({ success: true, message: "User deleted successfully." });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
