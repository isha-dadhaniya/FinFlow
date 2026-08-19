import React, { useState, useEffect } from "react";
import { Plus, Users, Trash2, Edit2, X, Check, Heart, Wallet, Target } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function MemberContributions() {
  const [contributions, setContributions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    memberName: "",
    amount: "",
    targetAmount: "",
    date: new Date().toISOString().split("T")[0],
    status: "Paid",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cRes, mRes] = await Promise.allSettled([
        fetch(`${API}/family/contributions`, { headers: headers() }),
        fetch(`${API}/family/members`, { headers: headers() }),
      ]);

      if (cRes.status === "fulfilled" && cRes.value.ok) {
        const cData = await cRes.value.json();
        setContributions(Array.isArray(cData) ? cData : []);
      }
      if (mRes.status === "fulfilled" && mRes.value.ok) {
        const mData = await mRes.value.json();
        setMembers(Array.isArray(mData) ? mData : []);
      }
    } catch (err) {
      console.error("Contributions load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/family/contributions`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          targetAmount: Number(form.targetAmount || form.amount),
        }),
      });
      setShowForm(false);
      setForm({ memberName: "", amount: "", targetAmount: "", date: new Date().toISOString().split("T")[0], status: "Paid" });
      loadData();
    } catch (err) {
      console.error("Save contribution error:", err);
    }
  };

  const totalPool = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Family Contributions</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Track individual contributions to shared household funds</p>
        </div>
        <button
          onClick={() => {
            setForm({
              memberName: members[0]?.name || "Father",
              amount: "",
              targetAmount: "",
              date: new Date().toISOString().split("T")[0],
              status: "Paid",
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors shadow-lg shadow-[#2A9D8F]/20"
        >
          <Plus className="w-4 h-4" /> Add Contribution
        </button>
      </div>

      {/* Pool Total Banner */}
      <div className="bg-gradient-to-r from-[#2A9D8F] to-[#21867A] rounded-2xl p-6 text-white shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Total Shared Pool Gathered</p>
          <p className="text-3xl font-extrabold mt-1">{formatCurrency(totalPool)}</p>
          <p className="text-xs text-white/70 mt-1">{contributions.length} Contributions logged</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
          <Wallet className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Contributions List */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading contributions...</div>
        ) : contributions.length === 0 ? (
          <div className="p-12 text-center">
            <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No member contributions recorded</p>
            <p className="text-xs text-gray-400 mt-1">Log member deposits to maintain a transparent family pool</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {contributions.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2A9D8F] text-white flex items-center justify-center font-bold text-sm">
                    {c.memberName ? c.memberName[0].toUpperCase() : "M"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1F2937]">{c.memberName}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      Deposit · {new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-extrabold text-emerald-600">+ {formatCurrency(c.amount)}</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 rounded-full">
                    {c.status || "Paid"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">Record Family Contribution</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Contributor</label>
                {members.length > 0 ? (
                  <select
                    value={form.memberName}
                    onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                    className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                  >
                    {members.map((m) => (
                      <option key={m._id} value={m.name}>{m.name} ({m.relationship || m.role})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Member Name (e.g. Dad)"
                    value={form.memberName}
                    onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="Amount deposited"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="1"
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#2A9D8F]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-[#2A9D8F] text-white text-sm font-semibold rounded-xl hover:bg-[#21867A] transition-colors"
              >
                Log Contribution
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
