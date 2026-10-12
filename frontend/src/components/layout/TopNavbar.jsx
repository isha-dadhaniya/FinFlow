import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Search,
  User,
  Users,
  Briefcase,
  Settings,
  LogOut,
  ChevronDown,
  Check,
  AlertCircle,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { fetchNotifications, markNotificationRead } from "../../api/services";
import { useWorkspace } from "../../context/WorkspaceContext";

const WORKSPACE_ICONS = {
  personal: {
    icon: User,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-100",
  },
  family: {
    icon: Users,
    bgColor: "bg-purple-50",
    textColor: "text-purple-600",
    borderColor: "border-purple-100",
  },
  business: {
    icon: Briefcase,
    bgColor: "bg-emerald-50",
    textColor: "text-[#005B4F]",
    borderColor: "border-emerald-100",
  },
};

function WorkspaceIconBadge({ modeId, size = "w-6 h-6", iconSize = "w-3.5 h-3.5" }) {
  const conf = WORKSPACE_ICONS[modeId] || WORKSPACE_ICONS.personal;
  const Icon = conf.icon;

  let customLogo = null;
  try {
    const raw = localStorage.getItem("finflow_workspaces_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.[modeId]?.logo || parsed?.[modeId]?.businessLogo) {
        customLogo = parsed[modeId].logo || parsed[modeId].businessLogo;
      }
    }
  } catch {
    // ignore
  }

  if (customLogo) {
    return (
      <div className={`${size} rounded-full overflow-hidden border border-gray-200 shrink-0 bg-white`}>
        <img src={customLogo} alt={modeId} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full ${conf.bgColor} ${conf.textColor} ${conf.borderColor} border flex items-center justify-center shrink-0`}>
      <Icon className={iconSize} strokeWidth={2} />
    </div>
  );
}

export default function TopNavbar({ onOpenMobileMenu, isCollapsed }) {
  const navigate = useNavigate();
  const { activeMode, activeModeConfig, availableModes, showSwitcher, switchMode } = useWorkspace();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadNotifications();
  }, []);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setUserDropdownOpen(false);
      setNotifDropdownOpen(false);
      setWorkspaceSwitcherOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await fetchNotifications();
      setNotifications(res.data || []);
      setUnreadCount((res.data || []).filter((n) => !n.read).length);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationRead("all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("finflow_active_mode");
    navigate("/Login");
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-[80px] bg-white border-b border-[#D9DEE3]/70 px-4 sm:px-6 flex items-center justify-between transition-all duration-300 ${
        isCollapsed ? "left-[80px]" : "left-0 md:left-[260px]"
      }`}
    >
      {/* Left Section: Mobile Menu Toggle, Header Workspace Switcher & Global Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl border border-[#D9DEE3] text-[#1F2937] hover:bg-gray-50"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Header Workspace Profile Switcher Pill (Desktop & Mobile) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          {showSwitcher ? (
            <button
              onClick={() => {
                setWorkspaceSwitcherOpen((prev) => !prev);
                setNotifDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F6F8] hover:bg-gray-100 border border-[#E5E7EB] text-xs sm:text-sm font-bold text-[#1F2937] transition-all cursor-pointer shadow-xs"
            >
              <WorkspaceIconBadge modeId={activeMode} size="w-6 h-6" iconSize="w-3.5 h-3.5" />
              <span>{activeModeConfig.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${workspaceSwitcherOpen ? "rotate-180" : ""}`} />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F4F6F8] border border-[#E5E7EB] text-xs sm:text-sm font-bold text-[#1F2937]">
              <WorkspaceIconBadge modeId={activeMode} size="w-6 h-6" iconSize="w-3.5 h-3.5" />
              <span>{activeModeConfig.label}</span>
            </div>
          )}

          {/* Switcher Dropdown */}
          {workspaceSwitcherOpen && showSwitcher && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-[#D9DEE3] p-1.5 z-50 animate-[scaleIn_0.15s_ease-out]">
              <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Switch Profile</p>
              </div>
              {availableModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    switchMode(mode.id);
                    setWorkspaceSwitcherOpen(false);
                    navigate(`/app/${mode.id}/dashboard`);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                    mode.isActive ? "bg-[#005B4F]/10 text-[#005B4F]" : "hover:bg-gray-50 text-[#1F2937]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <WorkspaceIconBadge modeId={mode.id} size="w-7 h-7" iconSize="w-4 h-4" />
                    <span className="text-xs font-bold">{mode.label}</span>
                  </div>
                  {mode.isActive && <Check className="w-4 h-4 text-[#005B4F]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden sm:flex items-center w-[200px] md:w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search transactions, invoices..."
            className="w-full h-10 pl-10 pr-4 bg-[#F4F6F8] border border-transparent rounded-[12px] text-xs sm:text-sm text-[#1F2937] outline-none focus:bg-white focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 transition-all placeholder:text-[#9CA3AF]"
          />
        </div>
      </div>

      {/* Right Section: Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setNotifDropdownOpen((prev) => !prev);
              setUserDropdownOpen(false);
              setWorkspaceSwitcherOpen(false);
            }}
            className="relative p-2.5 rounded-xl border border-[#D9DEE3] text-[#1F2937] hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#005B4F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[20px] shadow-2xl border border-[#D9DEE3] p-4 z-50 animate-[scaleIn_0.15s_ease-out]">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#1F2937]">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#005B4F]/10 text-[#005B4F]">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[#005B4F] font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto mt-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 rounded-xl transition-colors cursor-pointer ${
                        !n.read ? "bg-emerald-50/30" : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        markNotificationRead(n._id);
                        if (n.link) navigate(n.link);
                        setNotifDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            !n.read ? "text-[#005B4F]" : "text-gray-400"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#1F2937] leading-tight">{n.title}</p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-[#9CA3AF] mt-1">
                            {new Date(n.date || n.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 text-center">
                <Link
                  to="/app/notifications"
                  onClick={() => setNotifDropdownOpen(false)}
                  className="text-xs font-bold text-[#005B4F] hover:underline"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setUserDropdownOpen((prev) => !prev);
              setNotifDropdownOpen(false);
              setWorkspaceSwitcherOpen(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-[#D9DEE3] hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#005B4F] text-white font-bold text-xs flex items-center justify-center uppercase">
              {user.fullName ? user.fullName.charAt(0) : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-[#1F2937] leading-tight line-clamp-1">
                {user.fullName || "User Account"}
              </p>
              <p className="text-[10px] text-[#6B7280] capitalize">
                {activeModeConfig.label} Profile
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* User Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-[20px] shadow-2xl border border-[#D9DEE3] p-2 z-50 animate-[scaleIn_0.15s_ease-out]">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-bold text-[#1F2937]">{user.fullName || "User"}</p>
                <p className="text-[10px] text-gray-500 truncate">{user.email || ""}</p>
              </div>

              <div className="space-y-0.5">
                <Link
                  to="/app/profile"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-500" /> My Profile
                </Link>
                <Link
                  to="/app/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-500" /> Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
