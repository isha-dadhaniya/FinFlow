import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, CreditCard, X, Building2, Store, FileText, CheckCircle2, Clock, AlertCircle, Landmark, RefreshCw } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORIES = ["Office Supplies", "Software & Cloud", "Travel & Meals", "Marketing & Ads", "Legal & Accounting", "Hardware & Equipment", "Vendor Payout", "Client Entertainment", "Utilities & Rent", "Other"];
const PAYMENT_METHODS = ["Corporate Card", "Bank Transfer", "UPI", "Cheque", "Petty Cash"];

export default function BusinessExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Office Supplies",
    paymentMethod: "Bank Transfer",
    account: "",
    department: "General",
    vendor: "",
    gstRate: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, deptRes, venRes, accRes] = await Promise.allSettled([
        fetch(`${API}/expenses?module=business`, { headers: headers() }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: headers() }),
        fetch(`${API}/workspace/vendors?workspace=business`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=business`, { headers: headers() }),
      ]);

      let loadedAccounts = [];
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const aData = await accRes.value.json();
        loadedAccounts = Array.isArray(aData) ? aData : [];
        setAccounts(loadedAccounts);
      }
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

      // Default the form account to the primary corporate account if not set
      if (loadedAccounts.length > 0) {
        setForm((prev) => {
          if (!prev.account) {
            return {
              ...prev,
              account: loadedAccounts[0]?.name || loadedAccounts[0]?.nickname || loadedAccounts[0]?.bankName || "",
            };
          }
          return prev;
        });
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
      const amountVal = Number(form.amount) || 0;
      const gstRateVal = form.gstRate !== "" && form.gstRate !== undefined ? Number(form.gstRate) : 0;
      const gstAmountVal = gstRateVal > 0 ? Math.round(((amountVal * gstRateVal) / 100) * 100) / 100 : 0;

      // Ensure proper account is selected for non-cash expenses
      const isPettyCash = form.paymentMethod === "Petty Cash";
      const targetAccount = isPettyCash
        ? "Petty Cash"
        : (form.account || (accounts[0]?.name || accounts[0]?.nickname || accounts[0]?.bankName || ""));

      const payload = {
        ...form,
        account: targetAccount,
        amount: amountVal,
        gstRate: gstRateVal,
        gstAmount: gstAmountVal,
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
      const defaultAcc = accounts.length > 0 ? (accounts[0].name || accounts[0].nickname || accounts[0].bankName) : "";
      setForm({
        title: "",
        amount: "",
        category: "Office Supplies",
        paymentMethod: "Bank Transfer",
        account: defaultAcc,
        department: departments[0]?.name || "General",
        vendor: "",
        gstRate: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Save business expense error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this business expense record? The deducted amount will be refunded to your corporate bank account.")) return;
    try {
      await fetch(`${API}/expenses/${id}`, { method: "DELETE", headers: headers() });
      loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditItem(null);
              const defaultAcc = accounts.length > 0 ? (accounts[0]?.name || accounts[0]?.nickname || accounts[0]?.bankName) : "";
              setForm({
                title: "",
                amount: "",
                category: "Office Supplies",
                paymentMethod: "Bank Transfer",
                account: defaultAcc,
                department: departments[0]?.name || "General",
                vendor: "",
                gstRate: "",
                date: new Date().toISOString().split("T")[0],
                notes: ""
              });
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Business Expense
          </button>
        </div>
      </div>

      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-[#005B4F] to-[#007D6D] rounded-2xl p-6 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Operating Expenditure</p>
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
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#005B4F]"
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
                  <div className="w-10 h-10 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold text-sm">
                    {exp.category ? exp.category[0] : "B"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1F2937]">{exp.title}</p>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#9CA3AF] mt-0.5">
                      <span>{exp.category} · {exp.department || "General"}</span>
                      {exp.account ? <span>· 🏦 {exp.account}</span> : <span>· {exp.paymentMethod || "Corporate Card"}</span>}
                      {exp.gstRate ? <span>· GST: {exp.gstRate}%</span> : (exp.gstAmount ? <span>· GST: {formatCurrency(exp.gstAmount)}</span> : null)}
                      <span>· {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {exp.isAccountDeducted ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Bank Deducted
                        </span>
                      ) : (exp.paymentMethod || "").toLowerCase() === "petty cash" ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          💵 Petty Cash
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-rose-600">- {formatCurrency(exp.amount)}</p>
                  <button onClick={() => handleDelete(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete Expense">
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
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Total Amount (₹)"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="1"
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
                <div className="relative">
                  <input
                    type="number"
                    placeholder="GST Rate (%) e.g. 18"
                    value={form.gstRate}
                    onChange={(e) => setForm({ ...form, gstRate: e.target.value })}
                    onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                    min="0"
                    max="100"
                    step="any"
                    className="w-full h-11 px-4 pr-8 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
                </div>
              </div>
              {Number(form.gstRate) > 0 && Number(form.amount) > 0 && (
                <div className="text-xs text-[#005B4F] font-semibold bg-[#005B4F]/5 px-3.5 py-2 rounded-xl flex items-center justify-between">
                  <span>Calculated GST ({form.gstRate}%):</span>
                  <span>{formatCurrency((Number(form.amount) * Number(form.gstRate)) / 100)}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => {
                    const pm = e.target.value;
                    const defaultAcc = accounts.length > 0 ? (accounts[0]?.name || accounts[0]?.nickname || accounts[0]?.bankName || "") : "";
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: pm,
                      account: pm === "Petty Cash" ? "Petty Cash" : (prev.account === "Petty Cash" || !prev.account ? defaultAcc : prev.account),
                    }));
                  }}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                >
                  {PAYMENT_METHODS.map((p) => (
                    <option key={p} value={p}>{p === "Petty Cash" ? "💵 Petty Cash" : p}</option>
                  ))}
                </select>
              </div>

              {/* Deduct From Corporate Bank Account */}
              {form.paymentMethod === "Petty Cash" ? (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <span className="text-base select-none">💵</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900">Petty Cash Drawer (No Bank Deduction)</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Disbursed from physical petty cash drawer. Corporate bank balance will not be deducted.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Deduct From Corporate Bank Account <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-gray-400 font-normal lowercase">deducted from balance</span>
                  </label>
                  {accounts.length === 0 ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>No corporate bank accounts found. Please add an account in Business Accounts first.</span>
                    </div>
                  ) : (
                    <>
                      <select
                        value={form.account}
                        onChange={(e) => setForm({ ...form, account: e.target.value })}
                        required
                        className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white font-medium"
                      >
                        <option value="" disabled>-- Select Corporate Bank Account --</option>
                        {accounts.map((a) => {
                          const accName = a.name || a.nickname || a.bankName;
                          return (
                            <option key={a._id} value={accName}>
                              🏦 {a.bankName} - {a.nickname || a.name} (Balance: {formatCurrency(a.balance)})
                            </option>
                          );
                        })}
                      </select>
                      {form.account && (
                        <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {formatCurrency(form.amount || 0)} will be automatically subtracted from <strong>{form.account}</strong> balance.
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
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
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <textarea
                placeholder="Business Purpose / Audit Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] resize-none"
              />
              <button
                type="submit"
                className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
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
