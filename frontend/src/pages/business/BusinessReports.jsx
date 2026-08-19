import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Building2, TrendingUp, TrendingDown, DollarSign, Users, Briefcase } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function BusinessReports() {
  const [data, setData] = useState({
    invoices: [],
    expenses: [],
    employees: [],
    departments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [invRes, expRes, empRes, deptRes] = await Promise.allSettled([
        fetch(`${API}/business/invoices`, { headers: headers() }),
        fetch(`${API}/expenses?module=business`, { headers: headers() }),
        fetch(`${API}/workspace/employees?workspace=business`, { headers: headers() }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: headers() }),
      ]);

      const invoices = invRes.status === "fulfilled" && invRes.value.ok ? await invRes.value.json() : [];
      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];
      const employees = empRes.status === "fulfilled" && empRes.value.ok ? await empRes.value.json() : [];
      const departments = deptRes.status === "fulfilled" && deptRes.value.ok ? await deptRes.value.json() : [];

      setData({
        invoices: Array.isArray(invoices) ? invoices : [],
        expenses: Array.isArray(expenses) ? expenses : [],
        employees: Array.isArray(employees) ? employees : [],
        departments: Array.isArray(departments) ? departments : [],
      });
    } catch (err) {
      console.error("Business reports load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const exportCSV = () => {
    const rows = [
      ["Type", "Title/Client", "Category/Status", "Amount", "Date"],
      ...data.invoices.map((i) => ["Invoice (Revenue)", `"${i.clientName}"`, i.status, i.totalAmount, new Date(i.issueDate).toLocaleDateString()]),
      ...data.expenses.map((e) => ["Operating Expense", `"${e.title}"`, e.category, e.amount, new Date(e.date).toLocaleDateString()]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finflow_business_audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Business Financial Reports</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Audit-ready commercial ledgers, revenue analysis, and expense statements</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors shadow-lg shadow-[#1E232A]/20"
        >
          <Download className="w-4 h-4" /> Export Audit CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Settled Invoiced Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Operating Expenditures</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Net Commercial Surplus</p>
          <p className={`text-2xl font-extrabold mt-1 ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937]">Commercial Financial Journal</h2>
          <span className="text-xs text-[#6B7280]">{data.invoices.length + data.expenses.length} Total Postings</span>
        </div>
        <div className="divide-y divide-[#F4F6F8]">
          {data.invoices.map((inv) => (
            <div key={inv._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Invoice #{inv.invoiceNumber} — {inv.clientName}</p>
                <p className="text-xs text-[#9CA3AF]">Status: {inv.status} · {new Date(inv.issueDate).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">+{formatCurrency(inv.totalAmount)}</p>
            </div>
          ))}
          {data.expenses.map((exp) => (
            <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{exp.title}</p>
                <p className="text-xs text-[#9CA3AF]">{exp.category} · {exp.department || "General"} · {new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-rose-600">-{formatCurrency(exp.amount)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
