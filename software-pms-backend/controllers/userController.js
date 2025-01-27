const db = require("../config/db");
const bcrypt = require("bcryptjs");

// สร้างผู้ใช้งานใหม่ (สำหรับ Admin เท่านั้น)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ตรวจสอบว่าผู้ใช้งานมี role เป็น Admin
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    // ตรวจสอบว่าอีเมลซ้ำหรือไม่
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // เข้ารหัสรหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // สร้างผู้ใช้งานใหม่
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "create",
        "users",
        result.insertId,
        JSON.stringify({
          name,
          email,
          role,
          created_at: new Date(),
        }),
      ]
    );

    res.status(201).json({
      message: "User created successfully",
      user_id: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงรายการผู้ใช้งานทั้งหมด (สำหรับ Admin เท่านั้น)
const getAllUsers = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const [users] = await db.query(`
      SELECT 
        user_id,
        name,
        email,
        role,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM action_logs WHERE user_id = users.user_id) as activity_count
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูลผู้ใช้งานตาม ID
const getUserById = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ (Admin หรือเจ้าของบัญชีเท่านั้น)
    if (
      req.user.role !== "Admin" &&
      req.user.user_id !== parseInt(req.params.id)
    ) {
      return res.status(403).json({ message: "Permission denied" });
    }

    const [user] = await db.query(
      `
      SELECT 
        user_id,
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users 
      WHERE user_id = ?
    `,
      [req.params.id]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ถ้าเป็น Admin ให้ดึงข้อมูลเพิ่มเติม
    if (req.user.role === "Admin") {
      // ดึงประวัติการทำงาน
      const [activities] = await db.query(
        `
        SELECT * FROM action_logs 
        WHERE user_id = ? 
        ORDER BY action_date DESC 
        LIMIT 10
      `,
        [req.params.id]
      );

      user[0].recent_activities = activities;
    }

    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัพเดทข้อมูลผู้ใช้งาน
const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    // ตรวจสอบสิทธิ์
    if (req.user.role !== "Admin" && req.user.user_id !== parseInt(userId)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // ถ้าไม่ใช่ Admin ห้ามแก้ไข role
    if (req.user.role !== "Admin" && role) {
      return res.status(403).json({ message: "Cannot modify role" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ตรวจสอบอีเมลซ้ำ (ถ้ามีการเปลี่ยนอีเมล)
    if (email && email !== user[0].email) {
      const [existingEmail] = await db.query(
        "SELECT * FROM users WHERE email = ? AND user_id != ?",
        [email, userId]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // อัพเดทข้อมูล
    await db.query(
      `UPDATE users 
       SET name = ?, email = ?${role ? ", role = ?" : ""} 
       WHERE user_id = ?`,
      role ? [name, email, role, userId] : [name, email, userId]
    );

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [req.user.user_id, "update", "users", userId, JSON.stringify(req.body)]
    );

    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// เปลี่ยนรหัสผ่าน
const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { current_password, new_password } = req.body;

    // ตรวจสอบสิทธิ์
    if (req.user.role !== "Admin" && req.user.user_id !== parseInt(userId)) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // ดึงข้อมูลผู้ใช้
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน (ยกเว้น Admin)
    if (req.user.role !== "Admin") {
      const validPassword = await bcrypt.compare(
        current_password,
        user[0].password
      );
      if (!validPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }
    }

    // เข้ารหัสรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // อัพเดทรหัสผ่าน
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      userId,
    ]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "password_change",
        "users",
        userId,
        JSON.stringify({
          changed_at: new Date(),
        }),
      ]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ลบผู้ใช้งาน (สำหรับ Admin เท่านั้น)
const deleteUser = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const userId = req.params.id;

    // ห้ามลบตัวเอง
    if (req.user.user_id === parseInt(userId)) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // ตรวจสอบว่าผู้ใช้มีอยู่จริง
    const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ลบผู้ใช้
    await db.query("DELETE FROM users WHERE user_id = ?", [userId]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [req.user.user_id, "delete", "users", userId, JSON.stringify(user[0])]
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงสถิติผู้ใช้งาน (สำหรับ Admin เท่านั้น)
const getUserStats = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Permission denied" });
    }

    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'Admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'Tester' THEN 1 END) as tester_count,
        COUNT(CASE WHEN role = 'Viewer' THEN 1 END) as viewer_count,
        (SELECT COUNT(*) FROM action_logs WHERE action_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as monthly_activities,
        (SELECT COUNT(DISTINCT user_id) FROM action_logs WHERE action_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as active_users
      FROM users
    `);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  changePassword,
  deleteUser,
  getUserStats,
};
