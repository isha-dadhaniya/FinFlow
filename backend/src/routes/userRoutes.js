const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteProfile,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.delete("/profile", deleteProfile);
router.put("/change-password", changePassword);

module.exports = router;
