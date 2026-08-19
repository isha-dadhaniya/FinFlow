import React from "react";
import { Landmark, X, ArrowRight, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BankAccountRequiredModal({
  isOpen,
  onClose,
  workspace = "personal",
  featureName = "this operation",
}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getAccountsRoute = () => {
    if (workspace === "family") return "/app/family/accounts";
    if (workspace === "business") return "/app/business/accounts";
    return "/app/personal/accounts";
  };

  const getThemeColor = () => {
    if (workspace === "family") return "bg-[#2A9D8F] hover:bg-[#21867A]";
    if (workspace === "business") return "bg-[#1E232A] hover:bg-[#15191E]";
    return "bg-[#005B4F] hover:bg-[#004A40]";
  };

  const handleNavigate = () => {
    onClose();
    navigate(getAccountsRoute());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-md p-6 sm:p-7 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Landmark className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-extrabold text-[#1F2937] mb-1.5">
          Bank Account Required
        </h3>

        <p className="text-xs text-[#6B7280] leading-relaxed mb-6 max-w-xs mx-auto">
          You need to connect at least one active bank account before creating {featureName}, so balances, deposits, and auto-debits can be synchronized in real-time.
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleNavigate}
            className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition-colors shadow-lg flex items-center justify-center gap-1.5 ${getThemeColor()}`}
          >
            <span>Add Bank Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
