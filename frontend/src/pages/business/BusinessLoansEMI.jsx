import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, BadgeIndianRupee, X, Check, ChevronDown, ChevronUp, Landmark, ShieldCheck, BellRing, Zap, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import BankAccountRequiredModal from "../../components/common/BankAccountRequiredModal";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const LOAN_TYPES = [
  "Commercial Term Loan",
  "Working Capital Credit Line",
  "Machinery & Equipment Loan",
  "Commercial Vehicle Financing",
  "Business Expansion Loan",
  "Corporate Line of Credit",
];

export default function BusinessLoansEMI() {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAccountReqModal, setShowAccountReqModal] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({
    name: "Machinery & Equipment Loan",
    loanType: "Machinery & Equipment Loan",
    lender: "HDFC Bank (Corporate)",
    principal: "5000000",
    interestRate: "9.2",
    tenure: "36",
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
        fetch(`${API}/loans?workspace=business`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=business`, { headers: headers() }),
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
            paymentAccount: accArr[0]?.nickname || accArr[0]?.name || "",
          }));
        }
      }
    } catch (err) {
      console.error("Load business loans error:", err);
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
    const defaultAcc = accounts[0]?.nickname || accounts[0]?.name || "";
    setForm({
      name: "Machinery & Equipment Loan",
      loanType: "Machinery & Equipment Loan",
      lender: "HDFC Bank (Corporate)",
      principal: "5000000",
      interestRate: "9.2",
      tenure: "36",
      emi: "",
      startDate: new Date().toISOString().split("T")[0],
      paymentAccount: defaultAcc,
      autoDebit: true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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
        workspace: "business",
      };

      const res = await fetch(`${API}/loans`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        return;
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      console.error("Submit business loan error:", err);
    }
  };

  const markEmiPaid = async (loanId, emiIndex) => {
    try {
      const res = await fetch(`${API}/loans/${loanId}/emi/${emiIndex}/pay`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ paymentMethod: "Corporate Bank Transfer" }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error("EMI pay error:", err);
    }
  };

  const [deleteLoanId, setDeleteLoanId] = useState(null);

  const confirmDeleteLoan = async () => {
    if (!deleteLoanId) return;
    try {
      await fetch(`${API}/loans/${deleteLoanId}`, { method: "DELETE", headers: headers() });
      setDeleteLoanId(null);
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const totalPrincipal = loans.reduce((s, l) => s + (l.principal || 0), 0);
  const totalOutstanding = loans.reduce((s, l) => s + (l.outstandingAmount || 0), 0);
  const totalMonthlyEmi = loans.filter((l) => l.status === "active").reduce((s, l) => s + (l.emi || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Commercial Loans & Credit Lines</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Corporate term loans, equipment financing, and auto-debit ledgers</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Commercial Loan
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Commercial Debt</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">{formatCurrency(totalPrincipal)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">{loans.length} Corporate Facilities</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Outstanding Liability</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">{formatCurrency(totalOutstanding)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">Pending Principal + Interest</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Monthly Commercial Debt Service</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#005B4F] mt-1">{formatCurrency(totalMonthlyEmi)}</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1">Due on 1st of Every Month</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading commercial loans...</div>
        ) : loans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-xs">
            <BadgeIndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Commercial Financing Active</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Add term financing, equipment credit, or commercial vehicle loans to automate 1st-of-the-month corporate debits.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Commercial Loan
            </button>
          </div>
        ) : (
          loans.map((loan) => {
            const isExpanded = expanded === loan._id;
            const progress = loan.tenure > 0 ? (loan.paidEmis / loan.tenure) * 100 : 0;
            const isComplete = loan.status === "completed";

            return (
              <div key={loan._id} className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
                <div className="p-5 sm:p-6 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : loan._id)}>
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center font-bold text-xl">
                        🏢
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[#1F2937]">{loan.name}</h3>
                        <p className="text-xs text-[#9CA3AF]">
                          Lender: {loan.lender || "Corporate Bank"} · Corporate Current: <span className="font-semibold text-gray-900">{loan.paymentAccount}</span>
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

                      <button onClick={(e) => { e.stopPropagation(); setDeleteLoanId(loan._id); }} className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F9FAFB] rounded-xl p-4 border border-gray-100 text-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#6B7280]">Principal</p>
                      <p className="text-base font-extrabold text-[#1F2937]">{formatCurrency(loan.principal)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#6B7280]">Monthly Service</p>
                      <p className="text-base font-extrabold text-[#005B4F]">{formatCurrency(loan.emi)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#6B7280]">Installments</p>
                      <p className="text-base font-extrabold text-emerald-600">{loan.paidEmis || 0}/{loan.tenure} Paid</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#6B7280]">Outstanding</p>
                      <p className="text-base font-extrabold text-amber-700">{formatCurrency(loan.outstandingAmount)}</p>
                    </div>
                  </div>
                </div>

                {isExpanded && loan.emiSchedule && (
                  <div className="border-t border-[#E5E7EB] px-5 sm:px-6 py-5 bg-[#FAFAFA]">
                    <h4 className="text-sm font-extrabold text-[#1F2937] mb-3">Corporate Amortization Schedule</h4>
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {loan.emiSchedule.map((emi, idx) => {
                        const isPaid = emi.status === "paid";
                        const dueDate = new Date(emi.dueDate);
                        return (
                          <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border ${isPaid ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-[#E5E7EB]"}`}>
                            <div>
                              <p className="text-xs font-bold text-[#1F2937]">Installment #{idx + 1} — {dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                              <p className="text-[11px] text-[#9CA3AF]">{isPaid ? `Paid via ${loan.paymentAccount}` : `Scheduled for ${dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-extrabold text-[#1F2937]">{formatCurrency(emi.amount)}</p>
                              {isPaid ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Paid & Debited
                                </span>
                              ) : (
                                <button onClick={() => markEmiPaid(loan._id, idx)} className="px-3.5 py-1.5 bg-[#005B4F] text-white text-xs font-bold rounded-lg hover:bg-[#004A40] shadow-xs cursor-pointer">
                                  Pay & Deduct Corporate Balance
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
        workspace="business"
        featureName="a commercial loan facility"
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">Create Commercial Loan Facility</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Configure term financing and corporate auto-debit permissions</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Facility Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Machinery & Equipment Loan"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Facility Type</label>
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
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Lending Institution</label>
                <input
                  type="text"
                  placeholder="HDFC Bank (Commercial Branch)"
                  value={form.lender}
                  onChange={(e) => setForm({ ...form, lender: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Facility Principal (₹)</label>
                  <input
                    type="number"
                    placeholder="5000000"
                    value={form.principal}
                    onChange={(e) => setForm({ ...form, principal: e.target.value })}
                    required
                    min="1"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-extrabold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="9.25"
                    value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                    required
                    min="0"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Tenure (Months)</label>
                  <input
                    type="number"
                    placeholder="36"
                    value={form.tenure}
                    onChange={(e) => setForm({ ...form, tenure: e.target.value })}
                    required
                    min="1"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Sanction / Start Date</label>
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
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Repayment Corporate Account</label>
                <select
                  value={form.paymentAccount}
                  onChange={(e) => setForm({ ...form, paymentAccount: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-semibold outline-none focus:border-[#005B4F] bg-emerald-50/40 text-[#1F2937]"
                >
                  <option value="" disabled>Select Corporate Bank Account</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc.nickname || acc.name}>
                      {acc.nickname || acc.name} — Balance: {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoDebit}
                    onChange={(e) => setForm({ ...form, autoDebit: e.target.checked })}
                    className="w-5 h-5 rounded text-[#005B4F] mt-0.5 accent-[#005B4F]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1F2937]">
                      Enable Automatic Corporate Balance Debit on 1st of Month
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {form.autoDebit
                        ? "✅ Permission Granted: On the 1st of each month, the commercial EMI will automatically deduct from your corporate account balance."
                        : "⚠️ Manual Approval Mode: You will receive an in-app reminder notification on the 1st of each month to manually authorize payment."}
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-sm font-semibold hover:bg-[#004A40] transition-colors shadow-md shadow-[#005B4F]/20 cursor-pointer">
                  Create Commercial Loan Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteLoanId)}
        onClose={() => setDeleteLoanId(null)}
        onConfirm={confirmDeleteLoan}
        title="Delete Commercial Loan"
        message="Are you sure you want to delete this corporate loan facility and its EMI schedule permanently?"
        confirmText="Delete Facility"
        isDanger={true}
      />
    </div>
  );
}
