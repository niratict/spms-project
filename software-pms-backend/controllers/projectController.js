const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

// กำหนดการตั้งค่า multer สำหรับอัพโหลดรูปภาพ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/projects/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "project-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// สร้าง Project ใหม่
const createProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date } = req.body;
    let photoPath = null;

    if (req.file) {
      photoPath = req.file.filename;
    }

    const [result] = await db.query(
      "INSERT INTO projects (name, description, photo, start_date, end_date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        description,
        photoPath,
        start_date,
        end_date,
        "Active",
        req.user.name,
      ]
    );

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "create",
        "projects",
        result.insertId,
        JSON.stringify({ ...req.body, photo: photoPath }),
      ]
    );

    res.status(201).json({
      message: "Project created successfully",
      project_id: result.insertId,
      photo: photoPath,
    });
  } catch (error) {
    // ถ้ามีข้อผิดพลาด ให้ลบไฟล์รูปภาพที่อัพโหลดไว้
    if (req.file) {
      await fs
        .unlink(path.join("uploads/projects/", req.file.filename))
        .catch(() => {});
    }
    res.status(500).json({ error: error.message });
  }
};

// ดึงรายการ Project ทั้งหมด
const getAllProjects = async (req, res) => {
  try {
    // ดึงข้อมูล projects พร้อมจำนวน sprints และรูปภาพ
    const [projects] = await db.query(`
      SELECT p.*, 
        COUNT(DISTINCT s.sprint_id) as sprint_count,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests
      FROM projects p
      LEFT JOIN sprints s ON p.project_id = s.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      GROUP BY p.project_id
    `);

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงข้อมูล Project ตาม ID
const getProjectById = async (req, res) => {
  try {
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ดึงข้อมูล sprints ที่เกี่ยวข้อง
    const [sprints] = await db.query(
      "SELECT * FROM sprints WHERE project_id = ?",
      [req.params.id]
    );

    project[0].sprints = sprints;

    res.json(project[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;

    // ดึงข้อมูล project เดิม
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    let photoPath = project[0].photo;

    // ถ้ามีการอัพโหลดรูปใหม่
    if (req.file) {
      // ลบรูปเก่า (ถ้ามี)
      if (project[0].photo) {
        try {
          await fs.unlink(path.join("uploads/projects/", project[0].photo));
        } catch (err) {
          console.error("Error deleting old image:", err);
          // ไม่ต้อง return error เพราะถ้าลบไม่ได้ก็ไม่เป็นไร
        }
      }
      photoPath = req.file.filename;
    }

    // เพิ่มการตรวจสอบว่าถ้าส่ง photo มาเป็น null ให้ลบรูปเก่าออก
    if (req.body.photo === null && project[0].photo) {
      try {
        await fs.unlink(path.join("uploads/projects/", project[0].photo));
        photoPath = null;
      } catch (err) {
        console.error("Error deleting image:", err);
      }
    }

    await db.query(
      `UPDATE projects 
       SET name = ?, description = ?, photo = ?, start_date = ?, 
           end_date = ?, status = ?, updated_by = ?
       WHERE project_id = ?`,
      [
        name,
        description,
        photoPath,
        start_date,
        end_date,
        status,
        req.user.name,
        req.params.id,
      ]
    );

    res.json({
      message: "Project updated successfully",
      photo: photoPath,
    });
  } catch (error) {
    // ถ้ามีข้อผิดพลาด ให้ลบไฟล์รูปภาพที่อัพโหลดไว้
    if (req.file) {
      try {
        await fs.unlink(path.join("uploads/projects/", req.file.filename));
      } catch (err) {
        console.error("Error deleting uploaded file:", err);
      }
    }
    res.status(500).json({ error: error.message });
  }
};

// ลบ Project
const deleteProject = async (req, res) => {
  try {
    const [project] = await db.query(
      "SELECT * FROM projects WHERE project_id = ?",
      [req.params.id]
    );

    if (!project.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ตรวจสอบว่ามี Sprint ที่เกี่ยวข้องหรือไม่
    const [sprints] = await db.query(
      "SELECT COUNT(*) as count FROM sprints WHERE project_id = ?",
      [req.params.id]
    );

    if (sprints[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete project with existing sprints",
        sprint_count: sprints[0].count,
      });
    }

    // ลบรูปภาพ (ถ้ามี)
    if (project[0].photo) {
      await fs
        .unlink(path.join("uploads/projects/", project[0].photo))
        .catch(() => {});
    }

    await db.query("DELETE FROM projects WHERE project_id = ?", [
      req.params.id,
    ]);

    // บันทึก action log
    await db.query(
      "INSERT INTO action_logs (user_id, action_type, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)",
      [
        req.user.user_id,
        "delete",
        "projects",
        req.params.id,
        JSON.stringify(project[0]),
      ]
    );

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ดึงสถิติของ Project
const getProjectStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `
      SELECT 
        p.project_id,
        p.name,
        COUNT(DISTINCT s.sprint_id) as total_sprints,
        COUNT(DISTINCT tf.file_id) as total_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) as passed_tests,
        COUNT(DISTINCT CASE WHEN tf.status = 'Fail' THEN tf.file_id END) as failed_tests,
        ROUND(COUNT(DISTINCT CASE WHEN tf.status = 'Pass' THEN tf.file_id END) * 100.0 / 
          NULLIF(COUNT(DISTINCT tf.file_id), 0), 2) as pass_rate
      FROM projects p
      LEFT JOIN sprints s ON p.project_id = s.project_id
      LEFT JOIN test_files tf ON s.sprint_id = tf.sprint_id
      WHERE p.project_id = ?
      GROUP BY p.project_id
    `,
      [req.params.id]
    );

    if (!stats.length) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// สร้าง middleware function สำหรับตรวจสอบและสร้างโฟลเดอร์
const ensureUploadDirExists = async () => {
  const uploadDir = "uploads/projects";
  try {
    await fs.access(uploadDir);
  } catch (error) {
    // ถ้าโฟลเดอร์ไม่มีอยู่ ให้สร้างใหม่
    await fs.mkdir(uploadDir, { recursive: true });
  }
};

// เรียกใช้งานฟังก์ชันเมื่อเริ่มต้น server
ensureUploadDirExists().catch(console.error);

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectStats,
  upload, // export upload middleware
};
