import React from "react";
import Sidebar from "./Sidebar";
import { X } from "lucide-react";

export default function MobileSidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-[fadeIn_0.2s_ease-out]">
      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-[260px] h-full bg-[#1E232A] z-10 shadow-2xl animate-[slideInLeft_0.25s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-5 right-4 z-50 p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-4 h-4" />
        </button>
        <Sidebar isCollapsed={false} onToggleCollapse={() => {}} onItemClick={onClose} />
      </div>
    </div>
  );
}
