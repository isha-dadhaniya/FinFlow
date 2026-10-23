import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Landmark,
  CreditCard,
  Wallet,
  X,
  Building2,
  Check,
  Store,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import ConfirmModal, { AlertModal } from "../../components/common/ConfirmModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const POPULAR_BANKS = [
  "HDFC Bank (Corporate)",
  "ICICI Bank (Commercial)",
  "State Bank of India (Corporate)",
  "Axis Bank (Business)",
  "Kotak Mahindra Bank (Corporate)",
  "Punjab National Bank",
  "Bank of Baroda",
  "IndusInd Bank (Corporate)",
  "IDFC FIRST Bank (Business)",
  "Other / Custom Bank",
];

const ACCOUNT_TYPES = [
  "Corporate Current Account",
  "Merchant Settlement Account",
  "Petty Cash Drawer",
  "Tax Escrow Account",
  "Payroll Account",
  "Corporate Credit Line",
];

const DEPOSIT_CATEGORIES = [
  "Client Invoice Settlement",
  "Capital / Founder Infusion",
  "Vendor / Supplier Refund",
  "Inter-Account Transfer",
  "Cash Deposit",
  "Investment / Dividend Return",
  "Other Revenue",
];

const WITHDRAW_CATEGORIES = [
  "Vendor / Supplier Payout",
  "Director / Owner Withdrawal",
  "Operating & Utility Expense",
  "Tax Escrow / GST Payment",
  "Payroll / Salary Disbursement",
  "Bank Service Charges",
  "Inter-Account Transfer",
  "Cash Withdrawal",
  "Other Disbursement",
];

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const validateIfsc = (value) => {
  if (!value || !value.trim()) return "IFSC Code is required (11 characters)";
  const upper = value.trim().toUpperCase();
  if (upper.length !== 11) return "IFSC Code must be exactly 11 characters";
  if (!IFSC_REGEX.test(upper)) return "Invalid IFSC format (e.g. HDFC0000123)";
  return "";
};

const validateAccountNumber = (value) => {
  if (!value) return "";
  if (!/^\d+$/.test(value)) return "Account number must contain digits only";
  if (value.length < 8) return "Account number must be at least 8 digits";
  if (value.length > 16) return "Account number must not exceed 16 digits";
  return "";
};

