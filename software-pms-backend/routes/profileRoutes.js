// profileRoutes.js
const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profilecontroller");
const { auth } = require("../middleware/auth");

router.use(auth);

// All profile routes should be protected with auth middleware
router.get("/", profileController.getProfile);
router.put("/update", profileController.updateProfile);
router.put("/update-image", profileController.updateProfileImage);
router.delete("/delete-image", profileController.deleteProfileImage);
router.put("/change-password", profileController.changePassword);

module.exports = router;
