import React, { useState, useEffect, useMemo } from "react";
import {
  WalletCards,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  Users,
  FolderKanban,
  Store,
  FileText,
  ClipboardCheck,
  CreditCard,
  ChevronDown,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart,
  Plus,
  Landmark,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import CashFlowGraph from "../../components/dashboard/CashFlowGraph";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

// Helper for SVG Donut Chart with dynamic real slices
function DonutChart({ data = [], size = 135, innerRadius = 36, outerRadius = 58 }) {
  const total = data.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const center = size / 2;

  if (total === 0 || data.length === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 drop-shadow-xs">
        <circle
          cx={center}
          cy={center}
          r={(outerRadius + innerRadius) / 2}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={outerRadius - innerRadius}
        />
      </svg>
    );
  }

  let currentAngle = -Math.PI / 2; // Start at 12 o'clock

  const slices = data.map((item) => {
    const sliceAngle = ((Number(item.amount) || 0) / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const x1 = center + outerRadius * Math.cos(startAngle);
    const y1 = center + outerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(endAngle);
    const y2 = center + outerRadius * Math.sin(endAngle);

    const x3 = center + innerRadius * Math.cos(endAngle);
    const y3 = center + innerRadius * Math.sin(endAngle);
    const x4 = center + innerRadius * Math.cos(startAngle);
    const y4 = center + innerRadius * Math.sin(startAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");

    return { ...item, pathData };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 drop-shadow-xs">
      {slices.map((slice, i) => (
        <path
          key={i}
          d={slice.pathData}
          fill={slice.color}
          className="transition-all duration-300 hover:opacity-90 cursor-pointer"
        />
      ))}
    </svg>
  );
}

export default function BusinessDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Month");
  const [filterOpen, setFilterOpen] = useState(false);

  // User Profile & Business Workspace Meta
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user.fullName ? user.fullName.split(" ")[0] : "Isha";

  const businessMeta = useMemo(() => {
    try {
      const raw = localStorage.getItem("finflow_workspaces_config");
      const parsed = JSON.parse(raw || "{}");
      return parsed.business || {};
    } catch {
      return {};
    }
  }, []);

  const businessName = businessMeta.businessName || businessMeta.name || "My Business";
  const businessLogo = businessMeta.businessLogo || businessMeta.logo || null;

  // Real Financial Streams
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  const [rawIncomes, setRawIncomes] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  // Business Entities Stats
  const [businessEntities, setBusinessEntities] = useState({
    employees: 0,
    departments: 0,
    projects: 0,
    vendors: 0,
    invoices: 0,
    pendingApprovals: 0,
  });

  // Budgets
  const [budgetData, setBudgetData] = useState({
    totalLimit: 0,
    totalSpent: 0,
    categories: [],
  });

  // Upcoming Loans / EMI
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  }, []);

  // ─── DYNAMIC TIMEFRAME FILTER ENGINE ────────────────────────────
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (timeFilter === "This Month") {
      const start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const label = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return { start, end, label: `for ${label}` };
    }

    if (timeFilter === "Last Month") {
      const start = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
      const label = start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      return { start, end, label: `for ${label}` };
    }

    if (timeFilter === "Last 3 Months") {
      const start = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      const startMo = start.toLocaleDateString("en-US", { month: "short" });
      const endMo = now.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      return { start, end, label: `for the last 3 months (${startMo} – ${endMo})` };
    }

    if (timeFilter === "This Year") {
      const start = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      return { start, end, label: `for ${currentYear}` };
    }

    return { start: new Date(0), end: new Date(8640000000000000), label: "" };
  }, [timeFilter]);

  const isWithinRange = (dateVal, start, end) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return !isNaN(d.getTime()) && d >= start && d <= end;
  };

  // Filtered raw streams based on active timeframe
  const filteredIncomes = useMemo(() => {
    return rawIncomes.filter((i) => isWithinRange(i.date || i.createdAt, dateRange.start, dateRange.end));
  }, [rawIncomes, dateRange]);

  const filteredExpenses = useMemo(() => {
    return rawExpenses.filter((e) => isWithinRange(e.date || e.createdAt, dateRange.start, dateRange.end));
  }, [rawExpenses, dateRange]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => isWithinRange(t.date || t.createdAt, dateRange.start, dateRange.end));
  }, [allTransactions, dateRange]);

  // Recalculated metrics for the active timeframe
  const effectiveIncome = useMemo(() => {
    if (filteredIncomes.length > 0) {
      return filteredIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    }
    return filteredTransactions
      .filter((t) => t.type === "income" || (Number(t.amount) > 0 && t.type !== "expense"))
      .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  }, [filteredIncomes, filteredTransactions]);

  const effectiveExpenses = useMemo(() => {
    if (filteredExpenses.length > 0) {
      return filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    }
    return filteredTransactions
      .filter((t) => t.type === "expense" || Number(t.amount) < 0)
      .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  }, [filteredExpenses, filteredTransactions]);

  const effectiveBalance = useMemo(() => {
    return stats.totalBalance || (effectiveIncome - effectiveExpenses);
  }, [stats.totalBalance, effectiveIncome, effectiveExpenses]);

  const netProfit = useMemo(() => {
    return effectiveIncome - effectiveExpenses;
  }, [effectiveIncome, effectiveExpenses]);

  // Dynamic Category Breakdown based on active timeframe
  const expenseCategories = useMemo(() => {
    const catMap = {};
    if (filteredExpenses.length > 0) {
      filteredExpenses.forEach((e) => {
        const c = e.category || "General";
        catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
      });
    } else {
      filteredTransactions
        .filter((t) => t.type === "expense" || Number(t.amount) < 0)
        .forEach((t) => {
          const c = t.category || "General";
          catMap[c] = (catMap[c] || 0) + Math.abs(Number(t.amount) || 0);
        });
    }

    const total = Object.values(catMap).reduce((s, a) => s + a, 0);
    const colors = ["#005B4F", "#2563EB", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#6B7280"];
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount], idx) => ({
        name,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
        color: colors[idx % colors.length],
      }));
  }, [filteredExpenses, filteredTransactions]);

  // Dynamic Recent Transactions based on active timeframe
  const recentTxns = useMemo(() => {
    const list = filteredTransactions.length > 0 ? filteredTransactions : [];
    return list.slice(0, 5).map((t) => ({
      _id: t._id || Math.random().toString(),
      title: t.title || t.description || "Transaction",
      category: t.category || "Business",
      date: t.date
        ? new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "Today",
      amount: Math.abs(Number(t.amount) || 0),
      type: t.type || (Number(t.amount) < 0 ? "expense" : "income"),
    }));
  }, [filteredTransactions]);

  useEffect(() => {
    loadData();

    // Auto sync on tab focus or change
    const handleSync = () => loadData(false);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("finflow_data_updated", handleSync);

    const interval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("finflow_data_updated", handleSync);
      clearInterval(interval);
    };
  }, []);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const h = headers();

      const [
        accRes,
        incRes,
        expRes,
        txnRes,
        loanRes,
        budRes,
        empRes,
        deptRes,
        projRes,
        vendRes,
        invRes,
        reimbRes,
      ] = await Promise.allSettled([
        fetch(`${API}/accounts?workspace=business`, { headers: h }),
        fetch(`${API}/incomes?workspace=business`, { headers: h }),
        fetch(`${API}/expenses?workspace=business`, { headers: h }),
        fetch(`${API}/transactions?module=business&limit=200`, { headers: h }),
        fetch(`${API}/loans?workspace=business`, { headers: h }),
        fetch(`${API}/budgets?module=business`, { headers: h }),
        fetch(`${API}/workspace/employees?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/projects?workspace=business`, { headers: h }),
        fetch(`${API}/workspace/vendors?workspace=business`, { headers: h }),
        fetch(`${API}/business/invoices`, { headers: h }),
        fetch(`${API}/workspace/reimbursements?workspace=business`, { headers: h }),
      ]);

      let totalBalance = 0;
      let totalIncome = 0;
      let totalExpenses = 0;

      // 1. Business Bank Accounts Balance
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accounts = await accRes.value.json();
        if (Array.isArray(accounts) && accounts.length > 0) {
          totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
        }
      }

      // 2. Business Incomes / Revenue
      let loadedIncomes = [];
      if (incRes.status === "fulfilled" && incRes.value.ok) {
        const incomes = await incRes.value.json();
        if (Array.isArray(incomes)) {
          loadedIncomes = incomes;
          totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          setRawIncomes(incomes);
        }
      }

      // 3. Business Expenses
      let loadedExpenses = [];
      if (expRes.status === "fulfilled" && expRes.value.ok) {
        const expenses = await expRes.value.json();
        if (Array.isArray(expenses)) {
          loadedExpenses = expenses;
          totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          setRawExpenses(expenses);
        }
      }

      // 4. Business Transactions
      if (txnRes.status === "fulfilled" && txnRes.value.ok) {
        const txnData = await txnRes.value.json();
        const txns = txnData.transactions || (Array.isArray(txnData) ? txnData : []);
        setAllTransactions(txns);
      }

      // 5. Business Loans & EMI
      let combinedUpcoming = [];
      if (loanRes.status === "fulfilled" && loanRes.value.ok) {
        const loans = await loanRes.value.json();
        if (Array.isArray(loans)) {
          loans.slice(0, 3).forEach((l, idx) => {
            combinedUpcoming.push({
              _id: l._id || `loan-${idx}`,
              title: `${l.loanName || l.name || "Corporate Loan"} EMI`,
              dueDate: l.nextDueDate
                ? `Due on ${new Date(l.nextDueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                : "Due this month",
              amount: Number(l.emiAmount || l.emi || l.monthlyPayment || 0),
              icon: Landmark,
              color: "bg-rose-50 text-rose-600",
            });
          });
        }
      }
      setUpcomingPayments(combinedUpcoming);

      // 6. Business Budgets
      if (budRes.status === "fulfilled" && budRes.value.ok) {
        const bud = await budRes.value.json();
        const totalLimit = bud?.totalLimit || 0;
        const totalSpent = bud?.totalSpent || totalExpenses;

        let categories = [];
        if (Array.isArray(bud?.categoryBudgets) && bud.categoryBudgets.length > 0) {
          categories = bud.categoryBudgets.slice(0, 3).map((cb) => ({
            name: cb.category,
            spent: cb.spentAmount || 0,
            limit: cb.limitAmount || 1,
            percentage: cb.percentUsed || 0,
            icon: Clock,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-50",
          }));
        } else if (loadedExpenses.length > 0) {
          const catMap = {};
          loadedExpenses.forEach((e) => {
            const c = e.category || "General";
            catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
          });
          categories = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, spent]) => ({
              name,
              spent,
              limit: totalLimit > 0 ? Math.round(totalLimit / 3) : spent,
              percentage: totalLimit > 0 ? Math.min(100, Math.round((spent / (totalLimit / 3)) * 100)) : 100,
              icon: Clock,
              iconColor: "text-emerald-600",
              iconBg: "bg-emerald-50",
            }));
        }

        setBudgetData({
          totalLimit,
          totalSpent,
          categories,
        });
      }

      // 7. Business Counts (Employees, Depts, Projects, Vendors, Invoices, Approvals)
      const countRes = async (r) => {
        if (r.status === "fulfilled" && r.value.ok) {
          const d = await r.value.json();
          return (Array.isArray(d) ? d : d.invoices || d.reimbursements || []).length;
        }
        return 0;
      };

      setBusinessEntities({
        employees: await countRes(empRes),
        departments: await countRes(deptRes),
        projects: await countRes(projRes),
        vendors: await countRes(vendRes),
        invoices: await countRes(invRes),
        pendingApprovals: await countRes(reimbRes),
      });

      setStats({
        totalBalance,
        totalIncome,
        totalExpenses,
      });
    } catch (err) {
      console.error("Business dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const topExpense = expenseCategories[0] || null;
  const totalBudgetLimit = budgetData.totalLimit || 0;
  const totalBudgetSpent = budgetData.totalSpent || effectiveExpenses || 0;
  const budgetSpentPercent =
    totalBudgetLimit > 0
      ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100))
      : totalBudgetSpent > 0
      ? 100
      : 0;
  const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  return (
    <div className="space-y-6 w-full max-w-[1640px] mx-auto pb-10">
      {/* ─── 1. GREETING & HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {businessLogo ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-200 bg-white shrink-0 shadow-xs">
              <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#005B4F] border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
              {greeting}, {firstName}!
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#6B7280] mt-0.5">
              Company financial overview {dateRange.label}
            </p>
          </div>
        </div>

        {/* Time Filter Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Time Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-semibold text-[#111827] hover:bg-gray-50 shadow-xs transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-[#111827]" />
              <span>{timeFilter}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#E5E7EB] py-1 z-30 animate-[scaleIn_0.15s_ease-out]">
                {["This Month", "Last Month", "Last 3 Months", "This Year"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setTimeFilter(opt);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors ${
                      timeFilter === opt ? "bg-[#005B4F]/10 text-[#005B4F] font-bold" : "text-[#374151] hover:bg-gray-50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. TOP 4 STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Operating Balance */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E6F5F1] text-[#00796B] flex items-center justify-center shrink-0 shadow-xs">
            <WalletCards className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">OPERATING BALANCE</p>
            <p className="text-2xl font-bold text-[#00695C] tracking-tight mt-0.5">
              {formatCurrency(effectiveBalance)}
            </p>
          </div>
        </div>

        {/* Card 2: Total Revenue / Income */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E8F8F1] text-[#00A878] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL REVENUE</p>
            <p className="text-2xl font-bold text-[#009B70] tracking-tight mt-0.5">
              {formatCurrency(effectiveIncome)}
            </p>
          </div>
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FDECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL EXPENSES</p>
            <p className="text-2xl font-bold text-[#E53935] tracking-tight mt-0.5">
              {formatCurrency(effectiveExpenses)}
            </p>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            netProfit >= 0 ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#FFF1F2] text-[#E11D48]"
          }`}>
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">NET PROFIT / CASH FLOW</p>
            <p className={`text-2xl font-bold tracking-tight mt-0.5 ${
              netProfit >= 0 ? "text-[#1D4ED8]" : "text-[#BE123C]"
            }`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. MIDDLE ROW: CHARTS & OVERVIEW ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Cash Flow Graph */}
        <CashFlowGraph
          totalIncome={effectiveIncome}
          totalExpenses={effectiveExpenses}
          incomes={rawIncomes}
          expenses={rawExpenses}
          transactions={allTransactions}
        />

        {/* Panel 2: Where Company Money Goes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Where Company Money Goes</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Top Business Expense Categories</p>

            {/* Donut & Legend Container */}
            {expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center">
                <PieChart className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600">No Expenses Recorded</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Company expenses will appear here dynamically</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 mt-4">
                <DonutChart data={expenseCategories} size={135} innerRadius={36} outerRadius={58} />

                {/* Legend List */}
                <div className="space-y-1.5 flex-1 pl-2">
                  {expenseCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-[#374151]">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#111827]">₹{cat.amount.toLocaleString()}</span>
                        <span className="text-[#9CA3AF] text-[11px] w-7 text-right">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Highlight: Top Spending Category */}
          {topExpense ? (
            <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-3 flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-amber-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">Highest cost center</p>
                  <p className="text-xs font-bold text-[#111827]">{topExpense.name}</p>
                </div>
              </div>
              <p className="text-xs font-bold text-[#111827]">
                ₹{topExpense.amount.toLocaleString()} ({topExpense.percentage}%)
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-center text-xs text-gray-400 mt-4">
              No category spending recorded yet
            </div>
          )}
        </div>

        {/* Panel 3: Operating Budget & Financial Targets */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Operating Budget</h2>
              <span className="text-xs font-bold text-[#005B4F] bg-[#005B4F]/10 px-2 py-0.5 rounded-md">
                {budgetSpentPercent}%
              </span>
            </div>

            {/* Overall Spent vs Limit */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#111827]">
                  {totalBudgetLimit > 0
                    ? `${formatCurrency(totalBudgetSpent)} spent of ${formatCurrency(totalBudgetLimit)}`
                    : `${formatCurrency(totalBudgetSpent)} spent (No limit set)`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${budgetSpentPercent}%` }}
                  className="h-full bg-[#005B4F] rounded-full transition-all duration-500"
                />
              </div>
              <p className="text-[11px] font-medium text-[#6B7280] mt-1">
                {totalBudgetLimit > 0
                  ? `${formatCurrency(budgetRemaining)} remaining in budget`
                  : "Set departmental limits to track spending targets"}
              </p>
            </div>

            {/* Category Budgets Breakdown List */}
            {budgetData.categories.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No active department budgets set
              </div>
            ) : (
              <div className="space-y-3 mt-4 pt-1">
                {budgetData.categories.map((cb, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-md ${cb.iconBg} ${cb.iconColor} flex items-center justify-center`}>
                          <cb.icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-[#1F2937]">{cb.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#6B7280] text-[11px] font-medium">
                          ₹{cb.spent.toLocaleString()} / ₹{cb.limit.toLocaleString()}
                        </span>
                        <span className="font-bold text-[#005B4F] text-[11px]">{cb.percentage}%</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, cb.percentage)}%` }}
                        className="h-full bg-[#005B4F] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/app/business/budgets"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-2 border-t border-gray-100 transition-colors"
          >
            <span>View Budget Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── 4. BOTTOM ROW: TRANSACTIONS, OPERATIONS HUB, OBLIGATIONS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Recent Transactions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Recent Transactions</h2>
              <Link to="/app/business/expenses" className="text-xs font-bold text-[#005B4F] hover:underline">
                View All
              </Link>
            </div>

            {/* Transactions List */}
            {recentTxns.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No transactions recorded for {timeFilter.toLowerCase()}
              </div>
            ) : (
              <div className="space-y-3">
                {recentTxns.map((tx) => (
                  <div key={tx._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {tx.type === "income" ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111827]">{tx.title}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{tx.category} • {tx.date}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-bold ${
                          tx.type === "income" ? "text-[#005B4F]" : "text-[#EF4444]"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/app/business/expenses"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-2 border-t border-gray-100 transition-colors"
          >
            <span>All Business Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Panel 2: Business Operations Hub */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-base font-bold text-[#111827]">Operations Hub</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                Live Overview
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Employees */}
              <Link
                to="/app/business/employees"
                className="p-3 rounded-xl border border-gray-100 hover:border-[#005B4F]/40 hover:bg-[#005B4F]/5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-base font-extrabold text-[#111827] group-hover:text-[#005B4F]">
                    {businessEntities.employees}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-2">Employees</p>
              </Link>

              {/* Departments */}
              <Link
                to="/app/business/departments"
                className="p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="text-base font-extrabold text-[#111827] group-hover:text-purple-600">
                    {businessEntities.departments}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-2">Departments</p>
              </Link>

              {/* Projects */}
              <Link
                to="/app/business/projects"
                className="p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="text-base font-extrabold text-[#111827] group-hover:text-indigo-600">
                    {businessEntities.projects}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-2">Active Projects</p>
              </Link>

              {/* Vendors */}
              <Link
                to="/app/business/vendors"
                className="p-3 rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <span className="text-base font-extrabold text-[#111827] group-hover:text-amber-600">
                    {businessEntities.vendors}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-2">Suppliers & Vendors</p>
              </Link>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
            <Link
              to="/app/business/approvals"
              className="text-xs font-bold text-gray-600 hover:text-[#005B4F] flex items-center gap-1.5"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Pending Approvals:</span>
              <span className="font-extrabold text-[#005B4F] bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-100">
                {businessEntities.pendingApprovals}
              </span>
            </Link>
            <Link
              to="/app/business/invoices"
              className="text-xs font-bold text-gray-600 hover:text-[#005B4F] flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Invoices:</span>
              <span className="font-extrabold text-[#111827]">
                {businessEntities.invoices}
              </span>
            </Link>
          </div>
        </div>

        {/* Panel 3: Upcoming Obligations & Corporate Loans EMI */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Upcoming Liabilities</h2>
              <Link to="/app/business/loans-emi" className="text-xs font-bold text-[#005B4F] hover:underline">
                Manage
              </Link>
            </div>

            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-gray-700">No Pending Loan EMIs</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Corporate loans and liabilities will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((pay) => (
                  <div key={pay._id} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${pay.color} flex items-center justify-center shrink-0`}>
                        <pay.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111827]">{pay.title}</p>
                        <p className="text-[10px] text-gray-500">{pay.dueDate}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[#E53935]">
                      {formatCurrency(pay.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/app/business/loans-emi"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-2 border-t border-gray-100 transition-colors"
          >
            <span>View All Loans & Schedules</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
