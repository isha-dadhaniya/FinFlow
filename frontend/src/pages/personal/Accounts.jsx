import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Landmark,
  CreditCard,
  Wallet,
  X,
  Banknote,
  Smartphone,
  Building2,
  Check,
  ShieldCheck,
  Copy,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
} from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const POPULAR_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Union Bank of India",
  "Canara Bank",
  "IndusInd Bank",
  "IDFC FIRST Bank",
  "Yes Bank",
  "Federal Bank",
  "Bank of India",
  "Central Bank of India",
  "Indian Bank",
  "Other / Custom Bank",
];

const ACCOUNT_TYPES = [
  "Savings",
  "Salary",
  "Current",
  "Fixed Deposit",
  "Recurring Deposit",
  "NRI Account",
  "Cash Vault",
  "Credit Card",
  "Digital Wallet / UPI",
];

const DEPOSIT_CATEGORIES = [
  "Salary & Wages",
  "Freelance & Contract",
  "Business Income",
  "Investment Return",
  "Gift / Allowance",
  "Refund Received",
  "Inter-Account Transfer",
  "Other Deposit",
];

const WITHDRAW_CATEGORIES = [
  "Personal Expense",
  "Rent & Utilities",
  "Groceries & Food",
  "Loan / EMI Payment",
  "Credit Card Bill",
  "ATM Cash Withdrawal",
  "Inter-Account Transfer",
  "Other Withdrawal",
];

// Validation helpers
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const validateIfsc = (value) => {
  if (!value || !value.trim()) return "IFSC Code is required (11 characters)";
  const upper = value.trim().toUpperCase();
  if (upper.length !== 11) return "IFSC Code must be exactly 11 characters";
  if (!IFSC_REGEX.test(upper)) return "Invalid IFSC format (e.g. SBIN0001234)";
  return "";
};

