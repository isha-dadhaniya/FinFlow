import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, PieChart, Calendar, DollarSign, Wallet } from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function Analytics() {
  const { activeMode } = useWorkspace();
  const [data, setData] = useState({
    expenses: [],
    incomes: [],
    txns: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [activeMode]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [expRes, incRes, txnRes] = await Promise.allSettled([
        fetch(`${API}/expenses?module=${activeMode}`, { headers: headers() }),
        fetch(`${API}/incomes?workspace=${activeMode}`, { headers: headers() }),
        fetch(`${API}/transactions?module=${activeMode}`, { headers: headers() }),
      ]);

      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];
      const incomes = incRes.status === "fulfilled" && incRes.value.ok ? await incRes.value.json() : [];
      const txnData = txnRes.status === "fulfilled" && txnRes.value.ok ? await txnRes.value.json() : {};
      const txns = txnData.transactions || txnData || [];

      setData({
        expenses: Array.isArray(expenses) ? expenses : [],
        incomes: Array.isArray(incomes) ? incomes : [],
        txns: Array.isArray(txns) ? txns : [],
      });
    } catch (err) {
      console.error("Analytics load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = data.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalIncome = data.incomes.reduce((s, i) => s + (i.amount || 0), 0);

  // Category map
  const catMap = {};
  data.expenses.forEach((e) => {
    catMap[e.category || "General"] = (catMap[e.category || "General"] || 0) + (e.amount || 0);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Financial Analytics</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Visual trends, spending velocity, and category allocations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Inflows</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Outflows</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">-{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Net Position</p>
          <p className={`text-2xl font-extrabold mt-1 ${totalIncome - totalExpense >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Expenditure by Category</h2>
        {Object.keys(catMap).length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">No expense activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(catMap).map(([cat, amount]) => {
              const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-[#1F2937]">
                    <span>{cat}</span>
                    <span>{formatCurrency(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4F6F8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#005B4F] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
