import React, { useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import MobileSidebar from "./MobileSidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans antialiased text-[#1F2937]">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* Top Navbar */}
      <TopNavbar
        isCollapsed={isCollapsed}
        onOpenMobileMenu={() => setIsMobileOpen(true)}
      />

      {/* Main Content Workspace Area */}
      <main
        className={`pt-[100px] pb-10 px-4 sm:px-6 md:px-8 lg:px-10 transition-all duration-300 min-h-screen ${
          isCollapsed ? "md:ml-[80px]" : "md:ml-[260px]"
        }`}
      >
        <div className="w-full max-w-[1640px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
