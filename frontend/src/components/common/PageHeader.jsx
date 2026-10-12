import React from "react";

export default function PageHeader({ title, subtitle, actionButton, badge }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#D9DEE3]/60">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">{title}</h1>
          {badge && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#005B4F]/10 text-[#005B4F]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>}
      </div>
      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
}
