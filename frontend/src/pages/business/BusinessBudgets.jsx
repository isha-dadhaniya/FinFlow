import React, { useState, useEffect } from "react";
import { Plus, Target, Building2, TrendingDown, X, Edit2, Trash2 } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

const DEPARTMENTS = ["Sales", "Marketing", "Engineering / IT", "Operations", "HR & Talent", "Legal & Compliance", "General & Admin"];

export default function BusinessBudgets() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState(null);
  const [form, setForm] = useState({ name: "Sales", budget: "" });

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/workspace/departments?workspace=business`, { headers: headers() });
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Department budgets load error:", err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editItem ? `${API}/workspace/departments/${editItem._id}` : `${API}/workspace/departments`;
      await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({
          ...form,
          budget: Number(form.budget),
          workspace: "business",
        }),
      });
      setShowModal(false);
      setEditItem(null);
      setForm({ name: "Sales", budget: "" });
      loadBudgets();
    } catch (err) {
      console.error("Save department budget error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteBudgetId) return;
    try {
      await fetch(`${API}/workspace/departments/${deleteBudgetId}`, { method: "DELETE", headers: headers() });
      loadBudgets();
    } catch (err) {
      console.error("Delete department budget error:", err);
    } finally {
      setDeleteBudgetId(null);
    }
  };

  const totalBudget = departments.reduce((sum, d) => sum + (d.budget || 0), 0);
  const totalSpent = departments.reduce((sum, d) => sum + (d.spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Departmental Budgets</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Allocate and monitor corporate spending limits across departments</p>
        </div>
        <button
          onClick={() => {
            setEditItem(null);
            setForm({ name: "Sales", budget: "" });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Dept Budget
        </button>
      </div>

      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-[#005B4F] to-[#007D6D] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Allocated Budget</p>
          <p className="text-3xl font-extrabold mt-1 text-white">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-emerald-100/80 mt-1">{departments.length} Active Departments</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Total Utilized</p>
          <p className="text-2xl font-bold mt-1 text-white">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-emerald-100/80 mt-1">Remaining: {formatCurrency(Math.max(0, totalBudget - totalSpent))}</p>
        </div>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)
        ) : departments.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No departmental budgets allocated</p>
            <p className="text-xs text-gray-400 mt-1">Set monthly or quarterly caps for company departments</p>
          </div>
        ) : (
          departments.map((dept) => {
            const usage = dept.budget > 0 ? Math.min(100, Math.round(((dept.spent || 0) / dept.budget) * 100)) : 0;
            const isOver = (dept.spent || 0) > (dept.budget || 0) && dept.budget > 0;
            return (
              <div key={dept._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditItem(dept);
                          setForm({ name: dept.name, budget: dept.budget });
                          setShowModal(true);
                        }}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#005B4F]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteBudgetId(dept._id)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Remove Budget">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#1F2937]">{dept.name}</p>
                  <div className="flex justify-between text-xs text-[#6B7280] mt-2 mb-1">
                    <span>Spent: {formatCurrency(dept.spent || 0)}</span>
                    <span className="font-bold text-[#1F2937]">Cap: {formatCurrency(dept.budget || 0)}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F4F6F8] rounded-full overflow-hidden mt-1 mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${isOver ? "bg-rose-500" : usage > 80 ? "bg-amber-500" : "bg-[#005B4F]"}`}
                      style={{ width: `${usage}%` }}
                    />
                  </div>
                  <p className={`text-[10px] font-bold ${isOver ? "text-rose-600" : "text-[#6B7280]"}`}>
                    {usage}% Utilized {isOver ? "(Over Budget)" : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "Set"} Department Budget</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Department Name (e.g. Sales, Marketing, IT)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Monthly Budget Allocation (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  required
                  min="1"
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
              >
                Save Department Budget
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteBudgetId)}
        onClose={() => setDeleteBudgetId(null)}
        onConfirm={confirmDelete}
        title="Remove Department Budget"
        message="Are you sure you want to remove this department budget cap? Spending tracking will remain available."
        confirmText="Remove Budget"
        isDanger={true}
      />
    </div>
  );
}
