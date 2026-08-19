import React from "react";
import { PlusCircle, FileText, UserPlus, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function QuickActionCard() {
  const navigate = useNavigate();

  const actions = [
    { label: "Add Expense", path: "/app/personal/expense-tracker", icon: PlusCircle, color: "bg-[#005B4F] text-white" },
    { label: "Create Invoice", path: "/app/business/invoice-management", icon: FileText, color: "bg-[#2B3138] text-white" },
    { label: "Add Member", path: "/app/members", icon: UserPlus, color: "bg-[#D4AF37] text-white" },
    { label: "Set Budget", path: "/app/personal/monthly-budget", icon: Target, color: "bg-teal-700 text-white" },
  ];

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <h3 className="text-base font-bold text-[#1F2937] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((act, idx) => {
          const Icon = act.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(act.path)}
              className="flex items-center gap-3 p-3.5 rounded-[16px] bg-[#F4F6F8] hover:bg-[#005B4F]/10 hover:border-[#005B4F]/30 border border-transparent transition-all duration-200 group text-left cursor-pointer"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${act.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2B3138] group-hover:text-[#005B4F] transition-colors">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
