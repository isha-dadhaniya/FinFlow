import React, { useState, useEffect, useMemo } from "react";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/dashboard/StatCard";
import DataTable from "../../components/common/DataTable";
import Toast from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  fetchBudgetStatus,
  saveBudget,
  deleteBudget,
  fetchBudgetHistory,
  fetchExpenses,
} from "../../api/services";
import { formatINR } from "../../utils/formatCurrency";
import {
  Target,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  PieChart,
  Calendar,
  X,
  Save,
} from "lucide-react";

const CATEGORIES = [
  "Overall",
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Business",
  "Travel",
  "Other",
];

export default function MonthlyBudget() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [category, setCategory] = useState("Overall");
  const [limitAmount, setLimitAmount] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  useEffect(() => {
    loadAllBudgetData();
  }, []);

  const loadAllBudgetData = async () => {
    try {
      setLoading(true);
      const [resStatus, resHistory] = await Promise.all([
        fetchBudgetStatus({ module: "personal" }),
        fetchBudgetHistory({ module: "personal" }),
      ]);
      setData(resStatus.data);
      setHistory(resHistory.data || []);
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to load budget data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setCategory("Overall");
    setLimitAmount("");
    setAlertsEnabled(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b) => {
    setCategory(b.category || "Overall");
    setLimitAmount(b.limitAmount || "");
    setAlertsEnabled(b.alertsEnabled ?? true);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!limitAmount || Number(limitAmount) <= 0) {
      setToast({ message: "Please enter a valid budget amount greater than 0.", type: "error" });
      return;
    }

    try {
      await saveBudget({
        category,
        limitAmount: Number(limitAmount),
        alertsEnabled,
        module: "personal",
      });
      setToast({ message: `Budget for ${category} saved successfully!`, type: "success" });
      setIsModalOpen(false);
      loadAllBudgetData();
    } catch (err) {
      setToast({ message: "Failed to save budget.", type: "error" });
    }
  };

  const handleDeleteBudget = async () => {
    if (!deleteId) return;
    try {
      await deleteBudget(deleteId);
      setToast({ message: "Budget entry deleted.", type: "success" });
      setDeleteId(null);
      loadAllBudgetData();
    } catch (err) {
      setToast({ message: "Failed to delete budget.", type: "error" });
    }
  };

  // Metrics
  const totalLimit = data?.totalLimit || 0;
  const totalSpent = data?.totalSpent || 0;
  const remaining = Math.max(0, totalLimit - totalSpent);
  const percentUsed = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : (totalSpent > 0 ? 100 : 0);

  // Status State (<80% Normal, 80-99% Warning, >=100% Over-budget)
  let budgetState = "Normal";
  if (percentUsed >= 100) budgetState = "Over-budget";
  else if (percentUsed >= 80) budgetState = "Warning";

  // Highest spending category
  const highestCategoryEntry = useMemo(() => {
    if (!data?.categoryBreakdown) return { name: "N/A", amount: 0 };
    const entries = Object.entries(data.categoryBreakdown);
    if (entries.length === 0) return { name: "N/A", amount: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { name: entries[0][0], amount: entries[0][1] };
  }, [data?.categoryBreakdown]);

  // Table Columns for History
  const historyColumns = [
    { header: "Month", key: "month" },
    {
      header: "Budget Amount",
      accessor: (row) => <span className="font-bold text-gray-900">₹{row.budgetAmount.toLocaleString()}</span>,
    },
    {
      header: "Total Spent",
      accessor: (row) => <span className="font-semibold text-gray-700">₹{row.totalSpent.toLocaleString()}</span>,
    },
    {
      header: "Remaining",
      accessor: (row) => (
        <span className={`font-bold  ₹{row.remaining < 0 ? "text-red-600" : "text-[#005B4F]"}`}>
          ₹{Math.max(0, row.remaining).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 text-xs font-semibold rounded-full ₹{row.status === "Over-budget"
            ? "bg-red-100 text-red-800"
            : row.status === "Warning"
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
            }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Budget Manager"
        subtitle="Set category spending limits, track utilization progress, and automate threshold alerts."
        badge="Personal Module"
        actionButton={
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] bg-[#005B4F] text-white font-semibold text-xs shadow-md hover:bg-[#004A40] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add / Set Budget
          </button>
        }
      />

      {/* Alert Banners */}
      {percentUsed >= 100 ? (
        <div className="p-4 rounded-[16px] bg-red-50 border border-red-200 text-red-900 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Critical Alert: Over-Budget Exceeded!</h4>
            <p className="text-xs text-red-700 mt-0.5">
              Your monthly spending (₹{totalSpent.toLocaleString()}) has exceeded your budget limit (₹{totalLimit.toLocaleString()}) by {percentUsed - 100}%.
            </p>
          </div>
        </div>
      ) : percentUsed >= 80 ? (
        <div className="p-4 rounded-[16px] bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Budget Warning: 80% Utilization Reached</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              You have spent {percentUsed}% of your set monthly limit. Only ₹{remaining.toLocaleString()} remaining.
            </p>
          </div>
        </div>
      ) : null}

      {/* Budget Dashboard Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Monthly Budget"
          value={formatINR(totalLimit)}
          icon={Target}
          color="jade"
        />
        <StatCard
          title="Total Expenses"
          value={formatINR(totalSpent)}
          icon={TrendingUp}
          color="graphite"
        />
        <StatCard
          title="Remaining Budget"
          value={formatINR(remaining)}
          badgeText={`${100 - percentUsed}% Left`}
          icon={Target}
          color="gold"
        />
      </div>

      {/* Visual Budget Progress Bar Card */}
      <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1F2937]">Budget Utilization Progress</h3>
            <p className="text-xs text-[#6B7280] mt-0.5">Overall Monthly Spending Limit</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-extrabold rounded-full ${budgetState === "Over-budget"
                ? "bg-red-100 text-red-800"
                : budgetState === "Warning"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800"
                }`}
            >
              {budgetState} ({percentUsed}%)
            </span>
          </div>
        </div>

        {/* Progress Bar with 3 States */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(100, percentUsed)}%` }}
            className={`h-full rounded-full transition-all duration-500 ${budgetState === "Over-budget"
              ? "bg-red-600"
              : budgetState === "Warning"
                ? "bg-[#D4AF37]"
                : "bg-[#005B4F]"
              }`}
          />
        </div>
      </div>

      {/* Category-Wise Budget Utilization & Active Budgets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Budget Breakdown */}
        <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#1F2937]">Category-Wise Budget Utilization</h3>

          {data?.categoryBudgets && data.categoryBudgets.length > 0 ? (
            <div className="space-y-4">
              {data.categoryBudgets.map((cb) => (
                <div key={cb._id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-900 font-bold">{cb.category}</span>
                    <span className="text-gray-600">
                      ₹{cb.spentAmount.toLocaleString()} / ₹{cb.limitAmount.toLocaleString()} ({cb.percentUsed}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, cb.percentUsed)}%` }}
                      className={`h-full rounded-full ${cb.percentUsed >= 100
                        ? "bg-red-600"
                        : cb.percentUsed >= 80
                          ? "bg-[#D4AF37]"
                          : "bg-[#005B4F]"
                        }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 py-6 text-center">
              No custom category budgets set yet. Click "Add / Set Budget" to assign limits per category.
            </p>
          )}
        </div>

        {/* Budget Configurations List */}
        <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#1F2937]">Active Budget Configurations</h3>
          </div>

          <div className="space-y-3">
            {data?.budgets?.map((b) => (
              <div
                key={b._id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-colors"
              >
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{b.category} Budget</h4>
                  <p className="text-[11px] text-gray-500">
                    Limit: ₹{b.limitAmount.toLocaleString()} • Alerts: {b.alertsEnabled ? "On" : "Off"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(b)}
                    className="p-1.5 text-gray-500 hover:text-[#005B4F]"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {b.category !== "Overall" && (
                    <button
                      onClick={() => setDeleteId(b._id)}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget History Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#1F2937]">Monthly Budget History</h3>
        <DataTable columns={historyColumns} data={history} loading={loading} />
      </div>

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 shadow-2xl border border-[#D9DEE3] relative animate-[scaleIn_0.15s_ease-out]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#1F2937] mb-4">Set Budget Configuration</h3>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Budget Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-semibold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Monthly Budget Limit (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full h-11 px-3 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                  placeholder="5000"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="alerts"
                  checked={alertsEnabled}
                  onChange={(e) => setAlertsEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#005B4F] cursor-pointer"
                />
                <label htmlFor="alerts" className="text-xs font-semibold text-gray-800 cursor-pointer">
                  Enable 80% & 100% Threshold Alert Notifications
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#005B4F] hover:bg-[#004A40] text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBudget}
        title="Delete Budget Entry"
        message="Are you sure you want to remove this category budget setting?"
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </div>
  );
}
