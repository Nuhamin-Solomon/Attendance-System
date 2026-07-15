import { useState } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(localStorage.getItem("token")));
  const [mustChangePassword, setMustChangePassword] = useState(() => localStorage.getItem("mustChangePassword") === "true");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("mustChangePassword");
    setIsLoggedIn(false);
    setMustChangePassword(false);
  };

  const handleLogin = (user) => {
    setMustChangePassword(user?.must_change_password === true);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (mustChangePassword) {
    return (
      <ChangePassword
        onPasswordChanged={() => {
          localStorage.setItem("mustChangePassword", "false");
          setMustChangePassword(false);
        }}
        onLogout={logout}
      />
    );
  }

  return <Dashboard onLogout={logout} />;
}
