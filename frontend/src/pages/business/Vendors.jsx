import React, { useState, useEffect } from "react";
import { Plus, Store, Trash2, Edit2, X } from "lucide-react";

const formatCurrency = (a) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);

export default function Vendors() {
  const [vendors, setVendors] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", gstNumber: "", contact: "", email: "", category: "General" });

  useEffect(() => { loadData(); }, []);
  const loadData = async () => { try { const t = localStorage.getItem("token"); const r = await fetch("http://localhost:5000/api/workspace/vendors?workspace=business", { headers: { Authorization: `Bearer ${t}` } }); const d = await r.json(); setVendors(Array.isArray(d) ? d : []); } catch { setVendors([]); } finally { setLoading(false); } };
  const handleSubmit = async (e) => { e.preventDefault(); const t = localStorage.getItem("token"); const url = editItem ? `http://localhost:5000/api/workspace/vendors/${editItem._id}` : "http://localhost:5000/api/workspace/vendors"; await fetch(url, { method: editItem ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, workspace: "business" }) }); setShowForm(false); setEditItem(null); setForm({ name: "", gstNumber: "", contact: "", email: "", category: "General" }); loadData(); };
  const del = async (id) => { if (!confirm("Delete?")) return; const t = localStorage.getItem("token"); await fetch(`http://localhost:5000/api/workspace/vendors/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); loadData(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Vendors</h1><p className="text-sm text-[#6B7280] mt-0.5">Track vendor spending and contacts</p></div>
        <button onClick={() => { setEditItem(null); setForm({ name: "", gstNumber: "", contact: "", email: "", category: "General" }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] shadow-lg shadow-[#1E232A]/20"><Plus className="w-4 h-4" /> Add Vendor</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div> :
        vendors.length === 0 ? <div className="p-12 text-center"><Store className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No vendors added</p></div> : (
          <div className="divide-y divide-[#F4F6F8]">
            {vendors.map(v => (
              <div key={v._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><Store className="w-4 h-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">{v.name}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{v.category} · GST: {v.gstNumber || "N/A"} · {v.contact}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#1F2937]">{formatCurrency(v.totalSpending)}</p>
                    <p className="text-[10px] text-[#9CA3AF]">Total Spending</p>
                  </div>
                  <button onClick={() => { setEditItem(v); setForm({ name: v.name, gstNumber: v.gstNumber, contact: v.contact, email: v.email, category: v.category }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(v._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editItem ? "Edit" : "Add"} Vendor</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              <input type="text" placeholder="GST Number" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm" />
              </div>
              <button type="submit" className="w-full h-12 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E]">{editItem ? "Update" : "Add"} Vendor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