export default function BusinessAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteAccountId, setDeleteAccountId] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    bankName: "HDFC Bank (Corporate)",
    customBankName: "",
    accountHolderName: "FinFlow Technologies Pvt Ltd",
    type: "Corporate Current Account",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    nickname: "Primary Operating Current Account",
    openingBalance: "500000",
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
      const res = await fetch(`${API}/accounts?workspace=business`, { headers: headers() });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Business accounts load error:", err);
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
  const [ledgerSearch, setLedgerSearch] = useState("");

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
      window.dispatchEvent(new Event("finflow_data_updated"));
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
    setLedgerSearch("");
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
      bankName: "HDFC Bank (Corporate)",
      customBankName: "",
      accountHolderName: "FinFlow Technologies Pvt Ltd",
      type: "Corporate Current Account",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      nickname: "Primary Operating Current Account",
      openingBalance: "500000",
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditItem(acc);
    const isCustom = acc.bankName && !POPULAR_BANKS.includes(acc.bankName);
    setForm({
      bankName: isCustom ? "Other / Custom Bank" : (acc.bankName || "HDFC Bank (Corporate)"),
      customBankName: isCustom ? acc.bankName : "",
      accountHolderName: acc.accountHolderName || "FinFlow Technologies Pvt Ltd",
      type: acc.type || "Corporate Current Account",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      branchName: acc.branchName || "",
      nickname: acc.nickname || acc.name || "",
      openingBalance: String(acc.balance !== undefined ? acc.balance : acc.openingBalance || ""),
    });
    setErrors({});
    setTouched({});
    setShowModal(true);
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
      const finalBankName = form.bankName === "Other / Custom Bank" ? form.customBankName.trim() || "Custom Bank" : form.bankName;
      const accountName = form.nickname.trim() || `${finalBankName} (${form.type})`;
      const numBalance = Number(form.openingBalance) || 0;

      const payload = {
        bankName: finalBankName,
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifscCode: form.ifscCode.trim().toUpperCase(),
        branchName: form.branchName.trim(),
        nickname: form.nickname.trim(),
        name: accountName,
        type: form.type,
        balance: numBalance,
        openingBalance: numBalance,
        workspace: "business",
      };

      const url = editItem ? `${API}/accounts/${editItem._id}` : `${API}/accounts`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setAlertMessage(errorData.message || "Failed to save corporate account.");
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadAccounts();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Submit business account error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteAccountId) return;
    try {
      await fetch(`${API}/accounts/${deleteAccountId}`, { method: "DELETE", headers: headers() });
      loadAccounts();
      window.dispatchEvent(new Event("finflow_data_updated"));
    } catch (err) {
      console.error("Delete business account error:", err);
    } finally {
      setDeleteAccountId(null);
    }
  };

  const maskAccountNumber = (accNum) => {
    if (!accNum) return "•••• •••• ••••";
    const cleaned = accNum.replace(/\s+/g, "");
    if (cleaned.length <= 4) return `•••• ${cleaned}`;
    return `•••• •••• ${cleaned.slice(-4)}`;
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Corporate Accounts & Ledgers</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Commercial checking accounts, merchant gateways, and payroll funds</p>
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
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Corporate Account
          </button>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#005B4F] to-[#007D6D] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Liquid Corporate Balance</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-white tracking-tight">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-emerald-100/80 mt-1">{accounts.length} Commercial Accounts Connected</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
          <Building2 className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)
        ) : accounts.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Corporate Accounts Connected</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Add your company checking accounts, merchant gateways, and tax escrow ledgers.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Corporate Account
            </button>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc._id}
              className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#005B4F] uppercase tracking-wider">
                        {acc.bankName || "Corporate Bank"}
                      </p>
                      <h3 className="text-sm font-extrabold text-[#1F2937] leading-tight">
                        {acc.nickname || acc.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteAccountId(acc._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#F9FAFB] rounded-xl p-3 space-y-1.5 my-3 text-xs border border-gray-100">
                  <div className="flex justify-between items-center text-[#6B7280]">
                    <span>Account No:</span>
                    <span className="font-mono font-semibold text-[#1F2937]">
                      {maskAccountNumber(acc.accountNumber)}
                    </span>
                  </div>
                  {acc.ifscCode && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>IFSC Code:</span>
                      <span className="font-mono font-semibold text-[#1F2937]">{acc.ifscCode}</span>
                    </div>
                  )}
                  {acc.accountHolderName && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>Entity:</span>
                      <span className="font-medium text-[#1F2937] truncate max-w-[140px]">{acc.accountHolderName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-800">
                    {acc.type || "Current Account"}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Book Balance</p>
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">
                  {editItem ? "Edit Corporate Account" : "Add Corporate Bank Account"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Enter commercial banking details and initial ledger balance</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Bank Name</label>
                <select
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
                >
                  <option value="" disabled>Select Bank</option>
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {form.bankName === "Other / Custom Bank" && (
                  <input
                    type="text"
                    placeholder="Enter corporate bank name"
                    value={form.customBankName}
                    onChange={(e) => setForm({ ...form, customBankName: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Holder / Entity Name</label>
                <input
                  type="text"
                  placeholder="FinFlow Technologies Pvt Ltd"
                  value={form.accountHolderName}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Number</label>
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono outline-none focus:border-[#005B4F] ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="HDFC0000123"
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono uppercase outline-none focus:border-[#005B4F] ${
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
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    placeholder="Surat Financial District"
                    value={form.branchName}
                    onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Nickname / Ledger Label</label>
                  <input
                    type="text"
                    placeholder="Primary Operating Current Account"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Opening Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    required
                    min="0"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-sm font-semibold hover:bg-[#004A40] transition-colors shadow-md shadow-[#005B4F]/20 cursor-pointer"
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
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
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
                <span className="text-gray-500">Current Book Balance:</span>
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
                    placeholder="e.g. 50000"
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
                    placeholder="e.g. UTR9832104"
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
                  Audit Notes / Description
                </label>
                <textarea
                  placeholder="Additional context for corporate books and financial audit..."
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
                  <Building2 className="w-5 h-5" />
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
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Book Balance</p>
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
                        <p className="text-xs font-bold text-gray-600">No ledger transactions found</p>
                        <p className="text-[11px] text-gray-400 mt-1 mb-4">
                          Perform a deposit or withdrawal to start tracking transactions for this corporate ledger.
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

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteAccountId)}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={confirmDelete}
        title="Delete Corporate Account"
        message="Are you sure you want to delete this corporate banking account? All transaction records will be preserved."
        confirmText="Delete Account"
        isDanger={true}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={Boolean(alertMessage)}
        onClose={() => setAlertMessage("")}
        title="Corporate Account Notice"
        message={alertMessage}
        type="warning"
      />
    </div>
  );
}
