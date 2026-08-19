import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, CreditCard, X, Building2, Store, FileText, CheckCircle2, Clock } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORIES = ["Office Supplies", "Software & Cloud", "Travel & Meals", "Marketing & Ads", "Legal & Accounting", "Hardware & Equipment", "Vendor Payout", "Client Entertainment", "Utilities & Rent", "Other"];
const PAYMENT_METHODS = ["Corporate Card", "Bank Transfer", "Petty Cash", "UPI", "Cheque"];

export default function BusinessExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Office Supplies",
    paymentMethod: "Corporate Card",
    department: "General",
    vendor: "",
    gstAmount: 0,
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, deptRes, venRes] = await Promise.allSettled([
        fetch(`${API}/expenses?module=business`, { headers: headers() }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: headers() }),
        fetch(`${API}/workspace/vendors?workspace=business`, { headers: headers() }),
      ]);

      if (expRes.status === "fulfilled" && expRes.value.ok) {
        const data = await expRes.value.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
      if (deptRes.status === "fulfilled" && deptRes.value.ok) {
        const dData = await deptRes.value.json();
        setDepartments(Array.isArray(dData) ? dData : []);
      }
      if (venRes.status === "fulfilled" && venRes.value.ok) {
        const vData = await venRes.value.json();
        setVendors(Array.isArray(vData) ? vData : []);
      }
    } catch (err) {
      console.error("Business expenses load error:", err);
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
        gstAmount: Number(form.gstAmount || 0),
        module: "business",
      };

      if (editItem) {
        await fetch(`${API}/expenses/${editItem._id}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API}/expenses`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ title: "", amount: "", category: "Office Supplies", paymentMethod: "Corporate Card", department: "General", vendor: "", gstAmount: 0, date: new Date().toISOString().split("T")[0], notes: "" });
      loadData();
    } catch (err) {
      console.error("Save business expense error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this business expense record?")) return;
    try {
      await fetch(`${API}/expenses/${id}`, { method: "DELETE", headers: headers() });
      loadData();
    } catch (err) {
      console.error("Delete business expense error:", err);
    }
  };

  const filtered = expenses.filter((e) => {
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    if (search && !(e.title || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSpent = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Business Expenses</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Commercial expenditures, vendor payouts, and departmental spend</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setForm({ title: "", amount: "", category: "Office Supplies", paymentMethod: "Corporate Card", department: departments[0]?.name || "General", vendor: "", gstAmount: 0, date: new Date().toISOString().split("T")[0], notes: "" });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors shadow-lg shadow-[#1E232A]/20"
        >
          <Plus className="w-4 h-4" /> Add Business Expense
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-[#1E232A] rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Operating Expenditure</p>
          <p className="text-3xl font-extrabold mt-1 text-white">{formatCurrency(totalSpent)}</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl">
          <Building2 className="w-4 h-4 text-gray-300" />
          <span className="text-xs font-semibold text-gray-200">{departments.length} Departments</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search expenses by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#1E232A]"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading business expenses...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No business expenses recorded</p>
            <p className="text-xs text-gray-400 mt-1">Record company disbursements and track departmental costs</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((exp) => (
              <div key={exp._id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#1E232A] flex items-center justify-center font-bold text-sm">
                    {exp.category ? exp.category[0] : "B"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1F2937]">{exp.title}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {exp.category} · {exp.paymentMethod || "Corporate Card"} · {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-rose-600">- {formatCurrency(exp.amount)}</p>
                  <button
                    onClick={() => {
                      setEditItem(exp);
                      setForm({
                        title: exp.title,
                        amount: exp.amount,
                        category: exp.category || "Office Supplies",
                        paymentMethod: exp.paymentMethod || "Corporate Card",
                        department: exp.department || "General",
                        vendor: exp.vendor || "",
                        gstAmount: exp.gstAmount || 0,
                        date: exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                        notes: exp.notes || "",
                      });
                      setShowForm(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E232A]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "Record"} Business Expense</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Expense Description (e.g. AWS Server Bill)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Total Amount (₹)"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="1"
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                />
                <input
                  type="number"
                  placeholder="GST Component (₹)"
                  value={form.gstAmount}
                  onChange={(e) => setForm({ ...form, gstAmount: e.target.value })}
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                >
                  <option value="General">General Dept</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                />
              </div>
              <textarea
                placeholder="Business Purpose / Audit Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A] resize-none"
              />
              <button
                type="submit"
                className="w-full h-12 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors"
              >
                {editItem ? "Update" : "Save"} Business Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