const validateAccountNumber = (value) => {
  if (!value) return "";
  if (!/^\d+$/.test(value)) return "Account number must contain digits only";
  if (value.length < 8) return "Account number must be at least 8 digits";
  if (value.length > 16) return "Account number must not exceed 16 digits";
  return "";
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteAccId, setDeleteAccId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    name: "",
    bankName: "State Bank of India (SBI)",
    accountHolderName: "",
    type: "Savings",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    nickname: "",
    openingBalance: "",
  });

  useEffect(() => {
    loadAccounts();
    const handleUpdate = () => loadAccounts();
    window.addEventListener("finflow_data_updated", handleUpdate);
    return () => window.removeEventListener("finflow_data_updated", handleUpdate);
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/accounts?workspace=personal`, { headers: headers() });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load accounts error:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Adjust Funds (Deposit / Withdraw) State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAccount, setAdjustAccount] = useState(null);
  const [adjustType, setAdjustType] = useState("deposit"); // "deposit" | "withdraw"
  const [adjustForm, setAdjustForm] = useState({
    amount: "",
    category: DEPOSIT_CATEGORIES[0],
    reference: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Ledger History State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [ledgerAccount, setLedgerAccount] = useState(null);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState("all");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleOpenAdjustModal = (acc, type = "deposit") => {
    setAdjustAccount(acc);
    setAdjustType(type);
    setAdjustForm({
      amount: "",
      category: type === "deposit" ? DEPOSIT_CATEGORIES[0] : WITHDRAW_CATEGORIES[0],
      reference: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setAdjustError("");
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAccount) return;

    const numAmount = Number(adjustForm.amount);
    if (!numAmount || numAmount <= 0) {
      setAdjustError("Please enter a valid positive amount.");
      return;
    }

    if (adjustType === "withdraw" && (adjustAccount.balance || 0) < numAmount) {
      setAdjustError(
        `Insufficient funds. Current balance is ${formatCurrency(adjustAccount.balance)}, but attempting to withdraw ${formatCurrency(numAmount)}.`
      );
      return;
    }

    try {
      setAdjustSubmitting(true);
      setAdjustError("");

      const res = await fetch(`${API}/accounts/${adjustAccount._id}/adjust`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          type: adjustType,
          amount: numAmount,
          category: adjustForm.category,
          reference: adjustForm.reference,
          notes: adjustForm.notes,
          date: adjustForm.date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAdjustError(data.message || "Failed to process transaction.");
        return;
      }

      setShowAdjustModal(false);
      showToast(
        adjustType === "deposit"
          ? `Successfully deposited ${formatCurrency(numAmount)} into ${adjustAccount.nickname || adjustAccount.name}!`
          : `Successfully deducted ${formatCurrency(numAmount)} from ${adjustAccount.nickname || adjustAccount.name}!`
      );
      await loadAccounts();
    } catch (err) {
      console.error("Adjust account error:", err);
      setAdjustError("Server error processing adjustment.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleOpenLedgerModal = async (acc) => {
    setLedgerAccount(acc);
    setShowLedgerModal(true);
    setLedgerLoading(true);
    setLedgerFilter("all");
    try {
      const res = await fetch(`${API}/accounts/${acc._id}/transactions`, { headers: headers() });
      const data = await res.json();
      setLedgerTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    } catch (err) {
      console.error("Load ledger error:", err);
      setLedgerTransactions([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({
      name: "",
      bankName: "State Bank of India (SBI)",
      accountHolderName: "",
      type: "Savings",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      nickname: "",
      openingBalance: "",
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditItem(acc);
    setForm({
      name: acc.name || "",
      bankName: acc.bankName || "State Bank of India (SBI)",
      accountHolderName: acc.accountHolderName || "",
      type: acc.type || "Savings",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      branchName: acc.branchName || "",
      nickname: acc.nickname || "",
      openingBalance: String(acc.balance || ""),
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  // Compute whether the form has validation errors that should block submission
  const hasValidationErrors = () => {
    const ifscErr = validateIfsc(form.ifscCode);
    const accErr = form.accountNumber ? validateAccountNumber(form.accountNumber) : "";
    // Block if there are format errors, or if required validated fields are invalid length
    if (ifscErr) return true;
    if (accErr) return true;
    if (form.accountNumber && (form.accountNumber.length < 8 || form.accountNumber.length > 16)) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run all validations before submission
    const newErrors = {};
    const ifscErr = validateIfsc(form.ifscCode);
    if (ifscErr) newErrors.ifscCode = ifscErr;

    if (form.accountNumber) {
      const accErr = validateAccountNumber(form.accountNumber);
      if (accErr) newErrors.accountNumber = accErr;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ ifscCode: true, accountNumber: true });
      return;
    }

    try {
      const displayName = form.nickname.trim() || `${form.bankName} (${form.type})`;
      const payload = {
        name: displayName,
        bankName: form.bankName,
        accountHolderName: form.accountHolderName.trim(),
        type: form.type,
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        branchName: form.branchName.trim(),
        nickname: form.nickname.trim(),
        balance: Number(form.openingBalance) || 0,
        currency: "INR",
        workspace: "personal",
      };

      const url = editItem ? `${API}/accounts/${editItem._id}` : `${API}/accounts`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadAccounts();
    } catch (err) {
      console.error("Submit account error:", err);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteAccId) return;
    try {
      await fetch(`${API}/accounts/${deleteAccId}`, { method: "DELETE", headers: headers() });
      setDeleteAccId(null);
      loadAccounts();
    } catch (err) {
      console.error("Delete account error:", err);
    }
  };

  const maskAccountNumber = (accNum) => {
    if (!accNum) return "•••• •••• ••••";
    const cleaned = accNum.replace(/\s+/g, "");
    if (cleaned.length <= 4) return `•••• ${cleaned}`;
    return `•••• •••• ${cleaned.slice(-4)}`;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#005B4F] text-white rounded-xl shadow-xl text-xs font-semibold animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} className="ml-2 hover:opacity-80 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Bank Accounts</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage your bank accounts, savings, and liquid balances</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {accounts.length > 0 && (
            <button
              onClick={() => handleOpenAdjustModal(accounts[0], "deposit")}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 text-[#005B4F] border border-emerald-200 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" /> Deposit / Withdraw Funds
            </button>
          )}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>
      </div>

      {/* Hero Total Balance Banner */}
      <div className="bg-gradient-to-r from-[#005B4F] to-[#008573] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total Net Balance</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-white/70 mt-1">{accounts.length} Active Bank Account{accounts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
          <Landmark className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Accounts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)
        ) : accounts.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Bank Accounts Added Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Add your primary savings, salary, or current accounts to track balances and transactions in one place.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Your First Account
            </button>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc._id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between relative group"
            >
              <div>
                {/* Card Header: Bank Name & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#005B4F] uppercase tracking-wider">
                        {acc.bankName || "Bank"}
                      </p>
                      <h3 className="text-sm font-extrabold text-[#1F2937] leading-tight">
                        {acc.nickname || acc.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors"
                      title="Edit Account Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteAccId(acc._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="bg-[#F9FAFB] rounded-xl p-3 space-y-1.5 my-3 text-xs border border-gray-100">
                  <div className="flex justify-between items-center text-[#6B7280]">
                    <span>Account No:</span>
                    <span className="font-mono font-semibold text-[#1F2937] tracking-wider">
                      {maskAccountNumber(acc.accountNumber)}
                    </span>
                  </div>

                  {acc.ifscCode && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>IFSC Code:</span>
                      <span className="font-mono font-semibold text-[#1F2937]">
                        {acc.ifscCode}
                      </span>
                    </div>
                  )}

                  {acc.accountHolderName && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>Holder:</span>
                      <span className="font-medium text-[#1F2937] truncate max-w-[140px]">
                        {acc.accountHolderName}
                      </span>
                    </div>
                  )}

                  {acc.branchName && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>Branch:</span>
                      <span className="text-[#1F2937] truncate max-w-[140px]">
                        {acc.branchName}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Account Type Tag & Balance */}
              <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700">
                    {acc.type || "Savings"}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Available Balance</p>
                </div>
                <p className="text-xl font-extrabold text-[#1F2937]">
                  {formatCurrency(acc.balance)}
                </p>
              </div>

              {/* Quick Actions: Add Money, Subtract Money, Ledger */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(acc, "deposit")}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-emerald-50 hover:bg-[#005B4F] text-[#005B4F] hover:text-white font-bold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Deposit / Add Money into Account"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ Deposit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAdjustModal(acc, "withdraw")}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  title="Withdraw / Deduct Money from Account"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>− Withdraw</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenLedgerModal(acc)}
                  className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-gray-50 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  title="View Account Ledger & History"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ledger</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Bank Account Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">
                  {editItem ? "Edit Bank Account" : "Add Bank Account"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Enter your official banking credentials and opening balance
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Bank Name
                </label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 bg-white"
                >
                  <option value="" disabled>Select Bank</option>
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {form.bankName === "Other / Custom Bank" && (
                  <input
                    type="text"
                    placeholder="Enter custom bank name"
                    value={form.customBankName}
                    onChange={(e) => setForm({ ...form, customBankName: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] mt-2"
                  />
                )}
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={form.accountHolderName}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                />
              </div>

              {/* Account Type & Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10 bg-white"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="********1234"
                    inputMode="numeric"
                    maxLength={16}
                    value={form.accountNumber}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 16);
                      setForm({ ...form, accountNumber: digitsOnly });
                      setTouched({ ...touched, accountNumber: true });
                      setErrors({ ...errors, accountNumber: validateAccountNumber(digitsOnly) });
                    }}
                    onBlur={() => {
                      setTouched({ ...touched, accountNumber: true });
                      setErrors({ ...errors, accountNumber: validateAccountNumber(form.accountNumber) });
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 16);
                      setForm({ ...form, accountNumber: pasted });
                      setTouched({ ...touched, accountNumber: true });
                      setErrors({ ...errors, accountNumber: validateAccountNumber(pasted) });
                    }}
                    required
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-[#005B4F]/10 ${
                      touched.accountNumber && errors.accountNumber
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D1D5DB] focus:border-[#005B4F]"
                    }`}
                  />
                  {touched.accountNumber && errors.accountNumber && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.accountNumber}</p>
                  )}
                </div>
              </div>

              {/* IFSC Code & Branch Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    maxLength={11}
                    value={form.ifscCode}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase().slice(0, 11);
                      setForm({ ...form, ifscCode: upper });
                      setTouched({ ...touched, ifscCode: true });
                      setErrors({ ...errors, ifscCode: validateIfsc(upper) });
                    }}
                    onBlur={() => {
                      setTouched({ ...touched, ifscCode: true });
                      setErrors({ ...errors, ifscCode: validateIfsc(form.ifscCode) });
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
                      setForm({ ...form, ifscCode: pasted });
                      setTouched({ ...touched, ifscCode: true });
                      setErrors({ ...errors, ifscCode: validateIfsc(pasted) });
                    }}
                    required
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-[#005B4F]/10 ${
                      touched.ifscCode && errors.ifscCode
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D1D5DB] focus:border-[#005B4F]"
                    }`}
                  />
                  {touched.ifscCode && errors.ifscCode && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">{errors.ifscCode}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    placeholder="Surat Main Branch"
                    value={form.branchName}
                    onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                  />
                </div>
              </div>

              {/* Nickname & Opening Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Nickname
                  </label>
                  <input
                    type="text"
                    placeholder="Personal Savings"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Opening Balance (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="50000"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    required
                    min="0"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                  />
                </div>
              </div>

              {/* Modal Footer Actions: Cancel & Add Account */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hasValidationErrors()}
                  className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors shadow-lg shadow-[#005B4F]/20 ${
                    hasValidationErrors()
                      ? "bg-[#005B4F]/50 cursor-not-allowed"
                      : "bg-[#005B4F] hover:bg-[#004A40]"
                  }`}
                >
                  {editItem ? "Update Account" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit & Withdraw (Adjust Funds) Modal */}
      {showAdjustModal && adjustAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowAdjustModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">
                  {adjustType === "deposit" ? "Deposit Funds (Add Money)" : "Withdraw Funds (Subtract Money)"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {adjustAccount.nickname || adjustAccount.name} · {adjustAccount.bankName}
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setAdjustType("deposit");
                  setAdjustForm((prev) => ({ ...prev, category: DEPOSIT_CATEGORIES[0] }));
                  setAdjustError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adjustType === "deposit"
                    ? "bg-[#005B4F] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>+ Deposit (Add Money)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustType("withdraw");
                  setAdjustForm((prev) => ({ ...prev, category: WITHDRAW_CATEGORIES[0] }));
                  setAdjustError("");
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adjustType === "withdraw"
                    ? "bg-rose-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>− Withdraw (Subtract Money)</span>
              </button>
            </div>

            {/* Balance Preview Card */}
            <div
              className={`p-4 rounded-xl border mb-5 ${
                adjustType === "deposit"
                  ? "bg-emerald-50/70 border-emerald-100 text-emerald-900"
                  : "bg-rose-50/70 border-rose-100 text-rose-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-500">Current Balance:</span>
                <span className="font-mono text-gray-900 font-bold">{formatCurrency(adjustAccount.balance)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className={adjustType === "deposit" ? "text-emerald-700" : "text-rose-700"}>
                  {adjustType === "deposit" ? "Funds to Deposit:" : "Funds to Withdraw:"}
                </span>
                <span className="font-mono font-bold">
                  {adjustType === "deposit" ? "+ " : "− "}
                  {formatCurrency(Number(adjustForm.amount) || 0)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-sm font-extrabold">
                <span>Resulting Balance:</span>
                <span
                  className={`font-mono text-base ${
                    adjustType === "withdraw" && (adjustAccount.balance || 0) < Number(adjustForm.amount)
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatCurrency(
                    adjustType === "deposit"
                      ? (adjustAccount.balance || 0) + (Number(adjustForm.amount) || 0)
                      : (adjustAccount.balance || 0) - (Number(adjustForm.amount) || 0)
                  )}
                </span>
              </div>
            </div>

            {adjustError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={adjustForm.amount}
                    onChange={(e) => {
                      setAdjustForm({ ...adjustForm, amount: e.target.value });
                      setAdjustError("");
                    }}
                    required
                    min="1"
                    className="w-full h-11 pl-8 pr-3.5 border border-[#D1D5DB] rounded-xl text-base font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    {adjustType === "deposit" ? "Source / Category" : "Purpose / Category"}
                  </label>
                  <select
                    value={adjustForm.category}
                    onChange={(e) => setAdjustForm({ ...adjustForm, category: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-xs font-semibold outline-none focus:border-[#005B4F] bg-white"
                  >
                    {(adjustType === "deposit" ? DEPOSIT_CATEGORIES : WITHDRAW_CATEGORIES).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Reference / UTR / Cheque No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI / Ref #2093"
                    value={adjustForm.reference}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reference: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-xs font-mono outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={adjustForm.date}
                  onChange={(e) => setAdjustForm({ ...adjustForm, date: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-xs outline-none focus:border-[#005B4F] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  placeholder="Optional details for tracking..."
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-xl text-xs outline-none focus:border-[#005B4F] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 ${
                    adjustType === "deposit"
                      ? "bg-[#005B4F] hover:bg-[#004A40] shadow-[#005B4F]/20"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  }`}
                >
                  {adjustSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </>
                  ) : adjustType === "deposit" ? (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Confirm Deposit (+{formatCurrency(Number(adjustForm.amount) || 0)})
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5" /> Confirm Withdrawal (−{formatCurrency(Number(adjustForm.amount) || 0)})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Ledger & Transaction History Modal */}
      {showLedgerModal && ledgerAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowLedgerModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#1F2937]">
                    {ledgerAccount.nickname || ledgerAccount.name}
                  </h2>
                  <p className="text-xs text-[#6B7280]">
                    {ledgerAccount.bankName} · {maskAccountNumber(ledgerAccount.accountNumber)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Available Balance</p>
                  <p className="text-lg font-extrabold text-[#1F2937]">{formatCurrency(ledgerAccount.balance)}</p>
                </div>
                <button
                  onClick={() => setShowLedgerModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Total Activity</p>
                <p className="text-sm font-extrabold text-[#1F2937] mt-0.5">{ledgerTransactions.length} Records</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Total Inflow (+)</p>
                <p className="text-sm font-extrabold text-emerald-800 mt-0.5">
                  {formatCurrency(
                    ledgerTransactions
                      .filter((t) => t.type === "income")
                      .reduce((s, t) => s + (t.amount || 0), 0)
                  )}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <p className="text-[10px] text-rose-700 font-bold uppercase">Total Outflow (−)</p>
                <p className="text-sm font-extrabold text-rose-800 mt-0.5">
                  {formatCurrency(
                    ledgerTransactions
                      .filter((t) => t.type === "expense")
                      .reduce((s, t) => s + (t.amount || 0), 0)
                  )}
                </p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                {["all", "deposit", "withdraw"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLedgerFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      ledgerFilter === f
                        ? "bg-white text-[#1F2937] shadow-xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {f === "all" ? "All" : f === "deposit" ? "Deposits (+)" : "Withdrawals (−)"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowLedgerModal(false);
                    handleOpenAdjustModal(ledgerAccount, "deposit");
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#005B4F] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" /> + Deposit
                </button>
                <button
                  onClick={() => {
                    setShowLedgerModal(false);
                    handleOpenAdjustModal(ledgerAccount, "withdraw");
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> − Withdraw
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[350px]">
              {ledgerLoading ? (
                <div className="p-8 text-center text-xs text-gray-400">Loading ledger records...</div>
              ) : (
                (() => {
                  const filtered = ledgerTransactions.filter((t) => {
                    if (ledgerFilter === "deposit" && t.type !== "income") return false;
                    if (ledgerFilter === "withdraw" && t.type !== "expense") return false;
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-600">No transactions recorded yet</p>
                        <p className="text-[11px] text-gray-400 mt-1 mb-4">
                          Perform a deposit or withdrawal to start tracking transactions for this bank account.
                        </p>
                        <button
                          onClick={() => {
                            setShowLedgerModal(false);
                            handleOpenAdjustModal(ledgerAccount, "deposit");
                          }}
                          className="px-3.5 py-2 bg-[#005B4F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                        >
                          + Deposit Initial Funds
                        </button>
                      </div>
                    );
                  }

                  return filtered.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            tx.type === "income"
                              ? "bg-emerald-100/70 text-emerald-700"
                              : "bg-rose-100/70 text-rose-700"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1F2937] leading-tight">{tx.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(tx.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            · <span className="text-gray-500 font-medium">{tx.category || "General"}</span>
                            {tx.notes && ` · ${tx.notes}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-extrabold font-mono ${
                            tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {tx.type === "income" ? "+ " : "− "}
                          {formatCurrency(tx.amount)}
                        </p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                          {tx.type === "income" ? "Credit" : "Debit"}
                        </span>
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteAccId)}
        onClose={() => setDeleteAccId(null)}
        onConfirm={confirmDeleteAccount}
        title="Delete Bank Account"
        message="Are you sure you want to delete this bank account permanently? This action cannot be undone."
        confirmText="Delete Account"
        isDanger={true}
      />
    </div>
  );
}
