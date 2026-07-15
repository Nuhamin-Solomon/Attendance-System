import { useState } from "react";
import Icon from "../components/Icon";
import API from "../services/api";

export default function ChangePassword({ onPasswordChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.post("/auth/change-password", {
        currentPassword,
        newPassword
      });

      // Update stored token in localStorage
      localStorage.setItem("token", data.token);
      if (data.user) {
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("username", data.user.username);
      }

      onPasswordChanged();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to change password. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-orb orb-one" />
      <div className="login-orb orb-two" />
      <section className="login-card fade-in">
        <div className="brand-mark">
          <Icon name="settings" size={25} />
        </div>
        <p className="eyebrow">Security Action</p>
        <h1>Change Password</h1>
        <p className="login-intro">
          You are required to change your password before you can proceed to the workspace.
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="currentPassword">
            Current Password
          </label>
          <input
            id="currentPassword"
            className="form-input"
            placeholder="Enter current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <label className="form-label" htmlFor="newPassword">
            New Password
          </label>
          <input
            id="newPassword"
            className="form-input"
            placeholder="Enter new password (min. 8 characters)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength="8"
            required
          />

          <label className="form-label" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            className="form-input"
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength="8"
            required
          />

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Updating..." : <>Update password <Icon name="arrow" size={17} /></>}
          </button>
        </form>

        <button
          className="logout-btn"
          onClick={onLogout}
          style={{ marginTop: "15px", color: "#bed0d4", width: "100%", textAlign: "center" }}
        >
          Cancel and sign out
        </button>
      </section>
    </main>
  );
}
