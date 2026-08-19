import React from "react";
import { Filter } from "lucide-react";

export default function FilterDropdown({ value, onChange, options = [], label = "All Categories" }) {
  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2 bg-white border border-[#D9DEE3] rounded-[12px] px-3 h-10 hover:border-[#9CA3AF] transition-all">
        <Filter className="w-4 h-4 text-[#6B7280]" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-sm font-medium text-[#1F2937] outline-none cursor-pointer pr-2"
        >
          <option value="">{label}</option>
          {options.map((opt) => (
            <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
              {typeof opt === "string" ? opt : opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
