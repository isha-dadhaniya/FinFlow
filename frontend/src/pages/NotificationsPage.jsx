import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Trash2,
  CheckCheck,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  clearNotifications,
} from "../api/services";

const getRelativeTime = (dateInput) => {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  return date.toLocaleDateString();
};

const getNotifIcon = (type) => {
  switch (type) {
    case "budget_alert":
      return <AlertCircle className="w-5 h-5 text-amber-600" />;
    case "invoice_due":
      return <FileText className="w-5 h-5 text-blue-600" />;
    case "payment_reminder":
      return <Clock className="w-5 h-5 text-purple-600" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-[#005B4F]" />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetchNotifications();
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      if (id === "all") {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !(n.read || n.isRead)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-[24px] border border-[#D9DEE3]/70 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Workspace system alerts, logs, and activity notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => handleMarkAsRead("all")}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#005B4F] bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-[24px] border border-[#D9DEE3]/70 shadow-sm overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm animate-pulse">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No notifications</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              You are all caught up! System logs, budget alerts, and updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = n.read || n.isRead;
            return (
              <div
                key={n._id}
                onClick={() => !isRead && handleMarkAsRead(n._id)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                  !isRead ? "bg-teal-50/30 hover:bg-teal-50/60" : "hover:bg-gray-50"
                } ${!isRead ? "cursor-pointer" : ""}`}
              >
                <div className="p-2.5 rounded-2xl bg-[#005B4F]/10 shrink-0 mt-0.5">
                  {getNotifIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {n.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {getRelativeTime(n.createdAt || n.date)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {!isRead && (
                  <span
                    className="w-2.5 h-2.5 rounded-full bg-[#005B4F] shrink-0 mt-2"
                    title="Unread"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
