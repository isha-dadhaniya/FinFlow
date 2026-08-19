import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileSpreadsheet, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function ProfitLoss() {
  const [plData, setPlData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMargin: 0,
    revenueInvoices: [],
    expenseList: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPL();
  }, []);

  const loadPL = async () => {
    try {
      setLoading(true);
      const [invRes, expRes] = await Promise.allSettled([
        fetch(`${API}/business/invoices`, { headers: headers() }),
        fetch(`${API}/expenses?module=business`, { headers: headers() }),
      ]);

      const invoices = invRes.status === "fulfilled" && invRes.value.ok ? await invRes.value.json() : [];
      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];

      const paidInvoices = (Array.isArray(invoices) ? invoices : []).filter((i) => i.status === "Paid");
      const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
      const totalExpenses = (Array.isArray(expenses) ? expenses : []).reduce((sum, e) => sum + (e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

      setPlData({
        totalRevenue,
        totalExpenses,
        grossProfit: totalRevenue,
        netProfit,
        profitMargin,
        revenueInvoices: paidInvoices,
        expenseList: Array.isArray(expenses) ? expenses : [],
      });
    } catch (err) {
      console.error("P&L load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const isProfitable = plData.netProfit >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Profit & Loss Statement</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Real-time revenue, operational expenses, and net margin calculations</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(plData.totalRevenue)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{plData.revenueInvoices.length} Settled Invoices</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Operating Expenses</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(plData.totalExpenses)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{plData.expenseList.length} Expense Entries</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isProfitable ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {isProfitable ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          </div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Net Profit / Loss</p>
          <p className={`text-2xl font-extrabold mt-1 ${isProfitable ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(plData.netProfit)}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{isProfitable ? "Profitable Business" : "Operating at a deficit"}</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <div className="w-10 h-10 rounded-xl bg-[#1E232A]/10 text-[#1E232A] flex items-center justify-center mb-3">
            <PieChart className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Profit Margin</p>
          <p className="text-2xl font-extrabold text-[#1E232A] mt-1">{plData.profitMargin}%</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">Net Margin on Revenue</p>
        </div>
      </div>

      {/* Breakdown Breakdown Statement */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Financial Statement Breakdown</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 font-semibold text-[#1F2937]">
            <span>1. Gross Operational Revenue (Invoices)</span>
            <span className="text-emerald-600">+{formatCurrency(plData.totalRevenue)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 font-semibold text-[#1F2937]">
            <span>2. Less: Commercial Operating Expenditures</span>
            <span className="text-rose-600">-{formatCurrency(plData.totalExpenses)}</span>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-[#1F2937] font-extrabold text-base text-[#1F2937]">
            <span>Net Operating Income (EBIT)</span>
            <span className={isProfitable ? "text-emerald-600" : "text-rose-600"}>
              {formatCurrency(plData.netProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
