import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ArrowLeftRight, X, Users, Calendar, Filter, ReceiptIndianRupee, ShieldCheck } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORIES = ["Groceries", "Household", "Utilities", "Rent & Housing", "Education", "Healthcare", "Travel & Vacation", "Events", "Dining", "Other"];
const PAYMENT_METHODS = ["UPI", "Bank Transfer", "Credit Card", "Cash", "Joint Account"];

export default function FamilyTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
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
        fetch(`${API}/transactions?module=family`, { headers: headers() }),
        fetch(`${API}/family/members`, { headers: headers() }),
      ]);

      if (txnRes.status === "fulfilled" && txnRes.value.ok) {
        const data = await txnRes.value.json();
        const rawTxns = data.transactions || data || [];
        const seen = new Set();
        const uniqueTxns = [];
        (Array.isArray(rawTxns) ? rawTxns : []).forEach((t) => {
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
      if (editItem) {
        await fetch(`${API}/transactions/${editItem._id}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
            module: "family",
            type: "expense",
          }),
        });
      } else {
        await fetch(`${API}/transactions`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            ...form,
            amount: Number(form.amount),
            module: "family",
            type: "expense",
          }),
        });
      }
      setShowForm(false);
      setEditItem(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Submit family transaction error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this family transaction?")) return;
    try {
      await fetch(`${API}/transactions/${id}`, { method: "DELETE", headers: headers() });
      loadData();
    } catch (err) {
      console.error("Delete family transaction error:", err);
    }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      amount: item.amount || "",
      category: item.category || "Groceries",
      paymentMethod: item.paymentMethod || "UPI",
      paidBy: item.notes?.replace("Paid by ", "") || "Family",
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      notes: item.notes || "",
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      title: "",
      amount: "",
      category: "Groceries",
      paymentMethod: "UPI",
      paidBy: members[0]?.name || "Family",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const filtered = transactions.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (search && !(t.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSpent = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Transactions</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Shared ledger of household expenses and purchases</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditItem(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#21867A] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total Family Spending</p>
          <p className="text-3xl font-extrabold mt-1">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-xs">
          <Users className="w-4 h-4 text-white" />
          <span className="text-xs font-semibold text-white">{members.length} Active Member{members.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search family expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F] focus:ring-2 focus:ring-[#2A9D8F]/10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#2A9D8F]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
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
            <p className="text-xs text-gray-400 mt-1">Add your first shared expense above</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((tx) => {
              const isBillPay =
                tx.isBillPayment ||
                (tx.title && tx.title.toLowerCase().startsWith("bill payment")) ||
                (tx.notes && tx.notes.includes("BBPS"));
              return (
                <div key={tx._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isBillPay ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-[#2A9D8F]/10 text-[#2A9D8F]"
                      }`}
                    >
                      {isBillPay ? <ReceiptIndianRupee className="w-4 h-4" /> : tx.category ? tx.category[0] : "F"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-[#1F2937]">{tx.title}</p>
                        {isBillPay && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Bharat BillPay
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                        {tx.category} · <span className="font-semibold text-gray-700">{tx.paymentMethod || "UPI"}</span> · {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-rose-600">- {formatCurrency(tx.amount)}</p>
                    <button onClick={() => startEdit(tx)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2A9D8F]">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(tx._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
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
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Description (e.g. Monthly Grocery Restock)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
              />
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="1"
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
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
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
                <input
                  type="text"
                  placeholder="Paid By (e.g. Mom / Dad)"
                  value={form.paidBy}
                  onChange={(e) => setForm({ ...form, paidBy: e.target.value })}
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F] resize-none"
              />
              <button
                type="submit"
                className="w-full h-12 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
              >
                {editItem ? "Update" : "Add"} Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
