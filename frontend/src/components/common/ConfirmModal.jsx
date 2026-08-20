import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed?", confirmText = "Delete", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-[#D9DEE3] relative animate-[scaleIn_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] transition-colors p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isDanger ? "bg-red-50 text-red-600" : "bg-[#005B4F]/10 text-[#005B4F]"}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">{title}</h3>
            <p className="text-sm text-[#6B7280] mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-[12px] border border-[#D9DEE3] text-sm font-semibold text-[#2B3138] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              isDanger ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-[#005B4F] hover:bg-[#004A40] shadow-[#005B4F]/20"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
