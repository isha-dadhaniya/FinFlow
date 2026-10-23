import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Tag, X, Check } from "lucide-react";
import ConfirmModal from "../components/common/ConfirmModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", type: "expense", icon: "🍔", color: "#EF4444" },
  { name: "Shopping", type: "expense", icon: "🛍️", color: "#F59E0B" },
  { name: "Transportation", type: "expense", icon: "🚗", color: "#3B82F6" },
  { name: "Bills & Utilities", type: "expense", icon: "💡", color: "#8B5CF6" },
  { name: "Entertainment", type: "expense", icon: "🎬", color: "#EC4899" },
  { name: "Healthcare", type: "expense", icon: "💊", color: "#10B981" },
  { name: "Salary & Wages", type: "income", icon: "💰", color: "#059669" },
  { name: "Freelance / Business", type: "income", icon: "💻", color: "#2563EB" },
  { name: "Investments", type: "income", icon: "📈", color: "#7C3AED" },
];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ name: "", type: "expense", icon: "🏷️", color: "#005B4F" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/categories`, { headers: headers() });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error("Categories load error:", err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/categories`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(form),
      });
      setShowModal(false);
      setForm({ name: "", type: "expense", icon: "🏷️", color: "#005B4F" });
      loadCategories();
    } catch (err) {
      console.error("Create category error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCatId) return;
    try {
      await fetch(`${API}/categories/${deleteCatId}`, { method: "DELETE", headers: headers() });
      setDeleteCatId(null);
      loadCategories();
    } catch (err) {
      console.error("Delete category error:", err);
    }
  };

  const filtered = typeFilter === "all" ? categories : categories.filter((c) => c.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Category Manager</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Customize transaction, expense, and budget categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "expense", "income"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              typeFilter === t ? "bg-[#005B4F] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
            }`}
          >
            {t === "all" ? "All Categories" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((cat, idx) => (
          <div key={cat._id || idx} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: `${cat.color || "#005B4F"}15`, color: cat.color || "#005B4F" }}
              >
                {cat.icon || "🏷️"}
              </div>
              <div>
                <p className="text-sm font-bold text-[#1F2937]">{cat.name}</p>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cat.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {cat.type}
                </span>
              </div>
            </div>
            {cat._id && (
              <button onClick={() => setDeleteCatId(cat._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">New Category</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name (e.g. Pet Care, SaaS)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  type="text"
                  placeholder="Emoji Icon (e.g. 🐶)"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCatId)}
        onClose={() => setDeleteCatId(null)}
        onConfirm={confirmDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? Any associated transactions will remain intact."
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
