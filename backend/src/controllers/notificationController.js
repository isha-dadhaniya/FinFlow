const Notification = require("../models/Notification");

const getUserId = (req) => {
  return req.user?.id || req.user?._id;
};

const seedDefaultsIfEmpty = async (userId) => {
  if (!userId) return;
  const count = await Notification.countDocuments({ userId });
  if (count === 0) {
    const defaults = [
      {
        userId,
        title: "Welcome to FinFlow Workspace",
        message: "All your personal, family, business, and group finances are now unified under one workspace.",
        type: "system",
        read: false,
        link: "/app/dashboard",
      },
      {
        userId,
        title: "Monthly Budget Status",
        message: "You have used 43.6% of your set monthly budget limit.",
        type: "budget_alert",
        read: false,
        link: "/app/personal/monthly-budget",
      },
      {
        userId,
        title: "Invoice Due Reminder",
        message: "Invoice #INV-2026-004 is due in 3 days.",
        type: "invoice_due",
        read: false,
        link: "/app/business/invoice-management",
      },
    ];
    await Notification.insertMany(defaults);
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    await seedDefaultsIfEmpty(userId);
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    await seedDefaultsIfEmpty(userId);
    const all = await Notification.find({ userId }).sort({ createdAt: -1 });

    // Unread at top, then newest created
    const sorted = [...all].sort((a, b) => {
      const aUnread = !(a.read || a.isRead);
      const bUnread = !(b.read || b.isRead);
      if (aUnread && !bUnread) return -1;
      if (!aUnread && bUnread) return 1;
      return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
    });

    res.status(200).json(sorted.slice(0, 5));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = getUserId(req);
    await seedDefaultsIfEmpty(userId);
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });
    res.status(200).json({ unreadCount, count: unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (req.params.id === "all") {
      await Notification.updateMany({ userId }, { read: true });
      return res.status(200).json({ message: "All notifications marked as read" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    await Notification.deleteMany({ userId });
    res.status(200).json({ message: "Notifications cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getLatestNotifications,
  getUnreadCount,
  markAsRead,
  clearNotifications,
};
