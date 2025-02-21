const db = require("../config/db");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/test-files");
  },
  filename: (req, file, cb) => {
    // Use original filename instead of generating unique name
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/json") {
      cb(null, true);
    } else {
      cb(new Error("Only JSON files are allowed"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const uploadJsonTestFile = async (req, res) => {
  try {
    upload.single("testFile")(req, res, async (err) => {
      if (err) {
        console.error("Upload error:", err);
        return res.status(400).json({
          message:
            err instanceof multer.MulterError
              ? "File upload error: " + err.message
              : err.message,
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { sprint_id, filename } = req.body;
      if (!sprint_id) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ message: "Sprint ID is required" });
      }

      try {
        const fileContent = await fs.readFile(req.file.path, "utf8");
        const jsonContent = JSON.parse(fileContent);

        // Check if file exists in any sprint
        const [existingFiles] = await db.query(
          `SELECT tf.file_id, tf.sprint_id, s.name as sprint_name 
           FROM test_files tf
           JOIN sprints s ON tf.sprint_id = s.sprint_id
           WHERE tf.original_filename = ? AND tf.status != 'Deleted'`,
          [req.file.originalname]
        );

        if (existingFiles.length > 0) {
          const existingFile = existingFiles[0];
          await fs.unlink(req.file.path);

          // Return appropriate response based on whether it's same sprint or different sprint
          return res.status(409).json({
            message:
              existingFile.sprint_id === parseInt(sprint_id)
                ? "File already exists in this sprint"
                : "File already exists in another sprint",
            existingFileDetails: {
              file_id: existingFile.file_id,
              sprint_id: existingFile.sprint_id,
              sprint_name: existingFile.sprint_name,
            },
            requiresConfirmation: true,
            isSameSprint: existingFile.sprint_id === parseInt(sprint_id),
          });
        }

        // If no existing file, proceed with insert
        const [result] = await db.query(
          `INSERT INTO test_files 
           (filename, original_filename, file_size, upload_date, 
            last_modified_by, sprint_id, json_content, status) 
           VALUES (?, ?, ?, NOW(), ?, ?, ?, 'Pending')`,
          [
            filename || req.file.originalname,
            req.file.originalname,
            req.file.size,
            req.user.name,
            sprint_id,
            JSON.stringify(jsonContent),
          ]
        );

        await db.query(
          `INSERT INTO test_file_history 
           (file_id, action_type, action_by, details) 
           VALUES (?, 'upload', ?, ?)`,
          [
            result.insertId,
            req.user.name,
            JSON.stringify({
              upload_date: new Date(),
              file_size: req.file.size,
              original_filename: req.file.originalname,
              custom_filename: filename,
            }),
          ]
        );

        await db.query(
          `INSERT INTO action_logs 
           (user_id, action_type, target_table, target_id, details) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            req.user.user_id,
            "upload",
            "test_files",
            result.insertId,
            JSON.stringify(req.file),
          ]
        );

        res.status(201).json({
          message: "Test file uploaded successfully",
          file_id: result.insertId,
          filename: filename || req.file.originalname,
        });
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        await fs.unlink(req.file.path);
        return res.status(400).json({
          message: "Invalid JSON file: " + parseError.message,
        });
      }
    });
  } catch (error) {
    console.error("General error in uploadJsonTestFile:", error);
    res.status(500).json({ error: error.message });
  }
};

const getJsonContent = async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log("Fetching JSON content for file:", fileId);

    const [files] = await db.query(
      `SELECT json_content, filename, status 
       FROM test_files 
       WHERE file_id = ? AND status != 'Deleted'`,
      [fileId]
    );

    if (!files.length) {
      return res.status(404).json({ message: "Test file not found" });
    }

    const file = files[0];
    const jsonContent =
      typeof file.json_content === "string"
        ? JSON.parse(file.json_content)
        : file.json_content;

    res.json({
      filename: file.filename,
      status: file.status,
      content: jsonContent,
    });
  } catch (error) {
    console.error("Error in getJsonContent:", error);
    res.status(500).json({ error: error.message });
  }
};

const createTestFile = async (req, res) => {
  try {
    const { filename, original_filename, file_size, sprint_id, json_content } =
      req.body;

    console.log("Creating test file for sprint:", sprint_id);

    const [sprint] = await db.query(
      "SELECT * FROM sprints WHERE sprint_id = ?",
      [sprint_id]
    );

    if (!sprint.length) {
      return res.status(404).json({ message: "Sprint not found" });
    }

    const [result] = await db.query(
      `INSERT INTO test_files 
       (filename, original_filename, file_size, upload_date, 
        last_modified_by, sprint_id, json_content, status) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, 'Pending')`,
      [
        filename,
        original_filename,
        file_size,
        req.user.name,
        sprint_id,
        JSON.stringify(json_content),
      ]
    );

    await db.query(
      `INSERT INTO test_file_history 
       (file_id, action_type, action_by, details) 
       VALUES (?, 'create', ?, ?)`,
      [
        result.insertId,
        req.user.name,
        JSON.stringify({
          create_date: new Date(),
          file_size: file_size,
          original_filename: original_filename,
          custom_filename: filename,
        }),
      ]
    );

    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "create",
        "test_files",
        result.insertId,
        JSON.stringify(req.body),
      ]
    );

    res.status(201).json({
      message: "Test file created successfully",
      file_id: result.insertId,
    });
  } catch (error) {
    console.error("Error in createTestFile:", error);
    res.status(500).json({ error: error.message });
  }
};

const getAllTestFiles = async (req, res) => {
  try {
    const { sprint_id, filename, status, project_id } = req.query;
    console.log("Fetching files with filters:", {
      sprint_id,
      filename,
      status,
      project_id,
    });

    let query = `
      SELECT tf.*, 
        s.name as sprint_name,
        p.name as project_name
      FROM test_files tf
      LEFT JOIN sprints s ON tf.sprint_id = s.sprint_id
      LEFT JOIN projects p ON s.project_id = p.project_id
      WHERE tf.status != 'Deleted'
    `;

    const queryParams = [];

    if (sprint_id) {
      query += " AND tf.sprint_id = ?";
      queryParams.push(sprint_id);
    }

    if (project_id) {
      query += " AND p.project_id = ?";
      queryParams.push(project_id);
    }

    if (filename) {
      query += " AND (tf.filename LIKE ? OR tf.original_filename LIKE ?)";
      queryParams.push(`%${filename}%`, `%${filename}%`);
    }

    if (status) {
      query += " AND tf.status = ?";
      queryParams.push(status);
    }

    query += " ORDER BY tf.upload_date DESC";

    const [files] = await db.query(query, queryParams);
    res.json(files);
  } catch (error) {
    console.error("Error in getAllTestFiles:", error);
    res.status(500).json({ error: error.message });
  }
};

const getTestFileById = async (req, res) => {
  try {
    console.log("Fetching file details for ID:", req.params.id);

    const [fileResults] = await db.query(
      `
      SELECT tf.*, 
        s.name as sprint_name,
        p.name as project_name,
        tf.json_content
      FROM test_files tf
      LEFT JOIN sprints s ON tf.sprint_id = s.sprint_id
      LEFT JOIN projects p ON s.project_id = p.project_id
      WHERE tf.file_id = ? AND tf.status != 'Deleted'
    `,
      [req.params.id]
    );

    if (!fileResults.length) {
      return res.status(404).json({ message: "Test file not found" });
    }

    const [historyResults] = await db.query(
      "SELECT * FROM test_file_history WHERE file_id = ? ORDER BY action_date DESC",
      [req.params.id]
    );

    const fileData = {
      ...fileResults[0],
      history: historyResults,
      json_content:
        typeof fileResults[0].json_content === "string"
          ? JSON.parse(fileResults[0].json_content)
          : fileResults[0].json_content,
    };

    console.log("Successfully retrieved file details");
    res.json(fileData);
  } catch (error) {
    console.error("Error in getTestFileById:", error);
    res.status(500).json({
      error: error.message,
      details: "Error retrieving test file details",
    });
  }
};

const updateTestFile = async (req, res) => {
  try {
    const { status, filename, json_content } = req.body;
    const fileId = req.params.id;
    const newFile = req.file;

    console.log("Updating file:", fileId);

    // ตรวจสอบว่ามีไฟล์อยู่ในฐานข้อมูล
    const [currentFile] = await db.query(
      'SELECT * FROM test_files WHERE file_id = ? AND status != "Deleted"',
      [fileId]
    );

    if (!currentFile.length) {
      return res.status(404).json({ message: "Test file not found" });
    }

    const currentFileData = currentFile[0];

    // กำหนดค่าเริ่มต้นให้กับ updateData
    let updateData = {
      status: status || currentFileData.status,
      filename: filename || currentFileData.filename,
      last_modified_date: new Date(),
      last_modified_by: req.user.name,
    };

    if (newFile) {
      // ใช้ชื่อไฟล์ต้นฉบับเดิม
      const newFilePath = path.join("uploads/test-files", newFile.originalname);

      // ลบไฟล์เก่า (ถ้ามี)
      if (currentFileData.original_filename) {
        const oldFilePath = path.join(
          "uploads/test-files",
          currentFileData.original_filename
        );
        try {
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.error("Error deleting old file:", err);
        }
      }

      // ย้ายไฟล์ใหม่ไปยังตำแหน่งปลายทาง
      await fs.rename(newFile.path, newFilePath);

      // อัปเดตข้อมูลไฟล์ใน updateData
      updateData.original_filename = newFile.originalname;
      updateData.file_size = newFile.size;
      updateData.filename = filename || newFile.originalname;

      // อ่านเนื้อหาไฟล์ใหม่
      const fileContent = await fs.readFile(newFilePath, "utf8");
      updateData.json_content = fileContent;
    } else if (json_content) {
      updateData.json_content = JSON.stringify(json_content);
    }

    // อัปเดตฐานข้อมูล
    const updateQuery = `
      UPDATE test_files 
      SET ${Object.keys(updateData)
        .map((key) => `${key} = ?`)
        .join(", ")}
      WHERE file_id = ?
    `;
    await db.query(updateQuery, [...Object.values(updateData), fileId]);

    // บันทึกประวัติการแก้ไข
    await db.query(
      `INSERT INTO test_file_history 
       (file_id, action_type, action_by, details) 
       VALUES (?, 'modify', ?, ?)`,
      [
        fileId,
        req.user.name,
        JSON.stringify({
          modified_date: new Date(),
          changes: updateData,
        }),
      ]
    );

    // บันทึก action logs
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "update",
        "test_files",
        fileId,
        JSON.stringify(updateData),
      ]
    );

    res.json({
      message: "Test file updated successfully",
      filename: updateData.filename,
    });
  } catch (error) {
    console.error("Error in updateTestFile:", error);
    res.status(500).json({ error: error.message });
  }
};

const deleteTestFile = async (req, res) => {
  try {
    const fileId = req.params.id;
    console.log("Deleting file:", fileId);

    // Query file details
    const [file] = await db.query(
      'SELECT * FROM test_files WHERE file_id = ? AND status != "Deleted"',
      [fileId]
    );

    if (!file.length) {
      return res.status(404).json({ message: "Test file not found" });
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "test-files",
      file[0].original_filename
    );

    // ตรวจสอบและลบไฟล์
    try {
      await fs.access(filePath); // เช็คว่าไฟล์มีอยู่จริง
      await fs.unlink(filePath); // ลบไฟล์
      console.log(`File ${filePath} deleted successfully`);
    } catch (fileError) {
      console.error("Error deleting file:", fileError.message);

      if (fileError.code === "ENOENT") {
        console.error("File does not exist:", filePath);
      } else if (fileError.code === "EACCES") {
        console.error("Permission denied for file:", filePath);
      } else {
        throw fileError; // โยน error อื่น ๆ ออกไป
      }
    }

    // อัปเดตสถานะในฐานข้อมูล
    await db.query(
      `UPDATE test_files 
       SET status = 'Deleted', 
           last_modified_date = NOW(), 
           last_modified_by = ?
       WHERE file_id = ?`,
      [req.user.name, fileId]
    );

    // เพิ่มประวัติการลบไฟล์
    await db.query(
      `INSERT INTO test_file_history 
       (file_id, action_type, action_by, details) 
       VALUES (?, 'delete', ?, ?)`,
      [
        fileId,
        req.user.name,
        JSON.stringify({
          deleted_date: new Date(),
          file_info: file[0],
        }),
      ]
    );

    // เพิ่ม log การกระทำ
    await db.query(
      `INSERT INTO action_logs 
       (user_id, action_type, target_table, target_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.user_id,
        "delete",
        "test_files",
        fileId,
        JSON.stringify(file[0]),
      ]
    );

    res.json({ message: "Test file deleted successfully" });
  } catch (error) {
    console.error("Error in deleteTestFile:", error.message);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the file" });
  }
};

const getTestFileStats = async (req, res) => {
  try {
    const { sprint_id, project_id } = req.query;
    console.log(
      "Fetching stats for sprint:",
      sprint_id,
      "project:",
      project_id
    );

    // ในฟังก์ชัน getTestFileStats แก้ไขส่วน SQL query
    let query = `
  SELECT 
    COUNT(*) as total_files,
    COUNT(CASE WHEN tf.status = 'Pass' THEN 1 END) as passed_files,
    COUNT(CASE WHEN tf.status = 'Fail' THEN 1 END) as failed_files,
    COUNT(CASE WHEN tf.status = 'Pending' THEN 1 END) as pending_files,
    ROUND(COUNT(CASE WHEN tf.status = 'Pass' THEN 1 END) * 100.0 / 
      NULLIF(COUNT(CASE WHEN tf.status != 'Deleted' THEN 1 END), 0), 2) as pass_rate,
    AVG(tf.file_size) as avg_file_size,
    MAX(tf.file_size) as max_file_size,
    MIN(tf.upload_date) as first_upload,
    MAX(tf.upload_date) as last_upload,
    COUNT(DISTINCT tf.sprint_id) as total_sprints
  FROM test_files tf
  LEFT JOIN sprints s ON tf.sprint_id = s.sprint_id
  WHERE tf.status != 'Deleted'
`;

    const queryParams = [];
    if (sprint_id) {
      query += " AND tf.sprint_id = ?";
      queryParams.push(sprint_id);
    }
    if (project_id) {
      query += " AND s.project_id = ?";
      queryParams.push(project_id);
    }

    const [stats] = await db.query(query, queryParams);

    // Get additional statistics
    const [timeStats] = await db.query(
      `
      SELECT 
        AVG(TIMESTAMPDIFF(DAY, upload_date, IFNULL(last_modified_date, NOW()))) as avg_resolution_time
      FROM test_files
      WHERE status != 'Deleted'
      ${sprint_id ? "AND sprint_id = ?" : ""}
      ${
        project_id
          ? "AND sprint_id IN (SELECT sprint_id FROM sprints WHERE project_id = ?)"
          : ""
      }
    `,
      queryParams
    );

    const response = {
      ...stats[0],
      avg_resolution_time: timeStats[0].avg_resolution_time
        ? Math.round(timeStats[0].avg_resolution_time * 10) / 10
        : 0,
      avg_file_size: stats[0].avg_file_size
        ? Math.round(stats[0].avg_file_size)
        : 0,
    };

    console.log("Stats retrieved successfully");
    res.json(response);
  } catch (error) {
    console.error("Error in getTestFileStats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Export all functions
module.exports = {
  createTestFile,
  getAllTestFiles,
  getTestFileById,
  updateTestFile,
  deleteTestFile,
  getTestFileStats,
  uploadJsonTestFile,
  getJsonContent,
};
