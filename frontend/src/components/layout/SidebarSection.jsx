import React from "react";
import SidebarItem from "./SidebarItem";

export default function SidebarSection({ section, isCollapsed, onItemClick }) {
  return (
    <div className="mb-5">
      {!isCollapsed && (
        <h4 className="px-3.5 mb-2 text-[10px] font-bold text-[#6B7280] uppercase tracking-wider select-none">
          {section.sectionTitle}
        </h4>
      )}
      <div className="space-y-1">
        {section.items.map((item) => (
          <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} onClick={onItemClick} />
        ))}
      </div>
    </div>
  );
}
