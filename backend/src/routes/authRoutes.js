const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  updateSelectedModes,
  updateAccountType,
  googleAuth,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.put("/selected-modes", authMiddleware, updateSelectedModes);
// Legacy endpoint kept for backward compatibility
router.put("/account-type", authMiddleware, updateAccountType);

module.exports = router;
