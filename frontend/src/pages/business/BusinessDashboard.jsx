import React, { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, ClipboardCheck, RefreshCcw, Building2, FolderKanban, Users, ChevronRight, Store } from "lucide-react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

const formatCurrency = (a) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a || 0);

export default function BusinessDashboard() {
  const [stats, setStats] = useState({ employees: 0, departments: 0, projects: 0, vendors: 0, pendingReimbursements: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const h = headers();
      const [empRes, deptRes, projRes, vendRes, reimbRes] = await Promise.allSettled([
        fetch(`${API}/workspace/employees?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/projects?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/vendors?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/reimbursements?workspace=business`, { headers: h }),
      ]);

      const count = async (r) => {
        if (r.status === "fulfilled" && r.value.ok) {
          const d = await r.value.json();
          return (Array.isArray(d) ? d : []).length;
        }
        return 0;
      };

      let pendingReimbursements = 0;
      if (reimbRes.status === "fulfilled" && reimbRes.value.ok) {
        const reimbs = await reimbRes.value.json();
        pendingReimbursements = (Array.isArray(reimbs) ? reimbs : []).filter(r => r.status !== "Paid" && r.status !== "Rejected").reduce((s, r) => s + (r.amount || 0), 0);
      }

      setStats({
        employees: await count(empRes),
        departments: await count(deptRes),
        projects: await count(projRes),
        vendors: await count(vendRes),
        pendingReimbursements,
      });
    } catch (err) { console.error("Business dashboard error:", err); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: "Employees", value: stats.employees, icon: Users, color: "bg-[#1E232A]" },
    { label: "Departments", value: stats.departments, icon: Building2, color: "bg-purple-600" },
    { label: "Active Projects", value: stats.projects, icon: FolderKanban, color: "bg-indigo-600" },
    { label: "Pending Claims", value: formatCurrency(stats.pendingReimbursements), icon: RefreshCcw, color: "bg-amber-500" },
  ];

  const quickLinks = [
    { label: "Employees", path: "/app/business/employees", icon: Users, color: "text-[#1E232A] bg-[#1E232A]/10" },
    { label: "Departments", path: "/app/business/departments", icon: Building2, color: "text-purple-600 bg-purple-50" },
    { label: "Projects", path: "/app/business/projects", icon: FolderKanban, color: "text-indigo-600 bg-indigo-50" },
    { label: "Vendors", path: "/app/business/vendors", icon: Store, color: "text-orange-600 bg-orange-50" },
    { label: "Reimbursements", path: "/app/business/reimbursements", icon: RefreshCcw, color: "text-blue-600 bg-blue-50" },
    { label: "Invoices", path: "/app/business/invoice-management", icon: ClipboardCheck, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight">Business Dashboard</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Company financial overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}><s.icon className="w-5 h-5 text-white" /></div>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-xl font-bold text-[#1F2937]">{loading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
        <h2 className="text-base font-bold text-[#1F2937] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {quickLinks.map((l) => (
            <Link key={l.label} to={l.path} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F4F6F8] transition-colors group">
              <div className={`w-9 h-9 rounded-lg ${l.color} flex items-center justify-center`}><l.icon className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-[#1F2937] group-hover:text-[#005B4F]">{l.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
