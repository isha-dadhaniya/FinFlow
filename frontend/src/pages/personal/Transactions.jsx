import React, { useState, useEffect } from "react";
import { Search, Trash2, TrendingUp, TrendingDown, ArrowLeftRight, Calendar, RefreshCw, BadgePercent, ShieldCheck, ReceiptIndianRupee, Zap } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORIES = [
  "All Categories",
  "Salary",
  "Freelance",
  "Investment",
  "Loan EMI",
  "Food & Dining",
  "Groceries",
  "Shopping",
  "Transport",
  "Bills & Utilities",
  "Entertainment",
  "Healthcare",
  "Education",
  "Other",
];

const TYPES = ["income", "expense", "transfer"];

export default function PersonalTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [deleteTxId, setDeleteTxId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/transactions?module=personal`, { headers: headers() });
      if (!res.ok) {
        console.error("HTTP error fetching transactions:", res.status);
      }
      const data = await res.json();
      let txns = [];
      if (Array.isArray(data)) {
        txns = data;
      } else if (data && Array.isArray(data.transactions)) {
        txns = data.transactions;
      }

      // Client-side deduplication safeguard
      const seen = new Set();
      const uniqueTxns = [];
      txns.forEach((t) => {
        const title = (t.title || "").toLowerCase().trim();
        const category = (t.category || "").toLowerCase().trim();
        const amt = Math.round(Number(t.amount) || 0);
        let key = `${title}__${amt}__${t.type}`;

        if (category === "loan emi" || /emi (auto-debit|payment)/i.test(title)) {
          const cleanName = title.replace(/emi\s+(auto-debit|payment)\s*-\s*/gi, "").replace(/\s*\(#\d+\)/gi, "").trim();
          const inst = (title.match(/#(\d+)/) || (t.notes || "").match(/#(\d+)/) || [])[1] || "";
          key = `loan_emi__${cleanName}__${amt}__${inst}`;
        }

        if (!seen.has(key)) {
          seen.add(key);
          uniqueTxns.push(t);
        }
      });

      setTransactions(uniqueTxns);
    } catch (err) {
      console.error("Load transactions error:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteTx = async () => {
    if (!deleteTxId) return;
    try {
      await fetch(`${API}/transactions/${deleteTxId}`, { method: "DELETE", headers: headers() });
      setDeleteTxId(null);
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (categoryFilter !== "All Categories" && t.category !== categoryFilter) return false;
    if (search && !(t.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalInflows = transactions.filter((t) => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
  const totalOutflows = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + (t.amount || 0), 0);

  const isBillPaymentTx = (tx) =>
    tx.isBillPayment ||
    (tx.title && tx.title.toLowerCase().startsWith("bill payment")) ||
    (tx.notes && tx.notes.includes("BBPS")) ||
    tx.category === "Bills & Utilities" ||
    tx.category === "Electricity" ||
    tx.category === "Water" ||
    tx.category === "Gas" ||
    tx.category === "Internet";

  const typeIcon = (type, category, tx = {}) => {
    if (isBillPaymentTx(tx)) return <ReceiptIndianRupee className="w-4 h-4" />;
    if (category === "Loan EMI") return <BadgePercent className="w-4 h-4" />;
    if (type === "income") return <TrendingUp className="w-4 h-4" />;
    if (type === "transfer") return <ArrowLeftRight className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const typeColor = (type, category, tx = {}) => {
    if (isBillPaymentTx(tx)) return "text-blue-700 bg-blue-50 border border-blue-200";
    if (category === "Loan EMI") return "text-purple-700 bg-purple-50 border border-purple-200";
    if (type === "income") return "text-emerald-600 bg-emerald-50";
    if (type === "transfer") return "text-blue-600 bg-blue-50";
    return "text-rose-600 bg-rose-50";
  };

  const formatDateStr = (dateVal) => {
    if (!dateVal) return "Recent";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Transaction Ledger</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Consolidated real-time statement of your incomes, operating expenses, and Loan EMI payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Inflows (Income)</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">+{formatCurrency(totalInflows)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{transactions.filter((t) => t.type === "income").length} Inflow Stream(s)</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Outflows (Expenses & EMI)</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">-{formatCurrency(totalOutflows)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">
            {transactions.filter((t) => t.type === "expense").length} Outflow Items ({transactions.filter((t) => t.category === "Loan EMI").length} Loan EMIs)
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Net Cash Position</p>
          <p className={`text-2xl font-extrabold mt-1 ${totalInflows - totalOutflows >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(totalInflows - totalOutflows)}
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{transactions.length} Total Postings</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search descriptions, loan EMIs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#005B4F]"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {["all", ...TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
                filterType === t
                  ? "bg-[#005B4F] text-white"
                  : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
              }`}
            >
              {t === "all" ? "All Entries" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading ledger records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Transaction Records Found</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your incomes, expenses, or process Loan EMIs to see them reflected in this ledger.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-3"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${typeColor(tx.type, tx.category, tx)}`}>
                    {typeIcon(tx.type, tx.category, tx)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-[#1F2937]">{tx.title || "Transaction"}</p>
                      {tx.category === "Loan EMI" && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Loan EMI
                        </span>
                      )}
                      {isBillPaymentTx(tx) && (
                        <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Bharat BillPay
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      {tx.category || "General"} · <span className="font-semibold text-gray-700">{tx.paymentMethod || "Bank Transfer"}</span> · {formatDateStr(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className={`text-base sm:text-lg font-extrabold ${tx.type === "income" ? "text-emerald-600" : tx.type === "transfer" ? "text-blue-600" : "text-rose-600"}`}>
                    {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""} {formatCurrency(tx.amount)}
                  </p>
                  <button
                    onClick={() => setDeleteTxId(tx._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTxId)}
        onClose={() => setDeleteTxId(null)}
        onConfirm={confirmDeleteTx}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction ledger entry?"
        confirmText="Delete Entry"
        isDanger={true}
      />
    </div>
  );
}
