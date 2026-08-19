import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-[#005B4F] shrink-0" />,
  };

  const bgStyles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-red-50 border-red-200 text-red-900",
    info: "bg-teal-50 border-teal-200 text-teal-900",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideInLeft_0.3s_ease-out]">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-[16px] border shadow-xl ${bgStyles[type]}`}>
        {icons[type]}
        <span className="text-sm font-semibold pr-2">{message}</span>
        <button onClick={onClose} className="p-1 hover:opacity-75 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
