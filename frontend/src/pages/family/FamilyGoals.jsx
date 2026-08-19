import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, PiggyBank, Target, Calendar, Check, X, Sparkles, Users } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const GOAL_CATEGORIES = [
  { label: "Family Vacation", icon: "🏖️", defaultName: "Annual Family Vacation" },
  { label: "Home Mortgage / Renovation", icon: "🏠", defaultName: "House Renovation Fund" },
  { label: "Child Higher Education", icon: "🎓", defaultName: "Children College Fund" },
  { label: "Family Emergency Pool", icon: "🛡️", defaultName: "Family Emergency Reserve" },
  { label: "Family Car", icon: "🚗", defaultName: "New Family SUV" },
];

const ICONS = ["🎯", "🏖️", "🏠", "🎓", "🛡️", "🚗", "💍", "🎁", "👶", "💰", "⭐"];
const QUICK_CHIPS = [5000, 10000, 25000, 50000];

export default function FamilyGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [contribGoal, setContribGoal] = useState(null);
  const [contribAmount, setContribAmount] = useState("");

  const [form, setForm] = useState({
    title: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    icon: "🎯",
    category: "General",
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/workspace/family-goals?workspace=family`, { headers: headers() });
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load family goals error:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditItem(null);
    setForm({
      title: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      icon: "🎯",
      category: "General",
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditItem(goal);
    setForm({
      title: goal.title || goal.name || "",
      targetAmount: String(goal.targetAmount || ""),
      currentAmount: String(goal.currentAmount || 0),
      targetDate: goal.targetDate || goal.deadline ? new Date(goal.targetDate || goal.deadline).toISOString().split("T")[0] : "",
      icon: goal.icon || "🎯",
      category: goal.category || "General",
    });
    setShowModal(true);
  };

  const handleCategorySelect = (cat) => {
    setForm({
      ...form,
      title: form.title || cat.defaultName,
      icon: cat.icon,
      category: cat.label,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title.trim(),
        name: form.title.trim(),
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount) || 0,
        targetDate: form.targetDate || null,
        deadline: form.targetDate || null,
        icon: form.icon,
        category: form.category,
        workspace: "family",
      };

      const url = editItem ? `${API}/workspace/family-goals/${editItem._id}` : `${API}/workspace/family-goals`;
      const res = await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert("Failed to save family goal.");
        return;
      }

      setShowModal(false);
      setEditItem(null);
      loadGoals();
    } catch (err) {
      console.error("Save family goal error:", err);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contribGoal || !contribAmount || Number(contribAmount) <= 0) return;
    try {
      const updatedAmount = (contribGoal.currentAmount || 0) + Number(contribAmount);
      await fetch(`${API}/workspace/family-goals/${contribGoal._id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ currentAmount: updatedAmount }),
      });
      setContribGoal(null);
      setContribAmount("");
      loadGoals();
    } catch (err) {
      console.error("Contribute error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this shared family goal?")) return;
    try {
      await fetch(`${API}/workspace/family-goals/${id}`, { method: "DELETE", headers: headers() });
      loadGoals();
    } catch (err) {
      console.error("Delete family goal error:", err);
    }
  };

  const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalSaved / totalTarget) * 100), 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Savings Goals</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Joint targets for household milestones, vacations, and education</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
        >
          <Plus className="w-4 h-4" /> Create Family Goal
        </button>
      </div>

      {/* Hero KPI Card */}
      <div className="bg-gradient-to-r from-[#2A9D8F] via-[#248277] to-[#1E6B62] rounded-2xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Shared Family Milestone Progress</span>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {formatCurrency(totalSaved)} <span className="text-lg font-normal text-white/70">/ {formatCurrency(totalTarget)}</span>
          </p>
          <p className="text-xs text-white/80">{goals.length} Joint Targets ({overallProgress}% Funded)</p>
        </div>

        <div className="w-full md:w-64 bg-black/20 backdrop-blur-xs rounded-2xl p-4 border border-white/10 space-y-2">
          <div className="flex justify-between text-xs font-bold text-white">
            <span>Overall Target</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-700 shadow-sm" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-56 bg-white rounded-2xl animate-pulse" />)
        ) : goals.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-bold text-[#1F2937]">No Family Goals Active</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-5">
              Set multi-member targets for home renovations, child education, or family trips.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-xs font-bold rounded-xl hover:bg-[#21867A]"
            >
              <Plus className="w-4 h-4" /> Create Family Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const isComplete = progress >= 100;
            const remaining = Math.max((goal.targetAmount || 0) - (goal.currentAmount || 0), 0);

            return (
              <div key={goal._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#2A9D8F]/10 flex items-center justify-center text-2xl shrink-0">
                        {goal.icon || "🎯"}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1F2937] leading-tight line-clamp-1">{goal.title || goal.name}</h3>
                        {(goal.targetDate || goal.deadline) && (
                          <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-[#9CA3AF]" />
                            Target: {new Date(goal.targetDate || goal.deadline).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOpenEditModal(goal)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#2A9D8F]">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(goal._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="my-4 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-[#6B7280]">Funded</span>
                      <span className="font-extrabold text-[#1F2937] text-sm">
                        {formatCurrency(goal.currentAmount)}
                        <span className="font-medium text-[#9CA3AF] text-xs"> / {formatCurrency(goal.targetAmount)}</span>
                      </span>
                    </div>

                    <div className="w-full h-3 bg-[#F4F6F8] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${isComplete ? "bg-emerald-500" : "bg-[#2A9D8F]"}`} style={{ width: `${progress}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className={`font-bold ${isComplete ? "text-emerald-600" : "text-[#2A9D8F]"}`}>
                        {Math.round(progress)}% {isComplete ? "🎉 Goal Achieved!" : "funded"}
                      </span>
                      {!isComplete && <span className="text-[#9CA3AF]">{formatCurrency(remaining)} remaining</span>}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  {isComplete ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Target Completed!
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setContribGoal(goal);
                        setContribAmount("10000");
                      }}
                      className="w-full py-2.5 bg-[#2A9D8F]/10 hover:bg-[#2A9D8F] text-[#2A9D8F] hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6 sm:p-7 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#1F2937]">{editItem ? "Edit Family Goal" : "Create Family Savings Goal"}</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">Define a shared household savings target</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editItem && (
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Family Goal Ideas</label>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {GOAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex items-center gap-1.5 ${
                          form.icon === cat.icon ? "border-[#2A9D8F] bg-[#2A9D8F]/10 text-[#2A9D8F]" : "border-[#E5E7EB] hover:bg-gray-50 text-[#4B5563]"
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Family Vacation to Europe"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Target Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    required
                    min="1"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-extrabold text-[#1F2937] outline-none focus:border-[#2A9D8F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Initial Pool Deposit (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.currentAmount}
                    onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                    min="0"
                    className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm font-bold text-[#1F2937] outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Target Completion Date</label>
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full h-11 px-3.5 border border-[#D1D5DB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Choose Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.icon === icon ? "bg-[#2A9D8F] text-white shadow-md scale-105" : "bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#2A9D8F] text-white text-sm font-semibold hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20">
                  {editItem ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {contribGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fadeIn_0.15s_ease-out]" onClick={() => setContribGoal(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl border border-[#E5E7EB] w-full max-w-md p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{contribGoal.icon || "🎯"}</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#1F2937]">Deposit to Family Goal</h3>
                  <p className="text-xs text-[#6B7280]">{contribGoal.title || contribGoal.name}</p>
                </div>
              </div>
              <button onClick={() => setContribGoal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">Contribution Amount (₹)</label>
                <input
                  type="number"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full h-12 px-3.5 border border-[#D1D5DB] rounded-xl text-lg font-extrabold text-[#1F2937] outline-none focus:border-[#2A9D8F]"
                />
              </div>

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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 mt-5">
                <button type="button" onClick={() => setContribGoal(null)} className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#2A9D8F] text-white text-xs font-bold hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20">
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
