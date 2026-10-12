import React, { useEffect } from "react";
import { AlertTriangle, X, Info, CheckCircle2 } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete",
  cancelText = "Cancel",
  showCancel = true,
  isDanger = true,
  type,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentType = type || (isDanger ? "danger" : "info");

  const icons = {
    danger: <AlertTriangle className="w-6 h-6 text-red-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    info: <Info className="w-6 h-6 text-[#005B4F]" />,
    success: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
  };

  const iconBgs = {
    danger: "bg-red-50 text-red-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-[#005B4F]/10 text-[#005B4F]",
    success: "bg-emerald-50 text-emerald-600",
  };

  const buttonStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-600/20 text-white",
    warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-white",
    info: "bg-[#005B4F] hover:bg-[#004A40] shadow-[#005B4F]/20 text-white",
    success: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-[#D9DEE3] relative animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#1F2937] transition-colors p-1 cursor-pointer rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBgs[currentType] || iconBgs.info}`}>
            {icons[currentType] || icons.info}
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1F2937]">{title}</h3>
            <p className="text-sm text-[#6B7280] mt-0.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-[12px] border border-[#D9DEE3] text-sm font-semibold text-[#2B3138] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-[12px] text-sm font-semibold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
              buttonStyles[currentType] || buttonStyles.info
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AlertModal({
  isOpen,
  onClose,
  title = "Notice",
  message = "",
  confirmText = "OK",
  type = "info",
}) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title={title}
      message={message}
      confirmText={confirmText}
      showCancel={false}
      type={type}
    />
  );
}

