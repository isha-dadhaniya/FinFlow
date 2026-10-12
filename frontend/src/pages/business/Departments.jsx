import React, { useState, useEffect } from "react";
import { Plus, Building2, Trash2, Edit2, X } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const formatCurrency = (a) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);
const DEFAULT_DEPTS = ["Sales", "Marketing", "HR", "Finance", "IT", "Operations", "Development"];

export default function Departments() {
  const [depts, setDepts] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState(null);
  const [deleteDept, setDeleteDept] = useState(null);
  const [form, setForm] = useState({ name: "", budget: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const t = localStorage.getItem("token"); const r = await fetch("http://localhost:5000/api/workspace/departments?workspace=business", { headers: { Authorization: `Bearer ${t}` } }); const d = await r.json(); setDepts(Array.isArray(d) ? d : []); } catch { setDepts([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); const t = localStorage.getItem("token");
    const url = editItem ? `http://localhost:5000/api/workspace/departments/${editItem._id}` : "http://localhost:5000/api/workspace/departments";
    await fetch(url, { method: editItem ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, budget: Number(form.budget), workspace: "business" }) });
    setShowForm(false); setEditItem(null); setForm({ name: "", budget: "" }); loadData();
  };

  const confirmDelete = async () => {
    if (!deleteDept) return;
    try {
      const t = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/workspace/departments/${deleteDept._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      loadData();
    } catch (err) {
      console.error("Failed to delete department:", err);
    } finally {
      setDeleteDept(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Departments</h1><p className="text-sm text-[#6B7280] mt-0.5">Manage departments and budgets</p></div>
        <button onClick={() => { setEditItem(null); setForm({ name: "", budget: "" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all active:scale-[0.98] cursor-pointer"><Plus className="w-4 h-4" /> Add Department</button>
      </div>

      {loading ? <div className="text-center py-8 text-sm text-gray-400">Loading...</div> :
      depts.length === 0 ? <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center"><Building2 className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No departments</p></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depts.map(d => {
            const usage = d.budget > 0 ? Math.min((d.spent / d.budget) * 100, 100) : 0;
            return (
              <div key={d._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(d); setForm({ name: d.name, budget: d.budget }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteDept(d)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Delete Department"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#1F2937] mb-1">{d.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center mt-3">
                  <div><p className="text-[9px] text-[#9CA3AF]">Budget</p><p className="text-xs font-bold">{formatCurrency(d.budget)}</p></div>
                  <div><p className="text-[9px] text-[#9CA3AF]">Spent</p><p className="text-xs font-bold text-rose-600">{formatCurrency(d.spent)}</p></div>
                  <div><p className="text-[9px] text-[#9CA3AF]">Remaining</p><p className="text-xs font-bold text-emerald-600">{formatCurrency((d.budget || 0) - (d.spent || 0))}</p></div>
                </div>
                <div className="w-full h-1.5 bg-[#F4F6F8] rounded-full overflow-hidden mt-3"><div className={`h-full rounded-full ${usage > 90 ? 'bg-rose-500' : 'bg-[#005B4F]'}`} style={{ width: `${usage}%` }} /></div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editItem ? "Edit" : "Add"} Department</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <input type="number" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} min="0" className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <button type="submit" className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all">{editItem ? "Update" : "Add"}</button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteDept)}
        onClose={() => setDeleteDept(null)}
        onConfirm={confirmDelete}
        title="Delete Department"
        message={
          deleteDept
            ? `Are you sure you want to delete the ${deleteDept.name} department? Department budgets will be removed.`
            : "Are you sure you want to delete this department?"
        }
        confirmText="Delete Department"
        isDanger={true}
      />
    </div>
  );
}
