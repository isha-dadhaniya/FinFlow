import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  WalletCards,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronDown,
  ChevronRight,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Laptop,
  Shield,
  Home,
  Zap,
  Tv,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  ReceiptIndianRupee,
  Clock,
  Star,
  Layers,
  ArrowRight,
  Sparkles,
  PieChart,
} from "lucide-react";
import { Link } from "react-router-dom";
import CashFlowGraph from "../../components/dashboard/CashFlowGraph";

const API = "http://localhost:5000/api";
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

// Helper to draw SVG Donut Chart Paths
function DonutChart({ data, size = 160, innerRadius = 42, outerRadius = 65 }) {
  const total = data.reduce((sum, d) => sum + (d.amount || 0), 0) || 1;
  const center = size / 2;

  let currentAngle = -Math.PI / 2; // Start from 12 o'clock

  const slices = data.map((item) => {
    const sliceAngle = ((item.amount || 0) / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    // Outer arc points
    const x1 = center + outerRadius * Math.cos(startAngle);
    const y1 = center + outerRadius * Math.sin(startAngle);
    const x2 = center + outerRadius * Math.cos(endAngle);
    const y2 = center + outerRadius * Math.sin(endAngle);

    // Inner arc points
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

    return {
      ...item,
      pathData,
    };
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

export default function PersonalDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Month");
  const [filterOpen, setFilterOpen] = useState(false);

  // User Profile
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user.fullName ? user.fullName.split(" ")[0] : "Isha";

  // Dashboard Stats (100% Real from DB)
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    goalsSaved: 0,
  });

  // Real-time raw streams for Cash Flow Graph
  const [rawIncomes, setRawIncomes] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);

  // Recent Transactions (100% Real from DB)
  const [recentTxns, setRecentTxns] = useState([]);

  // Category Breakdown (100% Real from DB)
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Budgets (100% Real from DB)
  const [budgetData, setBudgetData] = useState({
    totalLimit: 0,
    totalSpent: 0,
    categories: [],
  });

  // Savings Goals (100% Real from DB)
  const [goals, setGoals] = useState([]);

  // Upcoming Payments (100% Real from DB)
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  useEffect(() => {
    loadData();

    // Real-time auto sync on tab focus or change
    const handleSync = () => loadData(false);
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("finflow_data_updated", handleSync);

    const interval = setInterval(() => {
      loadData(false); // Background silent poll
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

      const [accRes, incRes, expRes, txnRes, goalRes, billRes, loanRes, budRes] =
        await Promise.allSettled([
          fetch(`${API}/accounts?workspace=personal`, { headers: h }),
          fetch(`${API}/incomes?workspace=personal`, { headers: h }),
          fetch(`${API}/expenses?workspace=personal`, { headers: h }),
          fetch(`${API}/transactions?module=personal&limit=200`, { headers: h }),
          fetch(`${API}/savings-goals?workspace=personal`, { headers: h }),
          fetch(`${API}/bills?workspace=personal`, { headers: h }),
          fetch(`${API}/loans?workspace=personal`, { headers: h }),
          fetch(`${API}/budgets?module=personal`, { headers: h }),
        ]);

      let totalBalance = 0;
      let totalIncome = 0;
      let totalExpenses = 0;
      let goalsSaved = 0;

      // 1. Real Accounts Balance
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accounts = await accRes.value.json();
        if (Array.isArray(accounts) && accounts.length > 0) {
          totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
        }
      }

      // 2. Real Incomes
      let loadedIncomes = [];
      if (incRes.status === "fulfilled" && incRes.value.ok) {
        const incomes = await incRes.value.json();
        if (Array.isArray(incomes)) {
          loadedIncomes = incomes;
          totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          setRawIncomes(incomes);
        }
      }

      // 3. Real Expenses & Category Breakdown
      let loadedExpenses = [];
      if (expRes.status === "fulfilled" && expRes.value.ok) {
        const expenses = await expRes.value.json();
        if (Array.isArray(expenses)) {
          loadedExpenses = expenses;
          totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          setRawExpenses(expenses);

          // Group by category dynamically from real data
          const catMap = {};
          expenses.forEach((e) => {
            const c = e.category || "Other";
            catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
          });

          const colors = ["#10B981", "#F43F5E", "#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6"];
          const catEntries = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount], idx) => ({
              name,
              amount,
              percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
              color: colors[idx % colors.length],
            }));

          setExpenseCategories(catEntries);
        }
      }

      // 4. Real Transactions
      if (txnRes.status === "fulfilled" && txnRes.value.ok) {
        const txnData = await txnRes.value.json();
        const txns = txnData.transactions || (Array.isArray(txnData) ? txnData : []);
        setAllTransactions(txns);

        if (txns.length > 0) {
          setRecentTxns(
            txns.slice(0, 5).map((t) => ({
              _id: t._id || Math.random().toString(),
              title: t.title || t.description || "Transaction",
              category: t.category || "General",
              date: t.date
                ? new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                : "Today",
              amount: Number(t.amount) || 0,
              type: t.type || (t.amount < 0 ? "expense" : "income"),
            }))
          );
        } else {
          setRecentTxns([]);
        }
      }

      // 5. Real Savings Goals
      if (goalRes.status === "fulfilled" && goalRes.value.ok) {
        const goalData = await goalRes.value.json();
        if (Array.isArray(goalData)) {
          goalsSaved = goalData.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);
          setGoals(goalData.slice(0, 2));
        } else {
          setGoals([]);
        }
      }

      // 6. Real Upcoming Bills & Loans
      let combinedUpcoming = [];
      if (billRes.status === "fulfilled" && billRes.value.ok) {
        const bills = await billRes.value.json();
        if (Array.isArray(bills)) {
          bills
            .filter((b) => b.status !== "paid")
            .slice(0, 2)
            .forEach((b) => {
              combinedUpcoming.push({
                _id: b._id,
                title: b.title || b.name || "Bill Payment",
                dueDate: b.dueDate
                  ? `Due on ${new Date(b.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                  : "Due soon",
                amount: Number(b.amount) || 0,
                icon: b.category === "Electricity" ? Zap : Tv,
                color: b.category === "Electricity" ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-600",
              });
            });
        }
      }

      if (loanRes.status === "fulfilled" && loanRes.value.ok) {
        const loans = await loanRes.value.json();
        if (Array.isArray(loans)) {
          loans.slice(0, 1).forEach((l) => {
            combinedUpcoming.unshift({
              _id: l._id || "loan-1",
              title: `${l.loanName || "Loan"} EMI`,
              dueDate: l.nextDueDate
                ? `Due on ${new Date(l.nextDueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
                : "Due this month",
              amount: Number(l.emiAmount) || 0,
              icon: Home,
              color: "bg-rose-50 text-rose-500",
            });
          });
        }
      }

      setUpcomingPayments(combinedUpcoming.slice(0, 3));

      // 7. Real Budget Status
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
          // Compute from top expense categories
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

      setStats({
        totalBalance,
        totalIncome,
        totalExpenses,
        goalsSaved,
      });
    } catch (err) {
      console.error("Personal dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const topExpense = expenseCategories[0] || null;
  const totalBudgetLimit = budgetData.totalLimit || 0;
  const totalBudgetSpent = budgetData.totalSpent || stats.totalExpenses || 0;
  const budgetSpentPercent =
    totalBudgetLimit > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100)) : (totalBudgetSpent > 0 ? 100 : 0);
  const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

  return (
    <div className="space-y-6 w-full max-w-[1640px] mx-auto pb-10">
      {/* ─── 1. GREETING & HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <span>{greeting}, {firstName}!</span>
            <span className="text-2xl select-none">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6B7280] mt-1">
            Here's your real-time financial overview for {currentMonthYear}
          </p>
        </div>

        {/* Time Filter Pill */}
        <div className="relative self-start sm:self-auto">
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

      {/* ─── 2. TOP 4 STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Balance */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E6F5F1] text-[#00796B] flex items-center justify-center shrink-0 shadow-xs">
            <WalletCards className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL BALANCE</p>
            <p className="text-2xl font-bold text-[#00695C] tracking-tight mt-0.5">
              {formatCurrency(stats.totalBalance)}
            </p>
          </div>
        </div>

        {/* Card 2: Total Income */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E8F8F1] text-[#00A878] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL INCOME</p>
            <p className="text-2xl font-bold text-[#009B70] tracking-tight mt-0.5">
              {formatCurrency(stats.totalIncome)}
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
              {formatCurrency(stats.totalExpenses)}
            </p>
          </div>
        </div>

        {/* Card 4: Goals Saved */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#F7EEFF] text-[#A855F7] flex items-center justify-center shrink-0 shadow-xs">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">GOALS SAVED</p>
            <p className="text-2xl font-bold text-[#7E22CE] tracking-tight mt-0.5">
              {formatCurrency(stats.goalsSaved)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. MIDDLE ROW: CHARTS & OVERVIEW ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Cash Flow Graph (100% Real DB numbers) */}
        <CashFlowGraph
          totalIncome={stats.totalIncome}
          totalExpenses={stats.totalExpenses}
          incomes={rawIncomes}
          expenses={rawExpenses}
          transactions={allTransactions}
        />

        {/* Panel 2: Where Your Money Goes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <h2 className="text-base font-bold text-[#111827]">Where Your Money Goes</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Top Expense Categories</p>

            {/* Donut & Legend Container */}
            {expenseCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center">
                <PieChart className="w-10 h-10 text-gray-300 mb-2" />
                <p className="font-semibold text-gray-600">No Expenses Recorded</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Logged expenses will appear here dynamically</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 mt-4">
                {/* Donut Chart */}
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
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-[#6B7280]">Top spending category</p>
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

        {/* Panel 3: Monthly Budget */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Monthly Budget</h2>
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
                  ? `${formatCurrency(budgetRemaining)} remaining`
                  : "Set a budget limit to track targets"}
              </p>
            </div>

            {/* Category Budgets Breakdown List */}
            {budgetData.categories.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                No active category budgets set
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

          {/* Link to Budget */}
          <Link
            to="/app/personal/budget"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-2 border-t border-gray-100 transition-colors"
          >
            <span>View Budget Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── 4. BOTTOM ROW: RECENT TXNS, SAVINGS, UPCOMING PAYMENTS ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Recent Transactions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Recent Transactions</h2>
              <Link to="/app/personal/transactions" className="text-xs font-bold text-[#005B4F] hover:underline">
                View All
              </Link>
            </div>

            {/* Transactions List */}
            {recentTxns.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No recent transactions found
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
                        <p className="text-[10px] text-[#9CA3AF]">{tx.category}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-xs font-bold ${
                          tx.type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}₹{Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#9CA3AF]">{tx.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Button */}
          <Link
            to="/app/personal/transactions"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-3 border-t border-gray-100 transition-colors"
          >
            <span>View All Transactions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Panel 2: Savings Goals */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Savings Goals</h2>
              <Link to="/app/personal/savings-goals" className="text-xs font-bold text-[#005B4F] hover:underline">
                View All
              </Link>
            </div>

            {/* Goals List */}
            {goals.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No active savings goals found
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((g, idx) => {
                  const target = Number(g.targetAmount) || 1;
                  const current = Number(g.currentAmount) || 0;
                  const percent = Math.min(100, Math.round((current / target) * 100));
                  const remaining = Math.max(0, target - current);

                  return (
                    <div key={g._id || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base ${
                              idx === 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500"
                            }`}
                          >
                            {idx === 0 ? <Laptop className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-rose-500" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#111827]">{g.name}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              ₹{current.toLocaleString()} / ₹{target.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#005B4F]">{percent}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full bg-[#005B4F] rounded-full"
                        />
                      </div>
                      <p className="text-[10px] text-[#9CA3AF]">₹{remaining.toLocaleString()} remaining</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Button */}
          <Link
            to="/app/personal/savings-goals"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-3 border-t border-gray-100 transition-colors"
          >
            <span>View All Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Panel 3: Upcoming Payments */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827]">Upcoming Payments</h2>
              <Link to="/app/personal/bills" className="text-xs font-bold text-[#005B4F] hover:underline">
                View All
              </Link>
            </div>

            {/* Upcoming Payments List */}
            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No upcoming bills or EMI due
              </div>
            ) : (
              <div className="space-y-3.5">
                {upcomingPayments.map((item, idx) => (
                  <div key={item._id || idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                        <p className="text-[10px] text-[#9CA3AF]">{item.dueDate}</p>
                      </div>
                    </div>

                    <p className="text-xs font-extrabold text-rose-600">
                      ₹{Number(item.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Button */}
          <Link
            to="/app/personal/bills"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-3 border-t border-gray-100 transition-colors"
          >
            <span>View All Bills</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
