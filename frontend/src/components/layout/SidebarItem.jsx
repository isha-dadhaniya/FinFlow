import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function SidebarItem({ item, isCollapsed, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;

  return (
    <div className="relative group">
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-[14px] text-sm font-medium transition-all duration-200 select-none ${
          isActive
            ? "bg-[#005B4F] text-white shadow-lg shadow-[#005B4F]/30 font-semibold scale-[1.01]"
            : "text-[#9CA3AF] hover:bg-white/10 hover:text-white"
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isActive ? "text-white" : "text-[#9CA3AF] group-hover:text-white group-hover:scale-110"
          }`}
        />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </Link>

      {/* Tooltip in collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
          <div className="bg-[#1F2937] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border border-gray-700 whitespace-nowrap">
            {item.label}
          </div>
        </div>
      )}
    </div>
  );
}
