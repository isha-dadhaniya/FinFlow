import React, { useState, useEffect } from "react";
import { Plus, RefreshCcw, Trash2, X } from "lucide-react";

const formatCurrency = (a) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);
const STATUSES = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Paid"];
const statusColors = { Draft: "bg-gray-100 text-gray-600", Submitted: "bg-blue-50 text-blue-600", "Under Review": "bg-amber-50 text-amber-600", Approved: "bg-emerald-50 text-emerald-600", Rejected: "bg-rose-50 text-rose-600", Paid: "bg-[#005B4F]/10 text-[#005B4F]" };

export default function Reimbursements() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeName: "", amount: "", description: "", category: "Other", status: "Draft" });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const t = localStorage.getItem("token"); const r = await fetch("http://localhost:5000/api/workspace/reimbursements?workspace=business", { headers: { Authorization: `Bearer ${t}` } }); const d = await r.json(); setItems(Array.isArray(d) ? d : []); } catch { setItems([]); } finally { setLoading(false); } };
  const handleSubmit = async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); await fetch("http://localhost:5000/api/workspace/reimbursements", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, amount: Number(form.amount), workspace: "business" }) }); setShowForm(false); setForm({ employeeName: "", amount: "", description: "", category: "Other", status: "Draft" }); loadData(); };
  const updateStatus = async (id, status) => { const t = localStorage.getItem("token"); await fetch(`http://localhost:5000/api/workspace/reimbursements/${id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ status }) }); loadData(); };
  const del = async (id) => { if (!confirm("Delete?")) return; const t = localStorage.getItem("token"); await fetch(`http://localhost:5000/api/workspace/reimbursements/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); loadData(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Reimbursements</h1><p className="text-sm text-[#6B7280] mt-0.5">Manage expense claims</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all active:scale-[0.98] cursor-pointer"><Plus className="w-4 h-4" /> New Claim</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div> :
        items.length === 0 ? <div className="p-12 text-center"><RefreshCcw className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No reimbursement claims</p></div> : (
          <div className="divide-y divide-[#F4F6F8]">
            {items.map(item => (
              <div key={item._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><RefreshCcw className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">{formatCurrency(item.amount)}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{item.employeeName} · {item.description || item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border-0 outline-none cursor-pointer ${statusColors[item.status] || statusColors.Draft}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => del(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">New Reimbursement</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Employee Name" value={form.employeeName} onChange={(e) => setForm({ ...form, employeeName: e.target.value })} required className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-3 border border-[#E5E7EB] rounded-xl text-sm resize-none outline-none focus:border-[#005B4F]" />
              <button type="submit" className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all">Submit Claim</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
