import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Landmark, CreditCard, Wallet, X, Building2, Check, Users } from "lucide-react";

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
  "Other / Custom Bank",
];

const ACCOUNT_TYPES = [
  "Joint Savings",
  "Family Current",
  "Household Cash Vault",
  "Emergency Fund",
  "Child Education Fund",
  "UPI Joint",
];

export default function FamilyAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({
    bankName: "HDFC Bank",
    customBankName: "",
    accountHolderName: "Family Joint",
    type: "Joint Savings",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    nickname: "Family Savings Pool",
    openingBalance: "100000",
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/accounts?workspace=family`, { headers: headers() });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Family accounts load error:", err);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({
      bankName: "HDFC Bank",
      customBankName: "",
      accountHolderName: "Family Joint",
      type: "Joint Savings",
      accountNumber: "",
      ifscCode: "",
      branchName: "",
      nickname: "Family Savings Pool",
      openingBalance: "100000",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditItem(acc);
    const isCustom = acc.bankName && !POPULAR_BANKS.includes(acc.bankName);
    setForm({
      bankName: isCustom ? "Other / Custom Bank" : (acc.bankName || "HDFC Bank"),
      customBankName: isCustom ? acc.bankName : "",
      accountHolderName: acc.accountHolderName || "Family Joint",
      type: acc.type || "Joint Savings",
      accountNumber: acc.accountNumber || "",
      ifscCode: acc.ifscCode || "",
      branchName: acc.branchName || "",
      nickname: acc.nickname || acc.name || "",
      openingBalance: String(acc.balance !== undefined ? acc.balance : acc.openingBalance || ""),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        workspace: "family",
      };

      const url = editItem ? `${API}/accounts/${editItem._id}` : `${API}/accounts`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to save joint account.");
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadAccounts();
    } catch (err) {
      console.error("Submit family account error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this joint family account?")) return;
    try {
      await fetch(`${API}/accounts/${id}`, { method: "DELETE", headers: headers() });
      loadAccounts();
    } catch (err) {
      console.error("Delete family account error:", err);
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
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Bank Accounts</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Joint checking, emergency funds, and shared savings pools</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
        >
          <Plus className="w-4 h-4" /> Add Joint Account
        </button>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#21867A] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total Family Reserves</p>
          <p className="text-3xl sm:text-4xl font-extrabold mt-1 tracking-tight">{formatCurrency(totalBalance)}</p>
          <p className="text-xs text-white/70 mt-1">{accounts.length} Joint Account{accounts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xs ring-1 ring-white/20">
          <Landmark className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse" />)
        ) : accounts.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Joint Family Accounts Added</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Connect your shared household accounts or emergency funds to track family wealth together.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-xs font-bold rounded-xl hover:bg-[#21867A] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Joint Account
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
                    <div className="w-10 h-10 rounded-xl bg-[#2A9D8F]/10 text-[#2A9D8F] flex items-center justify-center font-bold">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2A9D8F] uppercase tracking-wider">
                        {acc.bankName || "Joint Bank"}
                      </p>
                      <h3 className="text-sm font-extrabold text-[#1F2937] leading-tight">
                        {acc.nickname || acc.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(acc)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2A9D8F]"
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
                  {acc.branchName && (
                    <div className="flex justify-between items-center text-[#6B7280]">
                      <span>Branch:</span>
                      <span className="text-[#1F2937] truncate max-w-[140px]">{acc.branchName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-end justify-between">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#2A9D8F]/10 text-[#2A9D8F]">
                    {acc.type || "Joint Savings"}
                  </span>
                  <p className="text-[10px] text-[#9CA3AF] mt-1">Pool Balance</p>
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
                  {editItem ? "Edit Joint Bank Account" : "Add Joint Bank Account"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Enter family bank credentials and initial pool balance</p>
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
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F] bg-white"
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
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F] mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Family Joint (e.g. Krutin & Parents)"
                  value={form.accountHolderName}
                  onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Account Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F] bg-white"
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
                    value={form.accountNumber}
                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-mono outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">IFSC Code</label>
                  <input
                    type="text"
                    placeholder="SBIN0001234"
                    value={form.ifscCode}
                    onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-mono uppercase outline-none focus:border-[#2A9D8F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    placeholder="Surat Main Branch"
                    value={form.branchName}
                    onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Nickname</label>
                  <input
                    type="text"
                    placeholder="Family Savings Pool"
                    value={form.nickname}
                    onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Opening Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="100000"
                    value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    required
                    min="0"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#2A9D8F]"
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
                  className="px-6 py-2.5 rounded-xl bg-[#2A9D8F] text-white text-sm font-semibold hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
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
