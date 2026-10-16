import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
  Calendar,
  ReceiptIndianRupee,
  ShieldCheck,
  Wallet,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const EXPENSE_CATEGORIES = [
  "Groceries",
  "Household",
  "Utilities",
  "Rent & Housing",
  "Education",
  "Healthcare",
  "Travel & Vacation",
  "Events",
  "Dining",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary / Wages",
  "Member Contribution",
  "Rental Income",
  "Business / Freelance",
  "Investment / Dividend",
  "Gift / Support",
  "Other Income",
];

const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Credit Card", "Cash", "Joint Account"];

export default function FamilyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTxId, setDeleteTxId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "Groceries",
    paymentMethod: "UPI",
    paidBy: "Family",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txnRes, memRes] = await Promise.allSettled([
        fetch(`${API}/transactions?module=family&limit=150`, { headers: headers() }),
        fetch(`${API}/family/members`, { headers: headers() }),
      ]);

      if (txnRes.status === "fulfilled" && txnRes.value.ok) {
        const data = await txnRes.value.json();
        const rawTxns = data.transactions || (Array.isArray(data) ? data : []);
        const seen = new Set();
        const uniqueTxns = [];
        rawTxns.forEach((t) => {
          const title = (t.title || "").toLowerCase().trim();
          const category = (t.category || "").toLowerCase().trim();
          const amt = Math.round(Number(t.amount) || 0);
          const type = t.type || (amt < 0 ? "expense" : "income");
          let key = `${title}__${amt}__${type}`;

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
      }

      if (memRes.status === "fulfilled" && memRes.value.ok) {
        const memData = await memRes.value.json();
        setMembers(Array.isArray(memData) ? memData : []);
      }
    } catch (err) {
      console.error("Family transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        module: "family",
        type: form.type || "expense",
      };

      if (editItem) {
        await fetch(`${API}/transactions/${editItem._id}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API}/transactions`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditItem(null);
      resetForm();
      loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Submit family transaction error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTxId) return;
    const targetId = deleteTxId;
    setDeleteTxId(null);

    // Optimistic removal from UI immediately
    setTransactions((prev) => prev.filter((t) => t._id !== targetId));

    try {
      const res = await fetch(`${API}/transactions/${targetId}`, { method: "DELETE", headers: headers() });
      if (!res.ok) {
        console.warn("Delete endpoint response status:", res.status);
      }
      await loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Delete family transaction error:", err);
      loadData();
    }
  };

  const startEdit = (item) => {
    setEditItem(item);
    const itemType = item.type === "income" || (Number(item.amount) > 0 && item.type !== "expense") ? "income" : "expense";
    setForm({
      title: item.title || "",
      amount: item.amount || "",
      type: itemType,
      category: item.category || (itemType === "income" ? "Salary / Wages" : "Groceries"),
      paymentMethod: item.paymentMethod || "UPI",
      paidBy: item.notes?.replace("Paid by ", "") || "Family",
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const resetForm = (type = "expense") => {
    setForm({
      title: "",
      amount: "",
      type,
      category: type === "income" ? "Salary / Wages" : "Groceries",
      paymentMethod: "UPI",
      paidBy: members[0]?.name || "Family",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const filtered = transactions.filter((t) => {
    const isInc = t.type === "income" || (Number(t.amount) > 0 && t.type !== "expense");
    if (typeFilter === "income" && !isInc) return false;
    if (typeFilter === "expense" && isInc) return false;
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (search && !(t.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalExpenses = transactions
    .filter((t) => t.type === "expense" || Number(t.amount) < 0)
    .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) || 0), 0);

  const totalIncomes = transactions
    .filter((t) => t.type === "income" || (Number(t.amount) > 0 && t.type !== "expense"))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const activeCategories = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Transactions</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Shared ledger of household expenses and income</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer disabled:opacity-60"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Family Income</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalIncomes)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Family Expenses</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Cash Flow</p>
            <p
              className={`text-2xl font-extrabold mt-1 ${
                totalIncomes - totalExpenses >= 0 ? "text-[#005B4F]" : "text-rose-600"
              }`}
            >
              {formatCurrency(totalIncomes - totalExpenses)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#E6F5F1] text-[#00796B] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search family transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
          />
        </div>

        {/* Type Filter */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTypeFilter("expense")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === "expense" ? "bg-white text-rose-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Expenses
          </button>
          <button
            onClick={() => setTypeFilter("income")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              typeFilter === "income" ? "bg-white text-emerald-600 shadow-xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Income
          </button>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#005B4F] cursor-pointer"
        >
          <option value="all">All Categories</option>
          {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No family transactions found</p>
            <p className="text-xs text-gray-400 mt-1">Add your first transaction using the buttons above</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((tx) => {
              const isInc = tx.type === "income" || (Number(tx.amount) > 0 && tx.type !== "expense");
              const isBillPay =
                tx.isBillPayment ||
                (tx.title && tx.title.toLowerCase().startsWith("bill payment")) ||
                (tx.notes && tx.notes.includes("BBPS"));

              return (
                <div key={tx._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isInc
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : isBillPay
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-[#005B4F]/10 text-[#005B4F]"
                      }`}
                    >
                      {isInc ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isBillPay ? (
                        <ReceiptIndianRupee className="w-4 h-4" />
                      ) : tx.category ? (
                        tx.category[0]
                      ) : (
                        "F"
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#1F2937]">{tx.title}</p>
                        {isBillPay && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Bharat BillPay
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInc ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isInc ? "Income" : "Expense"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {tx.category} · <span className="font-semibold text-gray-700">{tx.paymentMethod || "UPI"}</span> · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`text-sm font-bold ${isInc ? "text-emerald-600" : "text-rose-600"}`}>
                      {isInc ? "+" : "-"} {formatCurrency(tx.amount)}
                    </p>
                    <button onClick={() => startEdit(tx)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTxId(tx._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "Add"} Family Transaction</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Switcher Tab */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    type: "expense",
                    category: EXPENSE_CATEGORIES[0],
                  }));
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.type === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    type: "income",
                    category: INCOME_CATEGORIES[0],
                  }));
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  form.type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Income
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder={form.type === "income" ? "Income Description (e.g. Salary Deposit, Pool Share)" : "Expense Description (e.g. Monthly Grocery)"}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="1"
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                >
                  {activeCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
                <input
                  type="text"
                  placeholder={form.type === "income" ? "Received By (e.g. Dad / Joint Account)" : "Paid By (e.g. Mom / Dad)"}
                  value={form.paidBy}
                  onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] resize-none"
              />
              <button
                type="submit"
                className={`w-full h-12 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg cursor-pointer ${
                  form.type === "income"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-[#005B4F] hover:bg-[#004A40] shadow-[#005B4F]/20"
                }`}
              >
                {editItem ? "Update" : "Add"} {form.type === "income" ? "Income" : "Expense"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTxId)}
        title="Delete Family Transaction"
        message="Are you sure you want to remove this transaction? This cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onClose={() => setDeleteTxId(null)}
      />
    </div>
  );
}
