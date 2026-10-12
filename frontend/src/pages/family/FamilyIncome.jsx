import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  X,
  Calendar,
  Search,
  Landmark,
  Repeat,
  ArrowUpRight,
  AlertCircle,
  Building2,
  Users,
  Wallet,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import BankAccountRequiredModal from "../../components/common/BankAccountRequiredModal";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const maskAccountNumber = (accNo) => {
  if (!accNo || typeof accNo !== "string") return "";
  const cleaned = accNo.trim();
  if (cleaned.length <= 4) return cleaned;
  return `•••• ${cleaned.slice(-4)}`;
};

const INCOME_SOURCES = [
  "Salary / Wages",
  "Member Contribution",
  "Rental Income",
  "Investment & Dividends",
  "Business & Freelance",
  "Interest & Capital Gains",
  "Gift & Family Support",
  "Pension & Annuity",
  "Refund / Cashback",
  "Other Income",
];

const PAYMENT_METHODS = [
  "Bank Transfer",
  "UPI",
  "Direct Deposit",
  "IMPS / NEFT",
  "Cheque",
  "Cash",
  "Other",
];

const RECURRING_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "bi-weekly", label: "Bi-Weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export default function FamilyIncome() {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showAccountReqModal, setShowAccountReqModal] = useState(false);
  const [deleteIncomeId, setDeleteIncomeId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    source: "Salary / Wages",
    account: "",
    member: "",
    paymentMethod: "Bank Transfer",
    date: new Date().toISOString().split("T")[0],
    recurring: false,
    frequency: "monthly",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [incRes, accRes, memRes] = await Promise.allSettled([
        fetch(`${API}/incomes?workspace=family`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=family`, { headers: headers() }),
        fetch(`${API}/family/members`, { headers: headers() }),
      ]);

      let loadedAccounts = [];
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accData = await accRes.value.json();
        loadedAccounts = Array.isArray(accData) ? accData : [];
        setAccounts(loadedAccounts);

        setSelectedAccountId((prev) => {
          if (prev && loadedAccounts.some((a) => a._id === prev)) {
            return prev;
          }
          return loadedAccounts[0]?._id || "";
        });
      }

      if (memRes.status === "fulfilled" && memRes.value.ok) {
        const memData = await memRes.value.json();
        setMembers(Array.isArray(memData) ? memData : []);
      }

      if (incRes.status === "fulfilled" && incRes.value.ok) {
        const incData = await incRes.value.json();
        setIncomes(Array.isArray(incData) ? incData : []);
      }
    } catch (err) {
      console.error("Error loading family income data:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalFamilyIncome = useMemo(() => {
    return incomes.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [incomes]);

  const totalBankBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  }, [accounts]);

  const activeStreamsCount = useMemo(() => {
    return incomes.length;
  }, [incomes]);

  const topSource = useMemo(() => {
    if (!incomes.length) return "N/A";
    const srcMap = {};
    incomes.forEach((i) => {
      const s = i.source || i.category || "Salary / Wages";
      srcMap[s] = (srcMap[s] || 0) + (Number(i.amount) || 0);
    });
    let maxSrc = "N/A";
    let maxVal = -1;
    Object.entries(srcMap).forEach(([src, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxSrc = src;
      }
    });
    return maxSrc;
  }, [incomes]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      const matchSearch =
        (item.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.notes || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.account || "").toLowerCase().includes(search.toLowerCase());

      const itemSrc = item.source || item.category || "Salary / Wages";
      const matchSource = sourceFilter === "all" || itemSrc === sourceFilter;

      const itemMember = (item.notes || "").match(/Member:\s*([^·|]+)/i)?.[1]?.trim() || "";
      const matchMember = memberFilter === "all" || itemMember === memberFilter || (memberFilter === "Family" && !itemMember);

      return matchSearch && matchSource && matchMember;
    });
  }, [incomes, search, sourceFilter, memberFilter]);

  const handleOpenAddModal = () => {
    if (accounts.length === 0) {
      setShowAccountReqModal(true);
      return;
    }

    const defaultAcc = accounts[0]?.name || accounts[0]?.bankName || "";
    const defaultMember = members[0]?.name || "Family";

    setEditItem(null);
    setForm({
      title: "",
      amount: "",
      source: "Salary / Wages",
      account: defaultAcc,
      member: defaultMember,
      paymentMethod: "Bank Transfer",
      date: new Date().toISOString().split("T")[0],
      recurring: false,
      frequency: "monthly",
      notes: "",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditItem(item);
    const existingMember = (item.notes || "").match(/Member:\s*([^·|]+)/i)?.[1]?.trim() || members[0]?.name || "Family";
    const cleanNotes = (item.notes || "").replace(/Member:\s*[^·|]+[·|]?/i, "").trim();

    setForm({
      title: item.title || "",
      amount: String(item.amount || ""),
      source: item.source || item.category || "Salary / Wages",
      account: item.account || accounts[0]?.name || "",
      member: existingMember,
      paymentMethod: item.paymentMethod || "Bank Transfer",
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      recurring: Boolean(item.recurring),
      frequency: item.frequency || "monthly",
      notes: cleanNotes,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account || !form.amount) return;

    try {
      const memberTag = form.member ? `Member: ${form.member}` : "";
      const compositeNotes = [memberTag, form.notes.trim()].filter(Boolean).join(" · ");

      const payload = {
        title: form.title.trim() || `${form.source} Inflow`,
        amount: Number(form.amount),
        source: form.source,
        category: form.source,
        account: form.account,
        paymentMethod: form.paymentMethod,
        date: form.date,
        recurring: form.recurring,
        frequency: form.recurring ? form.frequency : "once",
        notes: compositeNotes,
        workspace: "family",
      };

      const url = editItem ? `${API}/incomes/${editItem._id}` : `${API}/incomes`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Submit income failed:", res.status);
        return;
      }

      setShowModal(false);
      setEditItem(null);
      await loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Submit family income error:", err);
    }
  };

  const confirmDeleteIncome = async () => {
    if (!deleteIncomeId) return;
    const targetId = deleteIncomeId;
    setDeleteIncomeId(null);

    // Optimistic UI update
    setIncomes((prev) => prev.filter((i) => i._id !== targetId));

    try {
      await fetch(`${API}/incomes/${targetId}`, {
        method: "DELETE",
        headers: headers(),
      });
      await loadData();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Delete family income error:", err);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
            Family Income & Inflows
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Track household earnings, member contributions, investment returns, and automatically update family bank balances.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#005B4F] text-white font-bold text-sm shadow-md hover:bg-[#004A40] transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Family Income
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Family Income */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Family Income</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{formatCurrency(totalFamilyIncome)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Total recorded household inflow</p>
        </div>

        {/* Active Streams */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Inflow Streams</p>
            <div className="w-9 h-9 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] mt-2">{activeStreamsCount}</p>
          <p className="text-[11px] text-gray-400 mt-1">Recurring & one-time deposits</p>
        </div>

        {/* Family Bank Balance Pool */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Family Bank Balance</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-blue-700 mt-2">{formatCurrency(totalBankBalance)}</p>
          <p className="text-[11px] text-gray-400 mt-1">Across {accounts.length} linked family account(s)</p>
        </div>

        {/* Top Inflow Source */}
        <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Income Source</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-[#111827] mt-2 truncate" title={topSource}>{topSource}</p>
          <p className="text-[11px] text-gray-400 mt-1">Highest contributing category</p>
        </div>
      </div>

      {/* Linked Family Accounts Strip */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#005B4F]" />
            <h3 className="text-sm font-bold text-[#111827]">Linked Family Bank Accounts (Auto-Deposit)</h3>
          </div>
          <Link
            to="/app/family/accounts"
            className="text-xs font-bold text-[#005B4F] hover:underline flex items-center gap-1"
          >
            Manage Accounts <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">No Family Bank Account Connected</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Add a Family Bank Account or Joint Savings Pool to enable automated balance deposits when recording income.
                </p>
              </div>
            </div>
            <Link
              to="/app/family/accounts"
              className="px-3.5 py-1.5 bg-[#005B4F] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#004A40] transition-colors"
            >
              Add Family Account
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => (
              <div
                key={acc._id}
                className="p-3.5 rounded-xl border border-gray-100 bg-[#F9FAFB] hover:border-gray-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold text-xs shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{acc.nickname || acc.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {acc.bankName || "Bank"} {acc.accountNumber ? `· ${maskAccountNumber(acc.accountNumber)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-extrabold text-emerald-700">{formatCurrency(acc.balance)}</p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200">
                    {acc.type || "Savings"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {/* Filters */}
        <div className="p-4 sm:p-5 border-b border-[#F4F6F8] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search income title, notes, account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Member Filter */}
            {members.length > 0 && (
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
              >
                <option value="all">All Members</option>
                {members.map((m) => (
                  <option key={m._id || m.name} value={m.name}>
                    {m.name} ({m.role || "Member"})
                  </option>
                ))}
              </select>
            )}

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
            >
              <option value="all">All Sources</option>
              {INCOME_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Income Items List */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 text-xs font-medium">Loading family income streams...</div>
        ) : filteredIncomes.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-900">No Family Income Records Found</p>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Start by logging a salary deposit, member contribution, or rental return to build your family cash flow.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 px-4 py-2 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors cursor-pointer"
            >
              + Add First Family Income
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredIncomes.map((item) => {
              const memberName = (item.notes || "").match(/Member:\s*([^·|]+)/i)?.[1]?.trim();
              const cleanNotes = (item.notes || "").replace(/Member:\s*[^·|]+[·|]?/i, "").trim();

              return (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.source || item.category || "Salary / Wages"}
                        </span>
                        {memberName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> {memberName}
                          </span>
                        )}
                        {item.recurring && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                            <Repeat className="w-2.5 h-2.5" /> {item.frequency || "Monthly"}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          Deposited to: <strong className="text-gray-700">{item.account || "Family Bank"}</strong>
                        </span>
                        <span>•</span>
                        <span>{item.paymentMethod || "Bank Transfer"}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.date || item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {cleanNotes && (
                          <>
                            <span>•</span>
                            <span className="text-gray-500 italic">"{cleanNotes}"</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-sm sm:text-base font-extrabold text-emerald-600">
                      +{formatCurrency(item.amount)}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors cursor-pointer"
                        title="Edit Stream"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteIncomeId(item._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Stream"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editItem ? "Edit Family Income" : "Add Family Income Stream"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Deposits funds directly into selected Family Bank Account and records transaction.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Income Stream Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Father Monthly Salary, 2nd Floor Rent, Mutual Fund Dividend"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F]"
                />
              </div>

              {/* Amount & Source Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 50000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Source / Category</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
                  >
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Bank Account (Crucial Requirement) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                  <span>Deposit To Family Bank Account <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Balance will auto-increase</span>
                </label>
                <select
                  required
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc.name}>
                      {acc.nickname || acc.name} ({acc.bankName || "Bank"}) — Current: {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contributing Member & Payment Method Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contributing Member</label>
                  <select
                    value={form.member}
                    onChange={(e) => setForm({ ...form, member: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
                  >
                    <option value="Family">Shared Family Pool</option>
                    {members.map((m) => (
                      <option key={m._id || m.name} value={m.name}>
                        {m.name} ({m.role || "Member"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F] cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Recurring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Date</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.recurring}
                      onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                      className="rounded text-[#005B4F] focus:ring-[#005B4F]"
                    />
                    <span>Recurring Monthly Inflow</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Credited via IMPS, salary for month of August"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#005B4F]/20 focus:border-[#005B4F]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#005B4F] text-white text-xs font-bold shadow-md hover:bg-[#004A40] transition-colors cursor-pointer"
                >
                  {editItem ? "Update Family Income" : "Deposit Income & Update Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Required Modal */}
      <BankAccountRequiredModal
        isOpen={showAccountReqModal}
        onClose={() => setShowAccountReqModal(false)}
        workspaceType="family"
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteIncomeId)}
        title="Delete Family Income Stream"
        message="Are you sure you want to delete this income stream? This will deduct the amount from your family bank balance and remove the associated transaction."
        confirmText="Delete Stream"
        onConfirm={confirmDeleteIncome}
        onClose={() => setDeleteIncomeId(null)}
      />
    </div>
  );
}
