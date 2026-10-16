import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, TrendingUp, TrendingDown, Wallet, Target, PiggyBank } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function PersonalReports() {
  const [data, setData] = useState({
    transactions: [],
    incomes: [],
    expenses: [],
    goals: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [txnRes, incRes, expRes, goalRes] = await Promise.allSettled([
        fetch(`${API}/transactions?module=personal`, { headers: headers() }),
        fetch(`${API}/incomes?workspace=personal`, { headers: headers() }),
        fetch(`${API}/expenses?module=personal`, { headers: headers() }),
        fetch(`${API}/savings-goals?workspace=personal`, { headers: headers() }),
      ]);

      const txns = txnRes.status === "fulfilled" && txnRes.value.ok ? (await txnRes.value.json()).transactions || [] : [];
      const incomes = incRes.status === "fulfilled" && incRes.value.ok ? await incRes.value.json() : [];
      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];
      const goals = goalRes.status === "fulfilled" && goalRes.value.ok ? await goalRes.value.json() : [];

      setData({
        transactions: Array.isArray(txns) ? txns : [],
        incomes: Array.isArray(incomes) ? incomes : [],
        expenses: Array.isArray(expenses) ? expenses : [],
        goals: Array.isArray(goals) ? goals : [],
      });
    } catch (err) {
      console.error("Personal reports load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = data.incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpense = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const exportCSV = () => {
    const rows = [
      ["Type", "Title", "Category", "Amount", "Date"],
      ...data.incomes.map((i) => ["Income", `"${i.title}"`, i.source || "Salary", i.amount, new Date(i.date).toLocaleDateString()]),
      ...data.expenses.map((e) => ["Expense", `"${e.title}"`, e.category, e.amount, new Date(e.date).toLocaleDateString()]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finflow_personal_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Personal Financial Reports</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Comprehensive review of your personal cash flow and savings</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Earnings</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Expenses</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">-{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Net Savings</p>
          <p className={`text-2xl font-extrabold mt-1 ${netSavings >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(netSavings)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Savings Rate</p>
          <p className="text-2xl font-extrabold text-[#005B4F] mt-1">{savingsRate}%</p>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937]">Cash Flow Activity</h2>
          <span className="text-xs text-[#6B7280]">{data.incomes.length + data.expenses.length} Records</span>
        </div>
        <div className="divide-y divide-[#F4F6F8]">
          {data.incomes.map((inc) => (
            <div key={inc._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{inc.title}</p>
                <p className="text-xs text-[#9CA3AF]">{inc.source || "Income"} · {new Date(inc.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">+{formatCurrency(inc.amount)}</p>
            </div>
          ))}
          {data.expenses.map((exp) => (
            <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{exp.title}</p>
                <p className="text-xs text-[#9CA3AF]">{exp.category} · {new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-rose-600">-{formatCurrency(exp.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
