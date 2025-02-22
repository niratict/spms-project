const express = require("express");
const router = express.Router();
const path = require("path");
const testFileController = require("../controllers/testFileController");
const { auth } = require("../middleware/auth");
const multer = require("multer");

// Apply authentication middleware to all routes
router.use(auth);

// Configure multer storage for file updates
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/test-files");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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

// Stats route should come before /:id to avoid conflict
router.get("/stats", testFileController.getTestFileStats);

// File content route
router.get("/content/:id", testFileController.getJsonContent);

// File upload routes
router.post("/upload", testFileController.uploadJsonTestFile);
router.put(
  "/:id/upload",
  upload.single("testFile"),
  testFileController.updateTestFile
);
router.post("/upload/:id", testFileController.uploadJsonTestFile); // Add this new route for updates

// CRUD routes
router.post("/", testFileController.createTestFile);
router.get("/", testFileController.getAllTestFiles);
router.get("/:id", testFileController.getTestFileById);
router.put("/:id", testFileController.updateTestFile);
router.delete("/:id", testFileController.deleteTestFile);

module.exports = router;
