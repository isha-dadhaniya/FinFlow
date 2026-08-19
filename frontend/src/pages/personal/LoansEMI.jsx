import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, BadgeDollarSign, X, Check, ChevronDown, ChevronUp, Landmark, ShieldCheck, BellRing, Zap, Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import BankAccountRequiredModal from "../../components/common/BankAccountRequiredModal";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const LOAN_TYPES = [
  "Car Loan",
  "Home Mortgage",
  "Personal Loan",
  "Education Loan",
  "Business & Equipment",
  "Two-Wheeler Loan",
  "Gold Loan",
  "Other Financing",
];

export default function LoansEMI() {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAccountReqModal, setShowAccountReqModal] = useState(false);
  const [deleteLoanId, setDeleteLoanId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({
    name: "",
    loanType: "Personal Loan",
    lender: "",
    principal: "",
    interestRate: "",
    tenure: "",
    emi: "",
    startDate: new Date().toISOString().split("T")[0],
    paymentAccount: "",
    autoDebit: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [loansRes, accRes] = await Promise.allSettled([
        fetch(`${API}/loans?workspace=personal`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=personal`, { headers: headers() }),
      ]);

      if (loansRes.status === "fulfilled" && loansRes.value.ok) {
        const data = await loansRes.value.json();
        setLoans(Array.isArray(data) ? data : []);
      }
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accData = await accRes.value.json();
        const accArr = Array.isArray(accData) ? accData : [];
        setAccounts(accArr);
        if (accArr.length > 0 && !form.paymentAccount) {
          setForm((prev) => ({
            ...prev,
            paymentAccount: accArr[0]?.nickname || accArr[0]?.name || accArr[0]?.bankName || "",
          }));
        }
      }
    } catch (err) {
      console.error("Load loans error:", err);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const P = Number(form.principal);
    const R = Number(form.interestRate) / 12 / 100;
    const N = Number(form.tenure);
    if (P > 0 && R > 0 && N > 0) {
      const emiVal = Math.round((P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1));
      setForm((prev) => ({ ...prev, emi: String(emiVal) }));
    } else if (P > 0 && N > 0) {
      setForm((prev) => ({ ...prev, emi: String(Math.round(P / N)) }));
    }
  }, [form.principal, form.interestRate, form.tenure]);

  const handleOpenAddModal = () => {
    if (accounts.length === 0) {
      setShowAccountReqModal(true);
      return;
    }
    const defaultAcc = accounts[0]?.nickname || accounts[0]?.name || accounts[0]?.bankName || "";
    setErrorMessage("");
    setForm({
      name: "",
      loanType: "Personal Loan",
      lender: "",
      principal: "",
      interestRate: "",
      tenure: "",
      emi: "",
      startDate: new Date().toISOString().split("T")[0],
      paymentAccount: defaultAcc,
      autoDebit: true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.paymentAccount) {
      setErrorMessage("Please select a Repayment Bank Account.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const payload = {
        name: form.name.trim(),
        loanType: form.loanType,
        lender: form.lender.trim(),
        principal: Number(form.principal),
        interestRate: Number(form.interestRate),
        tenure: Number(form.tenure),
        emi: Number(form.emi),
        startDate: form.startDate,
        paymentAccount: form.paymentAccount,
        autoDebit: form.autoDebit,
        emiDay: 1,
        workspace: "personal",
      };

      const res = await fetch(`${API}/loans`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.message || "Failed to create loan. Please check your inputs.");
        return;
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Submit loan error:", err);
      setErrorMessage("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const markEmiPaid = async (loanId, emiIndex) => {
    try {
      const res = await fetch(`${API}/loans/${loanId}/emi/${emiIndex}/pay`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ paymentMethod: "Bank Transfer" }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("EMI pay error:", err);
    }
  };

  const confirmDeleteLoan = async () => {
    if (!deleteLoanId) return;
    try {
      await fetch(`${API}/loans/${deleteLoanId}`, { method: "DELETE", headers: headers() });
      setDeleteLoanId(null);
      loadData();
    } catch (err) {
      console.error("Delete loan error:", err);
    }
  };

  const totalPrincipal = loans.reduce((s, l) => s + (l.principal || 0), 0);
  const totalOutstanding = loans.reduce((s, l) => s + (l.outstandingAmount || 0), 0);
  const totalMonthlyEmi = loans.filter((l) => l.status === "active").reduce((s, l) => s + (l.emi || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Loans & EMI Manager</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Auto-debit permissions, 1st-of-the-month schedules, and bank balance deduction
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20"
        >
          <Plus className="w-4 h-4" /> Add Loan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Borrowed Principal</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">{formatCurrency(totalPrincipal)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{loans.length} Loan Facilities</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Remaining Outstanding</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">Pending Principal + Interest</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Monthly EMI Commitment</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#005B4F] mt-1">{formatCurrency(totalMonthlyEmi)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">Due on 1st of Every Month</p>
        </div>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading loan records...</div>
        ) : loans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-xs">
            <BadgeDollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Loans or Financing Facilities</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Add home loans, car loans, or personal financing to track amortization schedules and automate EMI deductions.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Your First Loan
            </button>
          </div>
        ) : (
          loans.map((loan) => {
            const isExpanded = expanded === loan._id;
            const progress = loan.tenure > 0 ? (loan.paidEmis / loan.tenure) * 100 : 0;
            const isComplete = loan.status === "completed";

            return (
              <div
                key={loan._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs hover:border-[#005B4F]/40 transition-all"
              >
                <div
                  className="p-5 sm:p-6 cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : loan._id)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold text-xl shrink-0">
                        💳
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-[#1F2937]">{loan.name}</h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">
                            {loan.loanType}
                          </span>
                        </div>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          Lender: {loan.lender || "Bank"} · Repayment Account: <span className="font-semibold text-emerald-800">{loan.paymentAccount || "Default Bank"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {loan.autoDebit ? (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-600" /> Auto-Debit Active (1st of Mo)
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5 text-amber-600" /> Manual Approval (1st of Mo)
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteLoanId(loan._id);
                        }}
                        className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Loan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9FAFB] rounded-xl p-4 border border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Principal Amount</p>
                      <p className="text-base font-extrabold text-[#1F2937] mt-0.5">{formatCurrency(loan.principal)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">{loan.interestRate}% Int. Rate</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Monthly Installment</p>
                      <p className="text-base font-extrabold text-[#005B4F] mt-0.5">{formatCurrency(loan.emi)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Due on 1st every month</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Repayment Progress</p>
                      <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                        {loan.paidEmis || 0} / {loan.tenure} Paid
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">{loan.remainingEmis || 0} Months Left</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Outstanding Balance</p>
                      <p className="text-base font-extrabold text-amber-700 mt-0.5">{formatCurrency(loan.outstandingAmount)}</p>
                      <p className="text-[10px] text-[#9CA3AF]">Total: {formatCurrency(loan.totalPayable)}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="w-full h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isComplete ? "bg-emerald-500" : "bg-[#005B4F]"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#6B7280]">
                      <span>{Math.round(progress)}% Repaid</span>
                      <span>{loan.remainingEmis} Months Remaining</span>
                    </div>
                  </div>
                </div>

                {isExpanded && loan.emiSchedule && (
                  <div className="border-t border-[#E5E7EB] px-5 sm:px-6 py-5 bg-[#FAFAFA]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#1F2937]">Monthly EMI Amortization Ledger</h4>
                        <p className="text-xs text-[#6B7280]">
                          Every month on the 1st, installments are debited directly from {loan.paymentAccount || "your bank account"}.
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#6B7280]">
                        {loan.paidEmis} of {loan.tenure} Installments Paid
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {loan.emiSchedule.map((emi, idx) => {
                        const isPaid = emi.status === "paid";
                        const dueDate = new Date(emi.dueDate);

                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                              isPaid ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-[#E5E7EB]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="text-xs font-bold text-[#1F2937]">
                                  Installment #{idx + 1} — {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                  {isPaid
                                    ? `Paid on ${new Date(emi.paidDate || emi.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} via ${loan.paymentAccount || "Bank"}`
                                    : `Scheduled for ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className={`text-sm font-extrabold ${isPaid ? "text-emerald-700" : "text-[#1F2937]"}`}>
                                {formatCurrency(emi.amount)}
                              </p>

                              {isPaid ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Paid & Debited
                                </span>
                              ) : (
                                <button
                                  onClick={() => markEmiPaid(loan._id, idx)}
                                  className="px-3.5 py-1.5 bg-[#005B4F] hover:bg-[#004A40] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                                >
                                  Pay & Deduct from Balance
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* In-App Bank Account Required Modal */}
      <BankAccountRequiredModal
        isOpen={showAccountReqModal}
        onClose={() => setShowAccountReqModal(false)}
        workspace="personal"
        featureName="a loan mandate"
      />

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteLoanId)}
        onClose={() => setDeleteLoanId(null)}
        onConfirm={confirmDeleteLoan}
        title="Delete Loan Mandate"
        message="Are you sure you want to delete this loan and its EMI schedule permanently?"
        confirmText="Delete Loan"
        isDanger={true}
      />

      {/* Add Loan Modal */}
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
                <h2 className="text-lg font-extrabold text-[#1F2937]">Create New Loan & EMI Mandate</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Configure loan amount, interest rate, and bank auto-debit permissions
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Loan Facility Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Car Loan, Home Mortgage"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Facility Type
                  </label>
                  <select
                    value={form.loanType}
                    onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                    className="w-full h-11 px-3 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white"
                  >
                    {LOAN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Financing Institution / Lender
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India (SBI), HDFC Bank"
                  value={form.lender}
                  onChange={(e) => setForm({ ...form, lender: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Principal Loan Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#005B4F]">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={form.principal}
                      onChange={(e) => setForm({ ...form, principal: e.target.value })}
                      required
                      min="1000"
                      className="w-full h-11 pl-8 pr-3 border border-[#D1D5DB] rounded-xl text-sm font-extrabold text-[#1F2937] outline-none focus:border-[#005B4F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.5"
                    value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={form.tenure}
                    onChange={(e) => setForm({ ...form, tenure: e.target.value })}
                    required
                    min="1"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    First EMI Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Repayment Bank Account (Funds will be deducted from here)
                </label>
                <select
                  value={form.paymentAccount}
                  onChange={(e) => setForm({ ...form, paymentAccount: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-semibold outline-none focus:border-[#005B4F] bg-emerald-50/40 text-[#1F2937]"
                >
                  <option value="" disabled>Select Bank Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc.nickname || acc.name}>
                      {acc.nickname || acc.name} — Current Balance: {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-[#005B4F]/5 border border-[#005B4F]/20 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#005B4F]">Calculated Monthly EMI</p>
                  <p className="text-xl font-extrabold text-[#1F2937] mt-0.5">{formatCurrency(Number(form.emi))}</p>
                  <p className="text-[10px] text-[#6B7280]">Due on the 1st of every month for {form.tenure} months</p>
                </div>
                <div className="text-right text-xs text-[#6B7280]">
                  <p>Total: {formatCurrency(Number(form.emi) * Number(form.tenure))}</p>
                  <p className="text-emerald-700 font-semibold">Interest: {formatCurrency(Math.max((Number(form.emi) * Number(form.tenure)) - Number(form.principal), 0))}</p>
                </div>
              </div>

              <div className="bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoDebit}
                    onChange={(e) => setForm({ ...form, autoDebit: e.target.checked })}
                    className="w-5 h-5 rounded text-[#005B4F] focus:ring-[#005B4F] border-gray-300 mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      Allow Auto-Debit from Bank Balance on 1st of every month
                    </p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {form.autoDebit
                        ? "✅ Permission Granted: On the 1st of each month, your EMI will be automatically deducted from your selected bank account balance."
                        : "⚠️ Manual Approval Mode: You will receive an in-app reminder notification on the 1st of each month to manually authorize and pay the EMI."}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-sm font-semibold hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 disabled:opacity-50"
                >
                  {submitting ? "Creating Loan Mandate..." : "Create Loan Mandate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
