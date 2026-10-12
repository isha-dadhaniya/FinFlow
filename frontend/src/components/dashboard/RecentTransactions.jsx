import React from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../../utils/formatCurrency";

export default function RecentTransactions({ transactions = [] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[#1F2937]">Recent Transactions</h3>
        <button
          onClick={() => navigate("/app/transactions")}
          className="text-xs font-bold text-[#005B4F] hover:underline cursor-pointer"
        >
          View All
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="text-xs text-gray-500 py-6 text-center">No transactions recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 5).map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between p-3 rounded-[14px] hover:bg-[#F4F6F8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}
                >
                  {item.type === "income" ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#1F2937] truncate max-w-[180px]">
                    {item.title}
                  </p>
                  <span className="text-[11px] text-[#6B7280]">
                    {item.category} • {new Date(item.date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <span
                className={`text-xs sm:text-sm font-extrabold ${
                  item.type === "income" ? "text-emerald-600" : "text-[#1F2937]"
                }`}
              >
                {item.type === "income" ? "+" : "-"}{formatINR(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
