import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, change, isPositive, icon: Icon, color = "jade", badgeText }) {
  const colorMap = {
    jade: "bg-[#005B4F]/10 text-[#005B4F]",
    graphite: "bg-[#2B3138]/10 text-[#2B3138]",
    gold: "bg-[#D4AF37]/15 text-[#B89428]",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-semibold text-[#6B7280]">{title}</span>
        {Icon && (
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${colorMap[color] || colorMap.jade}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">{value}</h3>
        {badgeText && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {badgeText}
          </span>
        )}
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold">
          {isPositive ? (
            <span className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              +{change}%
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" />
              -{change}%
            </span>
          )}
          <span className="text-[#9CA3AF] font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}
