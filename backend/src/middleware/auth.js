const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication is required." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);

    // If password change is required, only allow access to change-password and profile checks
    if (req.user.must_change_password) {
      const isChangePasswordRoute = req.baseUrl === "/api/auth" && req.path === "/change-password";
      const isMeRoute = req.baseUrl === "/api/auth" && req.path === "/me";
      if (!isChangePasswordRoute && !isMeRoute) {
        return res.status(403).json({
          error: "Password change is required before proceeding.",
          code: "PASSWORD_CHANGE_REQUIRED"
        });
      }
    }

    return next();
  } catch {
    return res.status(401).json({ error: "Your session is invalid or has expired." });
  }
};

const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: "You do not have permission to perform this action." });
  return next();
};

module.exports = { requireAuth, allowRoles };
