import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Landmark, CreditCard, Wallet, X, Building2, Check, Store } from "lucide-react";

const API = "http://localhost:5000/api";
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
        alert(errorData.message || "Failed to save corporate account.");
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadAccounts();
    } catch (err) {
      console.error("Submit business account error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this corporate banking account?")) return;
    try {
      await fetch(`${API}/accounts/${id}`, { method: "DELETE", headers: headers() });
      loadAccounts();
    } catch (err) {
      console.error("Delete business account error:", err);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Corporate Accounts & Ledgers</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Commercial checking accounts, merchant gateways, and payroll funds</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors shadow-lg shadow-[#1E232A]/20"
        >
          <Plus className="w-4 h-4" /> Add Corporate Account
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#1E232A] to-[#2B3138] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Liquid Corporate Balance</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 text-white tracking-tight">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-gray-400 mt-1">{accounts.length} Commercial Accounts Connected</p>
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-xs font-bold rounded-xl hover:bg-[#15191E] transition-colors"
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
                    <div className="w-10 h-10 rounded-xl bg-[#1E232A]/10 text-[#1E232A] flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1E232A] uppercase tracking-wider">
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
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#1E232A]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
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
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A] bg-white"
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
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A] mt-2"
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
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A] bg-white"
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono outline-none focus:border-[#1E232A] ${
                      touched.accountNumber && errors.accountNumber
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D1D5DB] focus:border-[#1E232A]"
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
                    className={`w-full h-11 px-3.5 border rounded-xl text-sm font-mono uppercase outline-none focus:border-[#1E232A] ${
                      touched.ifscCode && errors.ifscCode
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#D1D5DB] focus:border-[#1E232A]"
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
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
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
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
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
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#1E232A]"
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
                  className="px-6 py-2.5 rounded-xl bg-[#1E232A] text-white text-sm font-semibold hover:bg-[#15191E] transition-colors shadow-lg shadow-[#1E232A]/20"
                >
                  {editItem ? "Update Account" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
