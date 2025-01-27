// middleware/auth.js
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await db.query(
      "SELECT user_id, name, email, role FROM users WHERE user_id = ?",
      [decoded.userId]
    );

    if (!users.length) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Export middleware function that can be used directly with router.use()
module.exports = {
  auth: authenticateToken,
  authorizeRole,
};
