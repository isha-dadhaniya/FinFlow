import React, { useState, useEffect } from "react";
import { Plus, Scale, Check, Trash2, X, ArrowRight } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteSettlementId, setDeleteSettlementId] = useState(null);
  const [form, setForm] = useState({ fromMember: "", toMember: "", amount: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/workspace/settlements?workspace=family", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSettlements(Array.isArray(data) ? data : []);
    } catch { setSettlements([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch("http://localhost:5000/api/workspace/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, amount: Number(form.amount), workspace: "family" }),
    });
    setShowForm(false); setForm({ fromMember: "", toMember: "", amount: "" }); loadData();
  };

  const markSettled = async (id) => {
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/workspace/settlements/${id}/settle`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    loadData();
  };

  const confirmDelete = async () => {
    if (!deleteSettlementId) return;
    const token = localStorage.getItem("token");
    await fetch(`http://localhost:5000/api/workspace/settlements/${deleteSettlementId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDeleteSettlementId(null);
    loadData();
  };

  const pending = settlements.filter(s => s.status === "pending");
  const settled = settlements.filter(s => s.status === "settled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Settlements</h1><p className="text-sm text-[#6B7280] mt-0.5">Track who owes whom</p></div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer">
          <Plus className="w-4 h-4" /> Add Settlement
        </button>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-sm font-bold text-[#1F2937] mb-3">Pending ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 text-center text-sm text-gray-500">All settled! 🎉</div>
        ) : (
          <div className="space-y-2">
            {pending.map(s => (
              <div key={s._id} className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-xs font-bold">{s.fromMember?.[0]}</div>
                  <span className="text-sm font-semibold text-[#1F2937]">{s.fromMember}</span>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-sm font-semibold text-[#1F2937]">{s.toMember}</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-amber-600">{formatCurrency(s.amount)}</p>
                  <button onClick={() => markSettled(s._id)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 flex items-center gap-1 cursor-pointer">
                    <Check className="w-3 h-3" /> Mark Settled
                  </button>
                  <button onClick={() => setDeleteSettlementId(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settled History */}
      {settled.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-[#1F2937] mb-3">History ({settled.length})</h2>
          <div className="space-y-2">
            {settled.map(s => (
              <div key={s._id} className="bg-white rounded-2xl border border-[#E5E7EB] px-5 py-3 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{s.fromMember} → {s.toMember}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-500">{formatCurrency(s.amount)}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full">Settled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">Add Settlement</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Who owes (e.g. Son)" value={form.fromMember} onChange={(e) => setForm({ ...form, fromMember: e.target.value })} required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <input type="text" placeholder="Owes to (e.g. Father)" value={form.toMember} onChange={(e) => setForm({ ...form, toMember: e.target.value })} required
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0"
                className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]" />
              <button type="submit" className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 cursor-pointer">Add Settlement</button>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteSettlementId)}
        onClose={() => setDeleteSettlementId(null)}
        onConfirm={confirmDelete}
        title="Delete Settlement"
        message="Are you sure you want to delete this settlement record?"
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
}
