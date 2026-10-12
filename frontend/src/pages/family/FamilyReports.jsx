import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, Users, PieChart, Calendar, Scale } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function FamilyReports() {
  const [data, setData] = useState({
    transactions: [],
    bills: [],
    settlements: [],
    members: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [txnRes, billRes, settRes, memRes] = await Promise.allSettled([
        fetch(`${API}/transactions?module=family`, { headers: headers() }),
        fetch(`${API}/bills?workspace=family`, { headers: headers() }),
        fetch(`${API}/workspace/settlements?workspace=family`, { headers: headers() }),
        fetch(`${API}/family/members`, { headers: headers() }),
      ]);

      const txns = txnRes.status === "fulfilled" && txnRes.value.ok ? (await txnRes.value.json()).transactions || [] : [];
      const bills = billRes.status === "fulfilled" && billRes.value.ok ? await billRes.value.json() : [];
      const settlements = settRes.status === "fulfilled" && settRes.value.ok ? await settRes.value.json() : [];
      const members = memRes.status === "fulfilled" && memRes.value.ok ? await memRes.value.json() : [];

      setData({
        transactions: Array.isArray(txns) ? txns : [],
        bills: Array.isArray(bills) ? bills : [],
        settlements: Array.isArray(settlements) ? settlements : [],
        members: Array.isArray(members) ? members : [],
      });
    } catch (err) {
      console.error("Family report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = data.transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalBills = data.bills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingSettlements = data.settlements.filter((s) => s.status === "pending").reduce((sum, s) => sum + (s.amount || 0), 0);

  // Category breakdown
  const categoryMap = {};
  data.transactions.forEach((t) => {
    categoryMap[t.category || "Other"] = (categoryMap[t.category || "Other"] || 0) + (t.amount || 0);
  });

  const exportCSV = () => {
    const rows = [
      ["Date", "Title", "Category", "Amount", "Paid By"],
      ...data.transactions.map((t) => [
        new Date(t.date).toLocaleDateString(),
        `"${t.title || ""}"`,
        t.category || "Other",
        t.amount || 0,
        t.notes || "Family",
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finflow_family_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Financial Reports</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Comprehensive audit statements and spending breakdowns</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Shared Expenses</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Utility Bills</p>
          <p className="text-2xl font-extrabold text-[#005B4F] mt-1">{formatCurrency(totalBills)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Unsettled Balances</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatCurrency(pendingSettlements)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Spending by Category</h2>
        {Object.keys(categoryMap).length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No spending data to categorize yet.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(categoryMap).map(([cat, amt]) => {
              const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#1F2937]">{cat}</span>
                    <span className="text-[#005B4F]">{formatCurrency(amt)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#F4F6F8] rounded-full overflow-hidden">
                    <div className="h-full bg-[#005B4F] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937]">Transaction Log</h2>
          <span className="text-xs text-[#6B7280]">{data.transactions.length} Records</span>
        </div>
        <div className="divide-y divide-[#F4F6F8]">
          {data.transactions.slice(0, 15).map((t) => (
            <div key={t._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{t.title}</p>
                <p className="text-xs text-[#9CA3AF]">{t.category} · {new Date(t.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-rose-600">- {formatCurrency(t.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
