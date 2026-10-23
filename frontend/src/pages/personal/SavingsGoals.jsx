import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, PiggyBank, Target, Calendar, Check, X, TrendingUp, DollarSign, Landmark, AlertCircle, CheckCircle2 } from "lucide-react";
import ConfirmModal, { AlertModal } from "../../components/common/ConfirmModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const GOAL_CATEGORIES = [
  { label: "Vacation & Travel", icon: "✈️", defaultName: "Dream Vacation" },
  { label: "Emergency Reserve", icon: "🛡️", defaultName: "Emergency Fund (6 Months)" },
  { label: "Home & Real Estate", icon: "🏠", defaultName: "House Down Payment" },
  { label: "New Vehicle", icon: "🚗", defaultName: "New Car Purchase" },
  { label: "Education & Career", icon: "🎓", defaultName: "Higher Education Fund" },
  { label: "Wedding & Family", icon: "💍", defaultName: "Wedding Milestone" },
  { label: "Gadgets & Tech", icon: "💻", defaultName: "New MacBook Pro" },
  { label: "Wealth & Investment", icon: "💰", defaultName: "First ₹10 Lakhs Portfolio" },
  { label: "Retirement Corpus", icon: "🏖️", defaultName: "Early Retirement Corpus" },
  { label: "Special Gift", icon: "🎁", defaultName: "Anniversary Gift" },
];

const ICONS = ["🎯", "✈️", "🛡️", "🏠", "🚗", "🎓", "💍", "💻", "💰", "🏖️", "🎁", "👶", "🏥", "🚲", "⭐"];

