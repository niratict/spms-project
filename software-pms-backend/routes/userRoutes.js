// userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { auth, authorizeRole } = require("../middleware/auth");

router.use(auth);

router.post("/", authorizeRole(["Admin"]), userController.createUser);
router.get("/", authorizeRole(["Admin"]), userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.put("/:id/password", userController.changePassword);
router.delete("/:id", authorizeRole(["Admin"]), userController.deleteUser);
router.get("/stats", authorizeRole(["Admin"]), userController.getUserStats);

module.exports = router;
