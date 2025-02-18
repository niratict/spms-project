// profileController.js
const db = require("../config/db");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/profiles");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Create uploads directory if it doesn't exist
const ensureUploadDirExists = async () => {
  const uploadDir = "./uploads/profiles";
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// Initialize upload directory
ensureUploadDirExists().catch(console.error);

// Get profile information
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

// Update profile (name only)
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    await db.query("UPDATE users SET name = ? WHERE user_id = ?", [
      name.trim(),
      req.user.user_id,
    ]);

    // Log the action
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "update_profile",
        "users",
        req.user.user_id,
        JSON.stringify({ name }),
      ]
    );

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update profile image
const updateProfileImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    try {
      // Get old image info
      const [user] = await db.query(
        "SELECT profile_image FROM users WHERE user_id = ?",
        [req.user.user_id]
      );

      // Delete old image if it exists
      if (user.length && user[0].profile_image) {
        const oldImagePath = path.join(
          "./uploads/profiles",
          user[0].profile_image
        );
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.error("Error deleting old file:", err);
        }
      }

      // Update database with new image
      await db.query("UPDATE users SET profile_image = ? WHERE user_id = ?", [
        req.file.filename,
        req.user.user_id,
      ]);

      // Log the action
      await db.query(
        "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
        [
          req.user.user_id,
          "update_profile_image",
          "users",
          req.user.user_id,
          JSON.stringify({
            new_image: req.file.filename,
            old_image: user[0]?.profile_image,
          }),
        ]
      );

      res.json({
        message: "Profile image updated successfully",
        filename: req.file.filename,
      });
    } catch (error) {
      // Clean up uploaded file if database operation fails
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error("Error deleting uploaded file:", err);
      }
      res.status(500).json({ error: error.message });
    }
  });
};

// Delete profile image
const deleteProfileImage = async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT profile_image FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (!user.length || !user[0].profile_image) {
      return res.status(404).json({ message: "Profile image not found" });
    }

    const imagePath = path.join("./uploads/profiles", user[0].profile_image);

    // Delete the image file
    try {
      await fs.unlink(imagePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }

    // Update database
    await db.query("UPDATE users SET profile_image = NULL WHERE user_id = ?", [
      req.user.user_id,
    ]);

    // Log the action
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "delete_profile_image",
        "users",
        req.user.user_id,
        JSON.stringify({ deleted_image: user[0].profile_image }),
      ]
    );

    res.json({ message: "Profile image deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    // Validate input
    if (!current_password || !new_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (new_password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Get user data
    const [user] = await db.query(
      "SELECT password FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (!user.length) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      current_password,
      user[0].password
    );

    if (!validPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      req.user.user_id,
    ]);

    // Log the action
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
  deleteProfileImage,
  changePassword,
};
