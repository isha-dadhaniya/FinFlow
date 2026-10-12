import React from "react";
import { Search, X } from "lucide-react";

export default function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-[360px]">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-8 bg-white border border-[#D9DEE3] rounded-[12px] text-sm text-[#1F2937] outline-none transition-all focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/15 placeholder:text-[#9CA3AF]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#1F2937]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
