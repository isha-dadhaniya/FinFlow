const express = require("express");
const router = express.Router();
const {
  getNotifications,
  getLatestNotifications,
  getUnreadCount,
  markAsRead,
  clearNotifications,
} = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getNotifications);
router.get("/latest", getLatestNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.put("/:id/read", markAsRead);
router.delete("/clear", clearNotifications);

module.exports = router;
