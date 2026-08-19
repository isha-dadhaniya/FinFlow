import React from "react";
import { getMenuForMode } from "../../config/sidebarMenu";
import { useWorkspace } from "../../context/WorkspaceContext";
import SidebarSection from "./SidebarSection";
import finflowLogo from "../../assets/finflow-logo.png";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Sidebar({ isCollapsed, onToggleCollapse, onItemClick }) {
  const navigate = useNavigate();
  const { activeMode } = useWorkspace();

  const menuConfig = getMenuForMode(activeMode);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("finflow_active_mode");
    navigate("/Login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Mode-specific accent colors for the sidebar
  const modeAccents = {
    personal: { bg: "bg-[#005B4F]", ring: "ring-[#005B4F]/40", gradient: "from-[#005B4F] to-[#008573]" },
    family: { bg: "bg-[#2A9D8F]", ring: "ring-[#2A9D8F]/40", gradient: "from-[#2A9D8F] to-[#21867A]" },
    business: { bg: "bg-[#1E232A]", ring: "ring-[#1E232A]/40", gradient: "from-[#1E232A] to-[#2B3138]" },
  };

  const accent = modeAccents[activeMode] || modeAccents.personal;

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-[#1E232A] text-white border-r border-[#2B3138]/80 flex flex-col justify-between transition-all duration-300 ease-in-out select-none shadow-2xl ${
        isCollapsed ? "w-[80px]" : "w-[260px]"
      }`}
    >
      {/* Top Header Logo */}
      <div>
        <div className="h-[84px] px-4 flex items-center justify-start border-b border-white/10">
          {!isCollapsed ? (
            <div className="flex items-center justify-start w-full py-1">
              <img
                src={finflowLogo}
                alt="FinFlow"
                className="h-16 sm:h-20 max-h-20 w-auto max-w-[210px] object-contain brightness-0 invert scale-110 origin-left"
              />
            </div>
          ) : (
            <div className={`w-11 h-11 rounded-xl ${accent.bg} text-white flex items-center justify-center font-bold text-xl shadow-md mx-auto`}>
              FF
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items */}
        <div className="p-3 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar">
          {menuConfig.map((section, idx) => (
            <SidebarSection
              key={`${activeMode}-${idx}`}
              section={section}
              isCollapsed={isCollapsed}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>

      {/* User Footer / Logout */}
      <div className="p-3.5 border-t border-white/10 bg-[#15191E]">
        <div className="flex items-center justify-between gap-3">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-9 h-9 rounded-full ${accent.bg} text-white font-bold text-sm flex items-center justify-center shrink-0 ring-2 ${accent.ring}`}>
                {user.fullName ? user.fullName[0].toUpperCase() : "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user.fullName || "User"}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.email || ""}</p>
              </div>
            </div>
          ) : (
            <div
              className={`w-9 h-9 rounded-full ${accent.bg} text-white font-bold text-sm flex items-center justify-center mx-auto ring-2 ${accent.ring}`}
              title={user.fullName || "User"}
            >
              {user.fullName ? user.fullName[0].toUpperCase() : "U"}
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
