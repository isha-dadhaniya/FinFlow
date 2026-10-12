import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  DollarSign,
  Search,
  Landmark,
  Repeat,
  ArrowUpRight,
  AlertCircle,
  Building2,
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
  "Salary",
  "Freelance & Contract",
  "Business & Sales",
  "Investment & Dividends",
  "Rental Income",
  "Interest & Capital Gains",
  "Performance Bonus",
  "Gift & Grants",
  "Refund / Cashback",
  "Other Income",
];

const PAYMENT_METHODS = [
  "Bank Transfer",
  "UPI",
  "Direct Deposit",
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

export default function Income() {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showAccountReqModal, setShowAccountReqModal] = useState(false);
  const [deleteIncomeId, setDeleteIncomeId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    source: "Salary",
    account: "",
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
      const [incRes, accRes] = await Promise.allSettled([
        fetch(`${API}/incomes?workspace=personal`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=personal`, { headers: headers() }),
      ]);

      let loadedAccounts = [];
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accData = await accRes.value.json();
        loadedAccounts = Array.isArray(accData) ? accData : [];
        setAccounts(loadedAccounts);

        // Auto-select first account if not set or invalid
        setSelectedAccountId((prev) => {
          if (prev && loadedAccounts.some((a) => a._id === prev)) {
            return prev;
          }
          return loadedAccounts[0]?._id || "";
        });
      }

      if (incRes.status === "fulfilled" && incRes.value.ok) {
        const data = await incRes.value.json();
        setIncomes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Load income error:", err);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to match an income entry to an account object
  const isIncomeLinkedToAccount = (item, acc) => {
    if (!item || !acc) return false;
    const itemAcc = (item.account || "").trim().toLowerCase();
    const accName = (acc.name || "").trim().toLowerCase();
    const accNick = (acc.nickname || "").trim().toLowerCase();
    const accBank = (acc.bankName || "").trim().toLowerCase();

    return (
      itemAcc === accName ||
      (accNick && itemAcc === accNick) ||
      (accBank && itemAcc === accBank)
    );
  };

  // Active Selected Account Object (defaults to first account if single account or selected)
  const activeAccountObj = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const found = accounts.find((a) => a._id === selectedAccountId);
    return found || accounts[0];
  }, [accounts, selectedAccountId]);

  // Compute per-account metrics for the tab indicators
  const accountMetrics = useMemo(() => {
    return accounts.map((acc) => {
      const accIncomes = incomes.filter((i) => isIncomeLinkedToAccount(i, acc));
      const totalIncome = accIncomes.reduce((s, i) => s + (i.amount || 0), 0);
      return {
        account: acc,
        totalIncome,
        entryCount: accIncomes.length,
      };
    });
  }, [accounts, incomes]);

  // Isolated KPI Stats strictly for active account
  const currentKPIs = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (!activeAccountObj) {
      return { total: 0, monthTotal: 0, recurringTotal: 0, count: 0, recurringCount: 0 };
    }

    const targetList = incomes.filter((i) => isIncomeLinkedToAccount(i, activeAccountObj));
    const total = targetList.reduce((s, i) => s + (i.amount || 0), 0);

    const monthList = targetList.filter((i) => {
      const d = new Date(i.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthTotal = monthList.reduce((s, i) => s + (i.amount || 0), 0);

    const recurringList = targetList.filter((i) => i.recurring);
    const recurringTotal = recurringList.reduce((s, i) => s + (i.amount || 0), 0);

    return {
      total,
      monthTotal,
      recurringTotal,
      count: targetList.length,
      recurringCount: recurringList.length,
    };
  }, [incomes, activeAccountObj]);

  // Filtered income stream strictly for the active account
  const filteredIncomes = useMemo(() => {
    if (!activeAccountObj) return [];

    return incomes.filter((item) => {
      // Must belong to this active bank account
      if (!isIncomeLinkedToAccount(item, activeAccountObj)) return false;

      // Source Filter
      if (
        sourceFilter !== "all" &&
        item.source !== sourceFilter &&
        item.category !== sourceFilter
      ) {
        return false;
      }

      // Search query
      if (search && !item.title?.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [incomes, activeAccountObj, sourceFilter, search]);

  const handleOpenAddModal = (defaultAcc = null) => {
    if (accounts.length === 0) {
      setShowAccountReqModal(true);
      return;
    }

    const preselectedAcc =
      defaultAcc ||
      activeAccountObj?.nickname ||
      activeAccountObj?.name ||
      accounts[0]?.nickname ||
      accounts[0]?.name ||
      "";

    setEditItem(null);
    setForm({
      title: "",
      amount: "",
      source: "Salary",
      account: preselectedAcc,
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
    setForm({
      title: item.title || "",
      amount: String(item.amount || ""),
      source: item.source || item.category || "Salary",
      account: item.account || accounts[0]?.nickname || accounts[0]?.name || "",
      paymentMethod: item.paymentMethod || "Bank Transfer",
      date: item.date
        ? new Date(item.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      recurring: Boolean(item.recurring),
      frequency: item.frequency || "monthly",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.account) return;

    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        source: form.source,
        category: form.source,
        account: form.account,
        paymentMethod: form.paymentMethod,
        date: form.date,
        recurring: form.recurring,
        frequency: form.recurring ? form.frequency : "once",
        notes: form.notes.trim(),
        workspace: "personal",
      };

      const url = editItem ? `${API}/incomes/${editItem._id}` : `${API}/incomes`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) return;

      setShowModal(false);
      setEditItem(null);
      loadData();
    } catch (err) {
      console.error("Submit income error:", err);
    }
  };

  const confirmDeleteIncome = async () => {
    if (!deleteIncomeId) return;
    try {
      await fetch(`${API}/incomes/${deleteIncomeId}`, {
        method: "DELETE",
        headers: headers(),
      });
      setDeleteIncomeId(null);
      loadData();
    } catch (err) {
      console.error("Delete income error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1640px] mx-auto pb-10">
      {/* ─── 1. HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
            Income & Earnings
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6B7280] mt-1">
            Track per-account income streams, salary deposits, and dedicated bank balance inflows
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      {/* ─── 2. NO BANK ACCOUNT ALERT ───────────────────────────────────── */}
      {accounts.length === 0 && !loading && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between flex-wrap gap-3 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">No Connected Bank Accounts Found</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Add your bank account first so income earnings can be tracked and credited to your live balance.
              </p>
            </div>
          </div>
          <Link
            to="/app/personal/accounts"
            className="px-4 py-2 bg-amber-700 text-white text-xs font-bold rounded-xl hover:bg-amber-800 transition-colors"
          >
            + Add Bank Account First
          </Link>
        </div>
      )}

      {/* ─── 3. BANK ACCOUNT TABS (SHOWN ONLY IF USER HAS > 1 ACCOUNT) ─── */}
      {accounts.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 sm:p-3 shadow-xs">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-100 px-1">
            <Building2 className="w-4 h-4 text-[#005B4F]" />
            <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
              Select Bank Account ({accounts.length})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {accountMetrics.map(({ account, totalIncome }) => (
              <button
                key={account._id}
                onClick={() => setSelectedAccountId(account._id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeAccountObj?._id === account._id
                    ? "bg-[#005B4F] text-white shadow-md shadow-[#005B4F]/20"
                    : "bg-gray-50 text-[#374151] hover:bg-gray-100 border border-gray-200/60"
                }`}
              >
                <Landmark className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <p className="leading-tight">
                    {account.nickname || account.name}
                  </p>
                  <p
                    className={`text-[10px] font-medium leading-none mt-0.5 ${
                      activeAccountObj?._id === account._id
                        ? "text-emerald-100"
                        : "text-gray-500"
                    }`}
                  >
                    {account.bankName || "Bank"} · {maskAccountNumber(account.accountNumber)}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ml-1.5 ${
                    activeAccountObj?._id === account._id
                      ? "bg-white/20 text-white"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  }`}
                >
                  {formatCurrency(totalIncome)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. ACTIVE ACCOUNT BANNER & ISOLATED KPI STATS ─────────────── */}
      {activeAccountObj && (
        <div className="space-y-4">
          {/* Account Detail Banner */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between flex-wrap gap-3 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#111827]">
                    {activeAccountObj.nickname || activeAccountObj.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                    {activeAccountObj.type || "Savings"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {activeAccountObj.bankName} · Account No:{" "}
                  <span className="font-semibold text-gray-800">
                    {activeAccountObj.accountNumber || "—"}
                  </span>{" "}
                  · Current Balance:{" "}
                  <span className="font-bold text-emerald-800">
                    {formatCurrency(activeAccountObj.balance)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* KPI Cards strictly for this account */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Account Cumulative Total */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Total Income ({activeAccountObj.nickname || activeAccountObj.name})
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                  {formatCurrency(currentKPIs.total)}
                </p>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-2">
                {currentKPIs.count} Recorded Inflow(s) in this account
              </p>
            </div>

            {/* Card 2: Account This Month Inflow */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  This Month's Inflow
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">
                  {formatCurrency(currentKPIs.monthTotal)}
                </p>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-2">
                Current Calendar Month ({activeAccountObj.nickname || activeAccountObj.name})
              </p>
            </div>

            {/* Card 3: Account Recurring Inflows */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                  Recurring Monthly Inflows
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1">
                  {formatCurrency(currentKPIs.recurringTotal)}
                </p>
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-2">
                {currentKPIs.recurringCount} Active Recurring Stream(s)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. SEARCH & FILTER BAR ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search income by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 shadow-xs"
          />
        </div>

        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#1F2937] outline-none focus:border-[#005B4F] shadow-xs cursor-pointer"
        >
          <option value="all">All Income Sources</option>
          {INCOME_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* ─── 6. ISOLATED ACCOUNT INCOME LIST ────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Loading income records...
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Income Entries Found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              {activeAccountObj
                ? `No income entries found for ${activeAccountObj.nickname || activeAccountObj.name}.`
                : "Add your salary, freelance earnings, or investment returns to credit your bank account."}
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Income Stream
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filteredIncomes.map((item) => (
              <IncomeRow
                key={item._id}
                item={item}
                onEdit={handleOpenEditModal}
                onDelete={setDeleteIncomeId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── 7. MODALS ─────────────────────────────────────────────────── */}
      <BankAccountRequiredModal
        isOpen={showAccountReqModal}
        onClose={() => setShowAccountReqModal(false)}
        workspace="personal"
        featureName="an income entry"
      />

      <ConfirmModal
        isOpen={Boolean(deleteIncomeId)}
        onClose={() => setDeleteIncomeId(null)}
        onConfirm={confirmDeleteIncome}
        title="Delete Income Entry"
        message="Are you sure you want to delete this income entry? (This will also reverse the credited balance from your bank account)"
        confirmText="Delete Income"
        isDanger={true}
      />

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">
                  {editItem ? "Edit Income Entry" : "Add Income Entry"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Record your earnings and credit your chosen bank account balance
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Income Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Salary, Consulting Project"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#005B4F]">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="75000"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    min="1"
                    className="w-full h-11 pl-8 pr-4 border border-[#D1D5DB] rounded-xl text-base font-extrabold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              {/* Deposit To Bank Account */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Credit To Specific Bank Account
                </label>
                <select
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-semibold outline-none focus:border-[#005B4F] bg-emerald-50/40 text-[#1F2937] cursor-pointer"
                >
                  <option value="" disabled>
                    Select Bank Account
                  </option>
                  {accounts.map((acc) => {
                    const displayName = acc.nickname || acc.name;
                    const maskedAcc = maskAccountNumber(acc.accountNumber);
                    const details = [
                      acc.bankName && acc.bankName !== displayName ? acc.bankName : null,
                      maskedAcc || null,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <option key={acc._id} value={acc.nickname || acc.name}>
                        {displayName} {details ? `(${details})` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Source / Category
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {INCOME_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                  >
                    {PAYMENT_METHODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Date Received
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>

              <div className="bg-[#F9FAFB] p-3.5 rounded-xl border border-gray-100 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.recurring}
                    onChange={(e) => setForm({ ...form, recurring: e.target.checked })}
                    className="w-4 h-4 rounded text-[#005B4F] focus:ring-[#005B4F] border-gray-300"
                  />
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#1F2937]">
                      Recurring Income Stream
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      Enable if this income is received on a regular cycle
                    </p>
                  </div>
                </label>

                {form.recurring && (
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1">
                      Recurrence Frequency
                    </label>
                    <select
                      value={form.frequency}
                      onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                      className="w-full h-10 px-3 border border-[#D1D5DB] rounded-xl text-xs outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                    >
                      {RECURRING_FREQUENCIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Notes & Reference (Optional)
                </label>
                <textarea
                  placeholder="e.g. Q3 bonus, Invoice #1042"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-sm font-semibold hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer"
                >
                  {editItem ? "Update Income" : "Add Income & Credit Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Income List Row
function IncomeRow({ item, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-3">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ArrowUpRight className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#1F2937]">{item.title}</p>
            {item.recurring && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
                <Repeat className="w-2.5 h-2.5" /> {item.frequency || "Monthly"}
              </span>
            )}
            {item.account && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <Landmark className="w-2.5 h-2.5" /> {item.account}
              </span>
            )}
          </div>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {item.source || item.category || "Salary"} · {item.paymentMethod || "Bank Transfer"} · {new Date(item.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-base sm:text-lg font-extrabold text-emerald-600">
          + {formatCurrency(item.amount)}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors cursor-pointer"
            title="Edit Income"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(item._id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Delete Income"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
