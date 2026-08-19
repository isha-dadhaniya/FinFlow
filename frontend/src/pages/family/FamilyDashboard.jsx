import React, { useState, useEffect } from "react";
import { Users, Wallet, TrendingDown, Scale, Heart, ReceiptIndianRupee, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function FamilyDashboard() {
  const [stats, setStats] = useState({ totalExpenses: 0, pendingSettlements: 0, memberCount: 0, goalProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const h = headers();
      const [membRes, settRes, goalRes, splitRes] = await Promise.allSettled([
        fetch(`${API}/family/members`, { headers: h }),
        fetch(`${API}/workspace/settlements?workspace=family`, { headers: h }),
        fetch(`${API}/workspace/family-goals?workspace=family`, { headers: h }),
        fetch(`${API}/group/splits`, { headers: h }),
      ]);

      let memberCount = 0, pendingSettlements = 0, goalProgress = 0, totalExpenses = 0;

      if (membRes.status === "fulfilled" && membRes.value.ok) {
        const members = await membRes.value.json();
        memberCount = (Array.isArray(members) ? members : []).length;
      }

      if (settRes.status === "fulfilled" && settRes.value.ok) {
        const settlements = await settRes.value.json();
        const arr = Array.isArray(settlements) ? settlements : [];
        pendingSettlements = arr.filter(s => s.status === "pending").reduce((sum, s) => sum + (s.amount || 0), 0);
      }

      if (goalRes.status === "fulfilled" && goalRes.value.ok) {
        const goals = await goalRes.value.json();
        const arr = Array.isArray(goals) ? goals : [];
        if (arr.length > 0) {
          const totalTarget = arr.reduce((s, g) => s + (g.targetAmount || 0), 0);
          const totalSaved = arr.reduce((s, g) => s + (g.currentAmount || 0), 0);
          goalProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
        }
      }

      if (splitRes.status === "fulfilled" && splitRes.value.ok) {
        const splits = await splitRes.value.json();
        const arr = Array.isArray(splits) ? splits : [];
        totalExpenses = arr.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
      }

      setStats({ totalExpenses, pendingSettlements, memberCount, goalProgress });
    } catch (err) { console.error("Family dashboard error:", err); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: "Family Expenses", value: formatCurrency(stats.totalExpenses), icon: TrendingDown, color: "bg-rose-500" },
    { label: "Pending Settlements", value: formatCurrency(stats.pendingSettlements), icon: Scale, color: "bg-amber-500" },
    { label: "Family Members", value: stats.memberCount, icon: Users, color: "bg-[#2A9D8F]" },
    { label: "Goals Progress", value: `${stats.goalProgress}%`, icon: Heart, color: "bg-pink-500" },
  ];

  const quickLinks = [
    { label: "Family Members", path: "/app/family/members", icon: Users, color: "text-[#2A9D8F] bg-[#2A9D8F]/10" },
    { label: "Shared Expenses", path: "/app/family/shared-expenses", icon: Wallet, color: "text-amber-600 bg-amber-50" },
    { label: "Settlements", path: "/app/family/settlements", icon: Scale, color: "text-blue-600 bg-blue-50" },
    { label: "Family Goals", path: "/app/family/goals", icon: Heart, color: "text-pink-600 bg-pink-50" },
    { label: "Bills", path: "/app/family/bills", icon: ReceiptIndianRupee, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Family Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage your shared family finances</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">{card.label}</p>
            <p className="text-xl font-bold text-[#1F2937]">{loading ? "—" : card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <Link key={link.label} to={link.path}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F4F6F8] transition-colors group">
              <div className={`w-9 h-9 rounded-lg ${link.color} flex items-center justify-center`}>
                <link.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-[#1F2937] group-hover:text-[#2A9D8F]">{link.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
