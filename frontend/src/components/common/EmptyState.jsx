import React from "react";
import { FolderOpen } from "lucide-react";

export default function EmptyState({
  title = "No Data Found",
  description = "Get started by adding your first entry.",
  actionButton,
  icon: Icon = FolderOpen,
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#D9DEE3]/60 p-12 text-center flex flex-col items-center justify-center my-4">
      <div className="w-16 h-16 rounded-full bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-[#1F2937]">{title}</h3>
      <p className="text-sm text-[#6B7280] max-w-sm mt-1 mb-6">{description}</p>
      {actionButton}
    </div>
  );
}
