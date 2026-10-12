import React, { useState, useEffect } from "react";
import { Plus, Target, Trash2, Edit2, AlertCircle, CheckCircle2, TrendingDown, DollarSign, X } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const CATEGORIES = ["Overall", "Groceries", "Household", "Utilities", "Rent & Housing", "Education", "Healthcare", "Travel & Vacation", "Events", "Dining", "Other"];

export default function FamilyBudget() {
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState("Overall");
  const [limitAmount, setLimitAmount] = useState("");

  useEffect(() => {
    loadBudget();
  }, []);

  const loadBudget = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/budgets?module=family`, { headers: headers() });
      const data = await res.json();
      setBudgetData(data);
    } catch (err) {
      console.error("Family budget load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/budgets`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          category,
          limitAmount: Number(limitAmount),
          module: "family",
        }),
      });
      setShowModal(false);
      setLimitAmount("");
      loadBudget();
    } catch (err) {
      console.error("Save family budget error:", err);
    }
  };

  const totalLimit = budgetData?.totalLimit || 0;
  const totalSpent = budgetData?.totalSpent || 0;
  const remaining = Math.max(0, totalLimit - totalSpent);
  const percent = totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;
  const isOver = totalSpent > totalLimit && totalLimit > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Budget</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Set monthly spending limits for the whole family</p>
        </div>
        <button
          onClick={() => {
            setCategory("Overall");
            setLimitAmount("");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Set Budget Limit
        </button>
      </div>

      {/* Main Budget Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Overall Monthly Budget</span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl font-extrabold text-[#1F2937]">{formatCurrency(totalLimit)}</span>
              <span className="text-sm text-[#6B7280]">Limit</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Total Spent</span>
            <p className={`text-2xl font-bold mt-1 ${isOver ? "text-rose-600" : "text-[#005B4F]"}`}>{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-[#F4F6F8] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : "bg-[#005B4F]"}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
          <span>{percent}% Used</span>
          <span>{isOver ? `Over by ${formatCurrency(totalSpent - totalLimit)}` : `${formatCurrency(remaining)} Remaining`}</span>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div>
        <h2 className="text-base font-bold text-[#1F2937] mb-3">Category Budgets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)
          ) : !budgetData?.categoryBudgets || budgetData.categoryBudgets.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-sm text-gray-500">
              No category budgets set yet. Click "Set Budget Limit" to add one!
            </div>
          ) : (
            budgetData.categoryBudgets.map((cat) => {
              const catPercent = Math.min(100, cat.percentUsed || 0);
              const catOver = cat.spentAmount > cat.limitAmount;
              return (
                <div key={cat._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-[#1F2937]">{cat.category}</p>
                    <span className={`text-xs font-bold ${catOver ? "text-rose-600" : "text-[#005B4F]"}`}>
                      {cat.percentUsed || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6B7280] mb-2">
                    <span>Spent: {formatCurrency(cat.spentAmount)}</span>
                    <span>Cap: {formatCurrency(cat.limitAmount)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F4F6F8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${catOver ? "bg-rose-500" : "bg-[#005B4F]"}`}
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">Set Family Budget</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F] bg-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1.5">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer"
              >
                Save Family Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
