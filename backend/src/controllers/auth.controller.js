const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const publicUser = ({ id, username, role, is_active, created_at, must_change_password }) => ({ id, username, role, is_active, created_at, must_change_password });

exports.login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "Username and password are required." });
  try {
    const result = await pool.query("SELECT id, username, role, password_hash, is_active, must_change_password FROM users WHERE LOWER(username) = LOWER($1)", [username.trim()]);
    const user = result.rows[0];
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Invalid username or password." });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, must_change_password: user.must_change_password }, process.env.JWT_SECRET, { expiresIn: "8h" });
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Unable to sign in.", detail: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role, is_active, created_at, must_change_password FROM users WHERE id = $1", [req.user.id]);
    if (!result.rows[0] || !result.rows[0].is_active) return res.status(401).json({ error: "Your account is no longer active." });
    return res.json(publicUser(result.rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Current password and a new password of at least 8 characters are required." });
  }
  try {
    const result = await pool.query("SELECT password_hash FROM users WHERE id = $1", [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "User not found." });

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(400).json({ error: "Incorrect current password." });

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2", [newHash, req.user.id]);

    const userResult = await pool.query("SELECT id, username, role, is_active, created_at, must_change_password FROM users WHERE id = $1", [req.user.id]);
    const updatedUser = userResult.rows[0];

    const token = jwt.sign({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role, must_change_password: false }, process.env.JWT_SECRET, { expiresIn: "8h" });
    return res.json({ message: "Password changed successfully.", token, user: publicUser(updatedUser) });
  } catch (error) {
    return res.status(500).json({ error: "Unable to change password.", detail: error.message });
  }
};
