const db = require("../config/db");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

// กำหนดค่า multer สำหรับอัพโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: "./uploads/profiles",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ 5MB
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const mimetype = fileTypes.test(file.mimetype);
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  },
}).single("profile_image");

// ดึงข้อมูลโปรไฟล์
const getProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      `SELECT 
        user_id, 
        name, 
        email, 
        role, 
        profile_image,
        created_at,
        updated_at
      FROM users 
      WHERE user_id = ?`,
      [req.user.user_id]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัพเดทข้อมูลโปรไฟล์
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    // ตรวจสอบอีเมลซ้ำ
    const [existingEmail] = await db.query(
      "SELECT * FROM users WHERE email = ? AND user_id != ?",
      [email, req.user.user_id]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // อัพเดทข้อมูล
    await db.query("UPDATE users SET name = ?, email = ? WHERE user_id = ?", [
      name,
      email,
      req.user.user_id,
    ]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "update_profile",
        "users",
        req.user.user_id,
        JSON.stringify({ name, email }),
      ]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// อัพเดทรูปโปรไฟล์
const updateProfileImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    try {
      // อัพเดทชื่อไฟล์รูปในฐานข้อมูล
      await db.query("UPDATE users SET profile_image = ? WHERE user_id = ?", [
        req.file.filename,
        req.user.user_id,
      ]);

      // บันทึก action log
      await db.query(
        "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
        [
          req.user.user_id,
          "update_profile_image",
          "users",
          req.user.user_id,
          JSON.stringify({ filename: req.file.filename }),
        ]
      );

      res.json({
        message: "Profile image updated successfully",
        filename: req.file.filename,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// เปลี่ยนรหัสผ่าน
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // ดึงข้อมูลผู้ใช้
    const [user] = await db.query(
      "SELECT password FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const validPassword = await bcrypt.compare(
      current_password,
      user[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // เข้ารหัสรหัสผ่านใหม่
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // อัพเดทรหัสผ่าน
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      req.user.user_id,
    ]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "change_password",
        "users",
        req.user.user_id,
        JSON.stringify({ changed_at: new Date() }),
      ]
    );

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
};
