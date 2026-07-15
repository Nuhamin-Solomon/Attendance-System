import { useState } from "react";
import Icon from "../components/Icon";
import API from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleLogin = async (event) => {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const { data } = await API.post("/auth/login", { username, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("mustChangePassword", data.user.must_change_password ? "true" : "false");
      onLogin(data.user);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to sign in. Check that the backend is running.");
    } finally { setLoading(false); }
  };
  return <main className="login-page"><div className="login-orb orb-one"/><div className="login-orb orb-two"/><section className="login-card fade-in"><div className="brand-mark"><Icon name="building" size={25}/></div><p className="eyebrow">Attendance workspace</p><h1>Welcome back</h1><p className="login-intro">Sign in to monitor your people and attendance activity.</p>{error && <div className="error-msg">{error}</div>}<form onSubmit={handleLogin}><label className="form-label" htmlFor="username">Username</label><input id="username" className="form-input" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required/><label className="form-label" htmlFor="password">Password</label><input id="password" className="form-input" placeholder="Enter your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required/><button className="login-btn" type="submit" disabled={loading}>{loading ? "Signing in…" : <>Sign in <Icon name="arrow" size={17}/></>}</button></form></section></main>;
}