const QUICK_CHIPS = [1000, 5000, 10000, 25000];

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState("");
  const [contribAccount, setContribAccount] = useState("");
  const [contribNote, setContribNote] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    deadline: "",
    icon: "🎯",
    category: "General",
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const [goalsRes, accsRes] = await Promise.allSettled([
        fetch(`${API}/savings-goals?workspace=personal`, { headers: headers() }),
        fetch(`${API}/accounts?workspace=personal`, { headers: headers() }),
      ]);

      if (goalsRes.status === "fulfilled" && goalsRes.value.ok) {
        const data = await goalsRes.value.json();
        setGoals(Array.isArray(data) ? data : []);
      }
      if (accsRes.status === "fulfilled" && accsRes.value.ok) {
        const accData = await accsRes.value.json();
        setAccounts(Array.isArray(accData) ? accData : []);
      }
    } catch (err) {
      console.error("Load goals/accounts error:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      deadline: "",
      icon: "🎯",
      category: "General",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditItem(goal);
    setForm({
      name: goal.name || "",
      targetAmount: String(goal.targetAmount || ""),
      currentAmount: String(goal.currentAmount || 0),
      deadline: goal.deadline ? new Date(goal.deadline).toISOString().split("T")[0] : "",
      icon: goal.icon || "🎯",
      category: goal.category || "General",
    });
    setShowModal(true);
  };

  const handleCategorySelect = (cat) => {
    setForm({
      ...form,
      name: form.name || cat.defaultName,
      icon: cat.icon,
      category: cat.label,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name.trim(),
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        deadline: form.deadline || null,
        icon: form.icon,
        category: form.category,
        workspace: "personal",
      };

      const url = editItem ? `${API}/savings-goals/${editItem._id}` : `${API}/savings-goals`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setAlertMessage("Failed to save goal.");
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadGoals();
    } catch (err) {
      console.error("Save goal error:", err);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribGoal || !contribAmount || Number(contribAmount) <= 0) return;
    try {
      const res = await fetch(`${API}/savings-goals/${contribGoal._id}/contribute`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          amount: Number(contribAmount),
          account: contribAccount,
          note: contribNote.trim() || `Deposit to ${contribGoal.name}`,
        }),
      });
      if (!res.ok) {
        setAlertMessage("Failed to deposit contribution.");
        return;
      }
      setContribGoal(null);
      setContribAmount("");
      setContribAccount("");
      setContribNote("");
      loadGoals();
    } catch (err) {
      console.error("Contribute error:", err);
    }
  };

  const [deleteGoalId, setDeleteGoalId] = useState(null);

  const confirmDeleteGoal = async () => {
    if (!deleteGoalId) return;
    try {
      await fetch(`${API}/savings-goals/${deleteGoalId}`, { method: "DELETE", headers: headers() });
      setDeleteGoalId(null);
      loadGoals();
    } catch (err) {
      console.error("Delete goal error:", err);
    }
  };

  // Calculations
  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;
  const completedGoals = goals.filter((g) => g.currentAmount >= g.targetAmount && g.targetAmount > 0).length;

  // Monthly pace calculation for the active form
  const calculateMonthlyPace = () => {
    if (!form.targetAmount || !form.deadline) return null;
    const target = Number(form.targetAmount);
    const initial = Number(form.currentAmount) || 0;
    const remaining = Math.max(target - initial, 0);
    const now = new Date();
    const end = new Date(form.deadline);
    const months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
    if (months <= 0) return formatCurrency(remaining);
    return formatCurrency(Math.ceil(remaining / months));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Savings Goals & Targets</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Define your milestones, track deposits, and watch your wealth grow</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {/* Hero KPI Summary */}
      <div className="bg-gradient-to-r from-[#005B4F] via-[#007062] to-[#008573] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-white/80 text-xs font-bold uppercase tracking-wider">
            <span>Cumulative Goal Progress</span>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {formatCurrency(totalSaved)} <span className="text-lg font-normal text-white/70">/ {formatCurrency(totalTarget)}</span>
          </p>
          <p className="text-xs text-white/80">
            {completedGoals} of {goals.length} Goal{goals.length !== 1 ? "s" : ""} Accomplished ({overallProgress}% Total Saved)
          </p>
        </div>

        <div className="w-full md:w-64 bg-black/20 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-bold text-white">
            <span>Overall Milestone</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/70 text-right">
            Remaining: {formatCurrency(Math.max(totalTarget - totalSaved, 0))}
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse" />)
        ) : goals.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center shadow-xs">
            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Savings Goals Created Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Set savings targets for vacations, emergency reserves, vehicles, or milestone purchases.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-xs font-bold rounded-xl hover:bg-[#004A40] transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Your First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const isComplete = progress >= 100;
            const remaining = Math.max((goal.targetAmount || 0) - (goal.currentAmount || 0), 0);

            return (
              <div
                key={goal._id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#005B4F]/10 flex items-center justify-center text-2xl shrink-0">
                        {goal.icon || "🎯"}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1F2937] leading-tight line-clamp-1">
                          {goal.name}
                        </h3>
                        {goal.deadline && (
                          <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                            Target: {new Date(goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(goal)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F] transition-colors"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalId(goal._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="my-4 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-[#6B7280]">Saved So Far</span>
                      <span className="font-extrabold text-[#1F2937] text-sm">
                        {formatCurrency(goal.currentAmount)}
                        <span className="font-medium text-[#9CA3AF] text-xs"> / {formatCurrency(goal.targetAmount)}</span>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#F4F6F8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-emerald-500" : "bg-[#005B4F]"
                          }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className={`font-bold ${isComplete ? "text-emerald-600" : "text-[#005B4F]"}`}>
                        {Math.round(progress)}% {isComplete ? "🎉 Goal Achieved!" : "saved"}
                      </span>
                      {!isComplete && (
                        <span className="text-[#9CA3AF]">
                          {formatCurrency(remaining)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-gray-100">
                  {isComplete ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Target Completed!
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setContribGoal(goal);
                        setContribAmount("5000");
                        const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
                        setContribAccount(defaultAcc ? (defaultAcc.nickname || defaultAcc.name || defaultAcc.bankName) : "Manual / Cash (No deduction)");
                        setContribNote("");
                      }}
                      className="w-full py-2.5 bg-[#005B4F]/10 hover:bg-[#005B4F] text-[#005B4F] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Deposit Funds
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Redesigned Add / Edit Savings Goal Modal */}
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
                  {editItem ? "Edit Savings Goal" : "Create Savings Goal"}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Set your target milestone and track your contributions over time
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Template Chips */}
              {!editItem && (
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">
                    Popular Goal Ideas
                  </label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                    {GOAL_CATEGORIES.slice(0, 5).map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 ${form.icon === cat.icon
                          ? "border-[#005B4F] bg-[#005B4F]/10 text-[#005B4F]"
                          : "border-[#E5E7EB] hover:bg-gray-50 text-[#4B5563]"
                          }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goal Name */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Goal Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dream Vacation to Bali, Emergency Fund"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                />
              </div>

              {/* Target Amount & Initial Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Target Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#005B4F]">₹</span>
                    <input
                      type="number"
                      placeholder="200000"
                      value={form.targetAmount}
                      onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                      required
                      min="1"
                      className="w-full h-11 pl-8 pr-3 border border-[#D1D5DB] rounded-xl text-sm font-extrabold text-[#1F2937] outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Initial Deposit (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#005B4F]">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.currentAmount}
                      onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                      min="0"
                      className="w-full h-11 pl-8 pr-3 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/10"
                />
              </div>

              {/* Monthly Pace Helper */}
              {calculateMonthlyPace() && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-medium">Estimated monthly savings required:</span>
                  <span className="font-extrabold text-emerald-900">{calculateMonthlyPace()} / month</span>
                </div>
              )}

              {/* Icon Selector Grid */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
                  Choose Goal Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${form.icon === icon
                        ? "bg-[#005B4F] text-white shadow-md scale-105 ring-2 ring-[#005B4F]/30"
                        : "bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200"
                        }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions: Cancel & Create Goal */}
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
                  className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-sm font-semibold hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20"
                >
                  {editItem ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deposit Funds Modal */}
      {contribGoal && (() => {
        const selectedAccountObj = accounts.find(
          (a) => (a.nickname || a.name || a.bankName) === contribAccount
        );
        const isAutoDeduct = contribAccount && contribAccount !== "Manual / Cash (No deduction)";
        const isInsufficientBalance =
          isAutoDeduct &&
          selectedAccountObj &&
          Number(contribAmount) > (selectedAccountObj.balance || 0);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]"
            onClick={() => setContribGoal(null)}
          >
            <div
              className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-md p-6 sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{contribGoal.icon || "🎯"}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-[#1F2937]">Deposit to Goal</h3>
                    <p className="text-xs text-[#6B7280]">{contribGoal.name}</p>
                  </div>
                </div>
                <button onClick={() => setContribGoal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleContribute} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Deposit Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[#005B4F]">₹</span>
                    <input
                      type="number"
                      value={contribAmount}
                      onChange={(e) => setContribAmount(e.target.value)}
                      required
                      min="1"
                      placeholder="Enter amount"
                      className="w-full h-12 pl-8 pr-4 border border-[#D1D5DB] rounded-xl text-lg font-extrabold text-[#1F2937] outline-none focus:border-[#005B4F]"
                    />
                  </div>
                </div>

                {/* Quick Chip Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setContribAmount(String(chip))}
                      className="py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-xs font-bold rounded-lg transition-colors border border-gray-200"
                    >
                      +{formatCurrency(chip)}
                    </button>
                  ))}
                </div>

                {/* Pay From Bank / Wallet Account */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-[#005B4F]" /> Pay From Account
                    </span>
                    {selectedAccountObj && (
                      <span className="text-[11px] font-semibold text-[#005B4F]">
                        Balance: {formatCurrency(selectedAccountObj.balance)}
                      </span>
                    )}
                  </label>
                  <select
                    value={contribAccount}
                    onChange={(e) => setContribAccount(e.target.value)}
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-xs font-bold text-[#1F2937] bg-white outline-none focus:border-[#005B4F]"
                  >
                    {accounts.map((acc) => {
                      const accName = acc.nickname || acc.name || acc.bankName;
                      return (
                        <option key={acc._id} value={accName}>
                          {accName} ({formatCurrency(acc.balance)}) {acc.isDefault ? "★ Default" : ""}
                        </option>
                      );
                    })}
                    <option value="Manual / Cash (No deduction)">Manual / Cash (No Account Deduction)</option>
                  </select>
                </div>

                {/* Informational & Balance Alert */}
                {isAutoDeduct ? (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                      isInsufficientBalance
                        ? "bg-amber-50 text-amber-900 border border-amber-200"
                        : "bg-emerald-50 text-emerald-900 border border-emerald-100"
                    }`}
                  >
                    {isInsufficientBalance ? (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <p className="font-bold text-[11px]">
                        {isInsufficientBalance
                          ? `Insufficient Funds Warning`
                          : `Automatic Bank Deduction & Transaction Sync`}
                      </p>
                      <p className="text-[11px] leading-tight opacity-90">
                        {isInsufficientBalance
                          ? `Deposit (${formatCurrency(Number(contribAmount) || 0)}) exceeds current available balance (${formatCurrency(selectedAccountObj?.balance || 0)}).`
                          : `${formatCurrency(Number(contribAmount) || 0)} will be deducted from ${contribAccount} and recorded as an expense transaction.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
                    <span className="text-gray-400">ℹ️</span>
                    <span className="text-[11px]">Manual deposit tracking only. No bank account balance will be deducted.</span>
                  </div>
                )}

                {/* Optional Deposit Note */}
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                    Deposit Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={contribNote}
                    onChange={(e) => setContribNote(e.target.value)}
                    placeholder="e.g., Monthly savings deposit, Festival bonus"
                    className="w-full h-10 px-3.5 border border-[#D1D5DB] rounded-xl text-xs font-medium text-[#1F2937] outline-none focus:border-[#005B4F]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-5">
                  <button
                    type="button"
                    onClick={() => setContribGoal(null)}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#005B4F] text-white text-xs font-bold hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Confirm Deposit
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteGoalId)}
        onClose={() => setDeleteGoalId(null)}
        onConfirm={confirmDeleteGoal}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal permanently?"
        confirmText="Delete Goal"
        isDanger={true}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={Boolean(alertMessage)}
        onClose={() => setAlertMessage("")}
        title="Savings Goal Notice"
        message={alertMessage}
        type="warning"
      />
    </div>
  );
}
