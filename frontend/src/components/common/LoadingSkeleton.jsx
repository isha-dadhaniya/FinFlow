import React from "react";

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
      </div>
      <div className="w-36 h-8 bg-gray-200 rounded mb-2"></div>
      <div className="w-20 h-3 bg-gray-200 rounded"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 animate-pulse space-y-4">
      <div className="w-full h-10 bg-gray-200 rounded-lg"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-1/4 h-8 bg-gray-100 rounded"></div>
          <div className="w-1/4 h-8 bg-gray-100 rounded"></div>
          <div className="w-1/4 h-8 bg-gray-100 rounded"></div>
          <div className="w-1/4 h-8 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );
}
