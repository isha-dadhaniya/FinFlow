import React, { useState, useEffect } from "react";
import { Plus, FolderKanban, Trash2, Edit2, X } from "lucide-react";

const formatCurrency = (a) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);
const statusColors = { active: "bg-emerald-50 text-emerald-600", completed: "bg-blue-50 text-blue-600", "on-hold": "bg-amber-50 text-amber-600" };

export default function Projects() {
  const [projects, setProjects] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", client: "", budget: "", startDate: "", endDate: "", status: "active" });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const t = localStorage.getItem("token"); const r = await fetch("http://localhost:5000/api/workspace/projects?workspace=business", { headers: { Authorization: `Bearer ${t}` } }); const d = await r.json(); setProjects(Array.isArray(d) ? d : []); } catch { setProjects([]); } finally { setLoading(false); } };
  const handleSubmit = async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); const url = editItem ? `http://localhost:5000/api/workspace/projects/${editItem._id}` : "http://localhost:5000/api/workspace/projects"; await fetch(url, { method: editItem ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, budget: Number(form.budget), workspace: "business" }) }); setShowForm(false); setEditItem(null); setForm({ name: "", client: "", budget: "", startDate: "", endDate: "", status: "active" }); loadData(); };
  const del = async (id) => { if (!confirm("Delete?")) return; const t = localStorage.getItem("token"); await fetch(`http://localhost:5000/api/workspace/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); loadData(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Projects</h1><p className="text-sm text-[#6B7280] mt-0.5">Track project budgets and costs</p></div>
        <button onClick={() => { setEditItem(null); setForm({ name: "", client: "", budget: "", startDate: "", endDate: "", status: "active" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] shadow-lg shadow-[#1E232A]/20"><Plus className="w-4 h-4" /> New Project</button>
      </div>

      {loading ? <div className="text-center py-8 text-sm text-gray-400">Loading...</div> :
      projects.length === 0 ? <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center"><FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No projects yet</p></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map(p => {
            const remaining = (p.budget || 0) - (p.expenses || 0);
            const usage = p.budget > 0 ? Math.min((p.expenses / p.budget) * 100, 100) : 0;
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[#1F2937]">{p.name}</p>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColors[p.status] || statusColors.active}`}>{p.status}</span>
                    <button onClick={() => { setEditItem(p); setForm({ name: p.name, client: p.client, budget: p.budget, startDate: p.startDate?.split("T")[0] || "", endDate: p.endDate?.split("T")[0] || "", status: p.status }); setShowForm(true); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => del(p._id)} className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                <p className="text-[11px] text-[#9CA3AF] mb-3">{p.client || "No client"}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-[9px] text-[#9CA3AF]">Budget</p><p className="text-xs font-bold">{formatCurrency(p.budget)}</p></div>
                  <div><p className="text-[9px] text-[#9CA3AF]">Expenses</p><p className="text-xs font-bold text-rose-600">{formatCurrency(p.expenses)}</p></div>
                  <div><p className="text-[9px] text-[#9CA3AF]">Remaining</p><p className="text-xs font-bold text-emerald-600">{formatCurrency(remaining)}</p></div>
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
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editItem ? "Edit" : "New"} Project</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Project Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              <input type="text" placeholder="Client" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              <input type="number" placeholder="Budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} min="0" className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full h-12 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E]">{editItem ? "Update" : "Create"} Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
