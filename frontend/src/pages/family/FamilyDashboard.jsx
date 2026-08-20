import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Scale,
  Heart,
  ChevronDown,
  ChevronRight,
  Calendar,
  ArrowRight,
  Home,
  Car,
  GraduationCap,
  ShoppingBag,
  Bus,
  Zap,
  UtensilsCrossed,
  Tv,
  MoreHorizontal,
  Star,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ReceiptIndianRupee,
  CheckCircle2,
  Plus,
  Landmark,
  PiggyBank,
} from "lucide-react";
import { Link } from "react-router-dom";

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

// Helper for category icon mapping
const getCategoryMeta = (catName) => {
  const normalized = (catName || "").toLowerCase();
  if (normalized.includes("shop")) return { icon: ShoppingBag, color: "#10B981" };
  if (normalized.includes("transport") || normalized.includes("travel") || normalized.includes("fuel") || normalized.includes("bus")) return { icon: Bus, color: "#F59E0B" };
  if (normalized.includes("entertain") || normalized.includes("movie") || normalized.includes("stream") || normalized.includes("tv")) return { icon: Tv, color: "#8B5CF6" };
  if (normalized.includes("food") || normalized.includes("dine") || normalized.includes("dining") || normalized.includes("restaurant") || normalized.includes("snack")) return { icon: UtensilsCrossed, color: "#EC4899" };
  if (normalized.includes("util") || normalized.includes("electric") || normalized.includes("bill") || normalized.includes("power") || normalized.includes("water") || normalized.includes("gas")) return { icon: Zap, color: "#005B4F" };
  if (normalized.includes("health") || normalized.includes("med") || normalized.includes("doctor") || normalized.includes("hospital")) return { icon: Heart, color: "#EF4444" };
  if (normalized.includes("educat") || normalized.includes("school") || normalized.includes("college") || normalized.includes("course") || normalized.includes("tuition")) return { icon: GraduationCap, color: "#3B82F6" };
  if (normalized.includes("rent") || normalized.includes("house") || normalized.includes("mortgage") || normalized.includes("home")) return { icon: Home, color: "#0D9488" };
  if (normalized.includes("car") || normalized.includes("vehicle") || normalized.includes("auto")) return { icon: Car, color: "#6366F1" };
  if (normalized.includes("grocer")) return { icon: ShoppingBag, color: "#10B981" };
  return { icon: MoreHorizontal, color: "#6B7280" };
};

// Helper for SVG Donut Chart with dynamic real slices & center total text
function DonutChart({ data = [], totalAmount = 0, size = 150, innerRadius = 40, outerRadius = 60 }) {
  const total = data.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const center = size / 2;

  // Empty state placeholder donut
  if (total === 0 || data.length === 0) {
    return (
      <div className="relative flex items-center justify-center shrink-0">
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-sm font-black text-[#111827] leading-none">₹0</span>
          <span className="text-[10px] font-medium text-[#6B7280] mt-0.5">Total</span>
        </div>
      </div>
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
      `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      "Z",
    ].join(" ");

    return {
      ...item,
      pathData,
    };
  });

  return (
    <div className="relative flex items-center justify-center shrink-0">
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
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-sm font-black text-[#111827] leading-none">
          {formatCurrency(totalAmount || total)}
        </span>
        <span className="text-[10px] font-medium text-[#6B7280] mt-0.5">Total</span>
      </div>
    </div>
  );
}

// Dynamic Cash Flow Bézier Area Chart Component (100% Real from Database)
function CashFlowChart({ rawIncomes = [], rawExpenses = [], rawTransactions = [] }) {
  const [period, setPeriod] = useState("week");
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Safe date parser
  const parseDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Pure single-source real stream calculation from database
  const { realIncomes, realExpenses } = useMemo(() => {
    const incList = [];
    const expList = [];

    if (Array.isArray(rawIncomes) && rawIncomes.length > 0) {
      rawIncomes.forEach((i) => {
        const dt = parseDate(i.date || i.createdAt);
        if (dt) {
          incList.push({
            id: String(i._id || Math.random()),
            amount: Number(i.amount) || 0,
            date: dt,
          });
        }
      });
    }

    if (Array.isArray(rawExpenses) && rawExpenses.length > 0) {
      rawExpenses.forEach((e) => {
        const dt = parseDate(e.date || e.createdAt);
        if (dt) {
          expList.push({
            id: String(e._id || Math.random()),
            amount: Number(e.amount) || 0,
            date: dt,
          });
        }
      });
    }

    // Complement with transaction records if needed
    if (Array.isArray(rawTransactions)) {
      rawTransactions.forEach((t) => {
        const dt = parseDate(t.date || t.createdAt);
        const amt = Math.abs(Number(t.amount) || 0);
        if (dt) {
          if (t.type === "income" || (t.amount > 0 && t.type !== "expense")) {
            if (!incList.some((x) => x.id === String(t._id))) {
              incList.push({ id: String(t._id), amount: amt, date: dt });
            }
          } else if (t.type === "expense" || t.amount < 0) {
            if (!expList.some((x) => x.id === String(t._id))) {
              expList.push({ id: String(t._id), amount: amt, date: dt });
            }
          }
        }
      });
    }

    return { realIncomes: incList, realExpenses: expList };
  }, [rawIncomes, rawExpenses, rawTransactions]);

  // Generate 100% accurate time series strictly from real database records
  const data = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentMonthName = now.toLocaleDateString("en-US", { month: "short" });

    // ─── 1. WEEK VIEW: Past 7 Days ───
    if (period === "week") {
      const days = [];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        const dayInc = realIncomes
          .filter((item) => item.date >= d && item.date <= endOfDay)
          .reduce((sum, item) => sum + item.amount, 0);

        const dayExp = realExpenses
          .filter((item) => item.date >= d && item.date <= endOfDay)
          .reduce((sum, item) => sum + item.amount, 0);

        days.push({
          label: dayNames[d.getDay()],
          fullDate: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          income: dayInc,
          expense: dayExp,
        });
      }

      return days;
    }

    // ─── 2. YEAR VIEW: Months of Current Year up to Current Month ───
    if (period === "year") {
      const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthIdx = now.getMonth();
      const availableMonths = allMonths.slice(0, currentMonthIdx + 1);

      let selectedIndices = [];
      if (availableMonths.length <= 6) {
        selectedIndices = availableMonths.map((_, i) => i);
      } else {
        const step = currentMonthIdx / 5;
        selectedIndices = [
          0,
          Math.round(step),
          Math.round(step * 2),
          Math.round(step * 3),
          Math.round(step * 4),
          currentMonthIdx,
        ];
        selectedIndices = [...new Set(selectedIndices)];
      }

      return selectedIndices.map((monthIdx) => {
        const label = allMonths[monthIdx];
        const startOfMonth = new Date(currentYear, monthIdx, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);

        const cumInc = realIncomes
          .filter((item) => item.date >= startOfMonth && item.date <= endOfMonth)
          .reduce((sum, item) => sum + item.amount, 0);

        const cumExp = realExpenses
          .filter((item) => item.date >= startOfMonth && item.date <= endOfMonth)
          .reduce((sum, item) => sum + item.amount, 0);

        return {
          label,
          fullDate: `${label} ${currentYear}`,
          income: cumInc,
          expense: cumExp,
        };
      });
    }

    // ─── 3. MONTH VIEW: Milestones up to today ───
    const today = now.getDate();
    let milestones = [];
    if (today <= 5) {
      for (let i = 1; i <= today; i++) {
        milestones.push(i);
      }
    } else {
      const step = (today - 1) / 4;
      milestones = [
        1,
        Math.round(1 + step),
        Math.round(1 + step * 2),
        Math.round(1 + step * 3),
        today,
      ];
      milestones = [...new Set(milestones)].sort((a, b) => a - b);
    }

    return milestones.map((dayNum) => {
      const startOfMo = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
      const endOfMilestone = new Date(currentYear, currentMonth, dayNum, 23, 59, 59, 999);

      const cumIncome = realIncomes
        .filter((item) => item.date >= startOfMo && item.date <= endOfMilestone)
        .reduce((sum, item) => sum + item.amount, 0);

      const cumExpense = realExpenses
        .filter((item) => item.date >= startOfMo && item.date <= endOfMilestone)
        .reduce((sum, item) => sum + item.amount, 0);

      const isToday = dayNum === today;
      return {
        label: `${dayNum} ${currentMonthName}`,
        fullDate: `${dayNum} ${currentMonthName} ${currentYear}${isToday ? " (Today)" : ""}`,
        income: cumIncome,
        expense: cumExpense,
      };
    });
  }, [period, realIncomes, realExpenses]);

  const width = 450;
  const height = 190;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 26;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Maximum value dynamic scale strictly from real data
  const rawMax = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 0);

  const maxY = useMemo(() => {
    if (rawMax === 0) return 1000;
    if (rawMax <= 1000) return 1000;
    if (rawMax <= 5000) return 5000;
    if (rawMax <= 10000) return 10000;
    if (rawMax <= 25000) return 25000;
    if (rawMax <= 50000) return 50000;
    if (rawMax <= 100000) return 100000;
    if (rawMax <= 200000) return 200000;
    return Math.ceil(rawMax / 50000) * 50000;
  }, [rawMax]);

  const formatTickLabel = (val) => {
    if (val >= 100000) return `₹${Math.round(val / 100000)}L`;
    if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  const yTicks = [
    { value: maxY, label: formatTickLabel(maxY) },
    { value: maxY * 0.8, label: formatTickLabel(maxY * 0.8) },
    { value: maxY * 0.6, label: formatTickLabel(maxY * 0.6) },
    { value: maxY * 0.4, label: formatTickLabel(maxY * 0.4) },
    { value: maxY * 0.2, label: formatTickLabel(maxY * 0.2) },
    { value: 0, label: "₹0" },
  ];

  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = paddingLeft + (i / Math.max(1, data.length - 1)) * plotWidth;
      const incomeY = paddingTop + (1 - Math.min(d.income, maxY) / maxY) * plotHeight;
      const expenseY = paddingTop + (1 - Math.min(d.expense, maxY) / maxY) * plotHeight;
      return {
        ...d,
        x,
        incomeY,
        expenseY,
      };
    });
  }, [data, maxY, plotWidth, plotHeight]);

  const createSmoothPath = (pts, keyY) => {
    if (!pts || pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0][keyY]}`;

    let d = `M ${pts[0].x} ${pts[0][keyY]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 >= pts.length ? pts.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1[keyY] + (p2[keyY] - p0[keyY]) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2[keyY] - (p3[keyY] - p1[keyY]) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2[keyY].toFixed(1)}`;
    }
    return d;
  };

  const incomeLinePath = useMemo(() => createSmoothPath(points, "incomeY"), [points]);
  const expenseLinePath = useMemo(() => createSmoothPath(points, "expenseY"), [points]);
  const baselineY = paddingTop + plotHeight;

  const incomeAreaPath = useMemo(() => {
    if (!points.length) return "";
    return `${incomeLinePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
  }, [incomeLinePath, points, baselineY]);

  const expenseAreaPath = useMemo(() => {
    if (!points.length) return "";
    return `${expenseLinePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
  }, [expenseLinePath, points, baselineY]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="flex flex-col justify-between h-full">
      {/* Top Header with Pill Switcher */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-bold text-[#111827] tracking-tight">Cash Flow</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Income vs Expenses</p>
        </div>

        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl">
          {[
            { id: "week", label: "Week" },
            { id: "month", label: "Month" },
            { id: "year", label: "Year" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === tab.id
                  ? "bg-[#1F2937] text-white shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-visible my-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="familyIncomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
              <stop offset="85%" stopColor="#10B981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="familyExpenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#F43F5E" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + (1 - tick.value / maxY) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F3F4F6"
                  strokeWidth="1"
                  strokeDasharray={i === yTicks.length - 1 ? "none" : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9.5"
                  fontWeight="500"
                  fill="#9CA3AF"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={incomeAreaPath} fill="url(#familyIncomeGradient)" />
          <path d={expenseAreaPath} fill="url(#familyExpenseGradient)" />

          {/* Lines */}
          <path
            d={incomeLinePath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
          <path
            d={expenseLinePath}
            fill="none"
            stroke="#F43F5E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.incomeY}
                r={hoveredIdx === i ? "5" : "3"}
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer"
              />
              <circle
                cx={pt.x}
                cy={pt.expenseY}
                r={hoveredIdx === i ? "4.5" : "2.5"}
                fill="#F43F5E"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer"
              />
            </g>
          ))}

          {/* X Axis labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#6B7280"
            >
              {pt.label}
            </text>
          ))}

          {/* Active Vertical Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingTop}
              x2={activePoint.x}
              y2={baselineY}
              stroke="#D1D5DB"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Interactive Hit Areas */}
          {points.map((pt, i) => {
            const stepW = plotWidth / Math.max(1, points.length - 1);
            const boxX = i === 0 ? paddingLeft : pt.x - stepW / 2;
            const boxW = i === 0 || i === points.length - 1 ? stepW / 2 : stepW;

            return (
              <rect
                key={i}
                x={boxX}
                y={paddingTop}
                width={boxW}
                height={plotHeight + 10}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Hover Tooltip (Matching image style) */}
        {activePoint && (
          <div
            className="absolute -top-3 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-white border border-[#E5E7EB] text-[#111827] text-[11px] py-2 px-3 rounded-xl shadow-xl z-20 whitespace-nowrap transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
            }}
          >
            <div className="flex items-center justify-between gap-4 font-bold text-gray-800 pb-1 mb-1 border-b border-gray-100">
              <span>{activePoint.fullDate || activePoint.label}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-gray-500 font-medium">Income</span>
              <span className="font-bold text-emerald-600">
                ₹{activePoint.income.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-0.5">
              <span className="text-gray-500 font-medium">Expenses</span>
              <span className="font-bold text-gray-900">
                ₹{activePoint.expense.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 mt-1 pt-1 border-t border-gray-100">
              <span className="text-gray-400 font-medium">Net</span>
              <span
                className={`font-bold ${
                  activePoint.income - activePoint.expense >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                ₹{(activePoint.income - activePoint.expense).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          <span className="text-xs font-semibold text-[#374151]">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" />
          <span className="text-xs font-semibold text-[#374151]">Expenses</span>
        </div>
      </div>
    </div>
  );
}

export default function FamilyDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("This Month");
  const [filterOpen, setFilterOpen] = useState(false);

  // User Profile
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const firstName = user.fullName ? user.fullName.split(" ")[0] : user.name || "Family";

  // Dynamic Time Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, []);

  // Top Metrics State (100% Real from DB, no fake defaults)
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    goalsSaved: 0,
  });

  // Raw streams for Cash Flow
  const [rawIncomes, setRawIncomes] = useState([]);
  const [rawExpenses, setRawExpenses] = useState([]);
  const [rawTransactions, setRawTransactions] = useState([]);

  // Expense Categories for Donut Chart (Dynamic from DB)
  const [categories, setCategories] = useState([]);

  // Loans & EMI List (Dynamic from DB)
  const [loans, setLoans] = useState([]);

  // Recent Transactions List (Dynamic from DB)
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Savings Goals List (Dynamic from DB)
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Family Snapshot 2x2 stats (Dynamic from DB)
  const [snapshot, setSnapshot] = useState({
    memberCount: 0,
    pendingSettlements: 0,
    sharedExpenses: 0,
    activeGoals: 0,
  });

  useEffect(() => {
    loadData();

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
        membRes,
        settRes,
        goalRes,
        splitRes,
        accRes,
        loanRes,
        expRes,
        incRes,
        txnRes,
      ] = await Promise.allSettled([
        fetch(`${API}/family/members`, { headers: h }),
        fetch(`${API}/workspace/settlements?workspace=family`, { headers: h }),
        fetch(`${API}/workspace/family-goals?workspace=family`, { headers: h }),
        fetch(`${API}/group/splits`, { headers: h }),
        fetch(`${API}/accounts?workspace=family`, { headers: h }),
        fetch(`${API}/loans?workspace=family`, { headers: h }),
        fetch(`${API}/expenses?workspace=family`, { headers: h }),
        fetch(`${API}/incomes?workspace=family`, { headers: h }),
        fetch(`${API}/transactions?module=family&limit=50`, { headers: h }),
      ]);

      let memberCount = 0;
      let pendingSettlements = 0;
      let sharedExpenses = 0;
      let activeGoals = 0;
      let totalBalance = 0;
      let totalIncome = 0;
      let totalExpenses = 0;
      let goalsSaved = 0;

      // 1. Members
      if (membRes.status === "fulfilled" && membRes.value.ok) {
        const members = await membRes.value.json();
        if (Array.isArray(members)) {
          memberCount = members.length;
        }
      }

      // 2. Settlements
      if (settRes.status === "fulfilled" && settRes.value.ok) {
        const settlements = await settRes.value.json();
        if (Array.isArray(settlements)) {
          pendingSettlements = settlements
            .filter((s) => s.status === "pending" || s.status === "Pending")
            .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        }
      }

      // 3. Shared Splits
      if (splitRes.status === "fulfilled" && splitRes.value.ok) {
        const splits = await splitRes.value.json();
        if (Array.isArray(splits)) {
          sharedExpenses = splits.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
        }
      }

      // 4. Family Goals
      if (goalRes.status === "fulfilled" && goalRes.value.ok) {
        const goals = await goalRes.value.json();
        if (Array.isArray(goals)) {
          activeGoals = goals.length;
          goalsSaved = goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);
          setSavingsGoals(
            goals.slice(0, 3).map((g) => {
              const cur = Number(g.currentAmount) || 0;
              const tgt = Number(g.targetAmount) || 1;
              const prog = Math.min(100, Math.round((cur / tgt) * 100));
              return {
                id: g._id,
                title: g.title || g.name || "Family Goal",
                current: cur,
                target: tgt,
                progress: prog,
                icon: prog >= 50 ? ShieldCheck : PiggyBank,
                iconBg: prog >= 50 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600",
              };
            })
          );
        } else {
          setSavingsGoals([]);
        }
      } else {
        setSavingsGoals([]);
      }

      // 5. Incomes
      let loadedIncomes = [];
      if (incRes.status === "fulfilled" && incRes.value.ok) {
        const incData = await incRes.value.json();
        if (Array.isArray(incData)) {
          loadedIncomes = incData;
          totalIncome = incData.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          setRawIncomes(incData);
        }
      }

      // 6. Expenses & Categories
      let loadedExpenses = [];
      if (expRes.status === "fulfilled" && expRes.value.ok) {
        const expData = await expRes.value.json();
        if (Array.isArray(expData)) {
          loadedExpenses = expData;
          totalExpenses = expData.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          setRawExpenses(expData);

          // Group by category dynamically from real database expenses
          const catMap = {};
          expData.forEach((e) => {
            const c = e.category || "Other";
            catMap[c] = (catMap[c] || 0) + (Number(e.amount) || 0);
          });

          const catEntries = Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => {
              const meta = getCategoryMeta(name);
              return {
                name,
                amount,
                percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
                color: meta.color,
                icon: meta.icon,
              };
            });

          setCategories(catEntries);
        } else {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }

      // 7. Accounts & Total Balance (deduct shared/split expenses from balance)
      if (accRes.status === "fulfilled" && accRes.value.ok) {
        const accounts = await accRes.value.json();
        if (Array.isArray(accounts) && accounts.length > 0) {
          totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) - sharedExpenses;
        } else {
          totalBalance = totalIncome - totalExpenses - sharedExpenses;
        }
      } else {
        totalBalance = totalIncome - totalExpenses - sharedExpenses;
      }

      // 8. Loans & EMI
      if (loanRes.status === "fulfilled" && loanRes.value.ok) {
        const loanList = await loanRes.value.json();
        if (Array.isArray(loanList)) {
          setLoans(
            loanList.slice(0, 3).map((l, i) => {
              const tenure = Number(l.tenure) || 1;
              const paid = Number(l.paidEmis) || 0;
              const prog = Math.min(100, Math.round((paid / tenure) * 100)) || (l.principal && l.remainingPrincipal ? Math.min(100, Math.round(((l.principal - l.remainingPrincipal) / l.principal) * 100)) : 0);
              
              let nextDue = "Due this month";
              if (l.nextDueDate) {
                nextDue = `Due on ${new Date(l.nextDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
              } else if (l.startDate) {
                nextDue = `Started ${new Date(l.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
              }

              const loanTypeLower = (l.loanType || l.name || "").toLowerCase();
              let Icon = Landmark;
              let iconBg = "bg-emerald-50 text-emerald-600";
              if (loanTypeLower.includes("home") || loanTypeLower.includes("mortgage") || loanTypeLower.includes("house")) {
                Icon = Home;
                iconBg = "bg-emerald-50 text-emerald-600";
              } else if (loanTypeLower.includes("car") || loanTypeLower.includes("vehicle") || loanTypeLower.includes("auto")) {
                Icon = Car;
                iconBg = "bg-purple-50 text-purple-600";
              } else if (loanTypeLower.includes("educat") || loanTypeLower.includes("college") || loanTypeLower.includes("school")) {
                Icon = GraduationCap;
                iconBg = "bg-amber-50 text-amber-600";
              }

              return {
                id: l._id || `loan-${i}`,
                name: l.name || "Family Loan",
                account: `${l.lender || "Bank"} •••• ${String(l.accountNumber || "5678").slice(-4)}`,
                status: l.status === "Active" ? "ON TIME" : (l.status || "ON TIME").toUpperCase(),
                amount: Number(l.emi || l.monthlyPayment || 0),
                dueDate: nextDue,
                progress: prog,
                icon: Icon,
                iconBg,
              };
            })
          );
        } else {
          setLoans([]);
        }
      } else {
        setLoans([]);
      }

      // 9. Recent Transactions
      if (txnRes.status === "fulfilled" && txnRes.value.ok) {
        const txnData = await txnRes.value.json();
        const txns = txnData.transactions || (Array.isArray(txnData) ? txnData : []);
        setRawTransactions(txns);

        if (txns.length > 0) {
          setRecentTransactions(
            txns.slice(0, 5).map((t) => {
              const meta = getCategoryMeta(t.category);
              const isInc = t.type === "income" || (Number(t.amount) > 0 && t.type !== "expense");
              return {
                id: t._id,
                title: t.title || "Family Transaction",
                subtitle: t.paymentMethod || t.notes || (isInc ? "Family Income" : "Family Expense"),
                category: t.category || "General",
                date: t.date
                  ? new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : "Recent",
                amount: Math.abs(Number(t.amount) || 0),
                type: isInc ? "income" : "expense",
                icon: isInc ? TrendingUp : meta.icon,
                iconBg: isInc ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500",
              };
            })
          );
        } else if (loadedExpenses.length > 0 || loadedIncomes.length > 0) {
          // Construct from direct loaded expenses and incomes if transaction collection is empty
          const fallbackTxns = [
            ...loadedIncomes.map((i) => ({
              id: i._id,
              title: i.title || "Family Income",
              subtitle: i.account || "Income",
              category: i.category || "Income",
              date: i.date ? new Date(i.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
              amount: Number(i.amount) || 0,
              type: "income",
              icon: TrendingUp,
              iconBg: "bg-emerald-50 text-emerald-600",
              rawDate: new Date(i.date || 0),
            })),
            ...loadedExpenses.map((e) => {
              const meta = getCategoryMeta(e.category);
              return {
                id: e._id,
                title: e.title || "Family Expense",
                subtitle: e.paymentMethod || "Expense",
                category: e.category || "General",
                date: e.date ? new Date(e.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent",
                amount: Number(e.amount) || 0,
                type: "expense",
                icon: meta.icon,
                iconBg: "bg-rose-50 text-rose-500",
                rawDate: new Date(e.date || 0),
              };
            }),
          ].sort((a, b) => b.rawDate - a.rawDate);

          setRecentTransactions(fallbackTxns.slice(0, 5));
        } else {
          setRecentTransactions([]);
        }
      } else {
        setRecentTransactions([]);
      }

      setStats({
        totalBalance,
        totalIncome,
        totalExpenses,
        goalsSaved,
      });

      setSnapshot({
        memberCount,
        pendingSettlements,
        sharedExpenses,
        activeGoals,
      });
    } catch (err) {
      console.error("Family dashboard data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalEMI = useMemo(() => {
    return loans.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }, [loans]);

  const topCategory = categories[0] || null;

  return (
    <div className="space-y-6 w-full max-w-[1640px] mx-auto pb-10">
      {/* ─── 1. HEADER SECTION (Greeting & Time Filter) ─────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            <span>{greeting}, {firstName}!</span>
            <span className="text-2xl select-none">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[#6B7280] mt-1">
            Here's your family financial overview for {currentMonthYear}
          </p>
        </div>

        {/* Date Filter Dropdown */}
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

      {/* ─── 2. TOP 4 METRIC STAT CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: TOTAL BALANCE */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E6F5F1] text-[#00796B] flex items-center justify-center shrink-0 shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL BALANCE</p>
            <p className="text-2xl font-extrabold text-[#00695C] tracking-tight mt-0.5">
              {loading ? "—" : formatCurrency(stats.totalBalance)}
            </p>
          </div>
        </div>

        {/* Card 2: TOTAL INCOME */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#E8F8F1] text-[#00A878] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL INCOME</p>
            <p className="text-2xl font-extrabold text-[#009B70] tracking-tight mt-0.5">
              {loading ? "—" : formatCurrency(stats.totalIncome)}
            </p>
          </div>
        </div>

        {/* Card 3: TOTAL EXPENSES */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#FDECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-xs">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">TOTAL EXPENSES</p>
            <p className="text-2xl font-extrabold text-[#E53935] tracking-tight mt-0.5">
              {loading ? "—" : formatCurrency(stats.totalExpenses)}
            </p>
          </div>
        </div>

        {/* Card 4: GOALS SAVED */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center gap-4 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-xl bg-[#F7EEFF] text-[#A855F7] flex items-center justify-center shrink-0 shadow-xs">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">GOALS SAVED</p>
            <p className="text-2xl font-extrabold text-[#7E22CE] tracking-tight mt-0.5">
              {loading ? "—" : formatCurrency(stats.goalsSaved)}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3. MIDDLE SECTION (3 Columns) ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Cash Flow */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all min-h-[360px]">
          <CashFlowChart
            rawIncomes={rawIncomes}
            rawExpenses={rawExpenses}
            rawTransactions={rawTransactions}
          />
        </div>

        {/* Panel 2: Where Your Money Goes */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all min-h-[360px]">
          <div>
            <h2 className="text-base font-bold text-[#111827] tracking-tight">Where Your Money Goes</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Top Expense Categories</p>

            {categories.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <DonutChart data={[]} totalAmount={0} size={135} innerRadius={36} outerRadius={56} />
                <p className="text-xs text-gray-500 font-medium mt-3">No expenses recorded yet</p>
                <Link
                  to="/app/family/transactions"
                  className="mt-2 text-xs font-bold text-[#005B4F] hover:underline"
                >
                  + Add Family Expense
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 mt-4">
                {/* Donut Chart */}
                <DonutChart
                  data={categories}
                  totalAmount={stats.totalExpenses}
                  size={135}
                  innerRadius={36}
                  outerRadius={56}
                />

                {/* Category Breakdown List */}
                <div className="space-y-2 flex-1 pl-2">
                  {categories.map((cat, idx) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                          <span className="font-semibold text-[#374151]">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#111827]">₹{cat.amount.toLocaleString()}</span>
                          <span className="text-[#9CA3AF] text-[11px] w-7 text-right">{cat.percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Highlight Card: Top Spending Category */}
          <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-xl p-3 flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#6B7280]">Top spending category</p>
                <p className="text-xs font-bold text-[#111827]">{topCategory ? topCategory.name : "None yet"}</p>
              </div>
            </div>
            <p className="text-xs font-bold text-[#111827]">
              {topCategory ? `₹${topCategory.amount.toLocaleString()} (${topCategory.percentage}%)` : "₹0 (0%)"}
            </p>
          </div>
        </div>

        {/* Panel 3: Loans & EMI */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all min-h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827] tracking-tight">Loans & EMI</h2>
              <Link to="/app/family/loans" className="text-xs font-bold text-[#005B4F] hover:underline">
                View all
              </Link>
            </div>

            {/* Loans List */}
            {loans.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                  <Landmark className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">No active family loans</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Track your joint mortgage, car or education EMI</p>
                <Link
                  to="/app/family/loans"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005B4F] text-white text-xs font-semibold hover:bg-[#004A40] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Family Loan</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => {
                  const Icon = loan.icon;
                  return (
                    <div key={loan.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${loan.iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#111827]">{loan.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[#6B7280]">{loan.account}</span>
                              <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-[#E6F5F1] text-[#00796B]">
                                {loan.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold text-[#111827]">₹{loan.amount.toLocaleString()}</p>
                          <p className="text-[10px] text-[#9CA3AF]">{loan.dueDate}</p>
                        </div>
                      </div>

                      {/* Progress Bar with Percentage on Right */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                          <div
                            style={{ width: `${loan.progress}%` }}
                            className="h-full rounded-full bg-[#00796B] transition-all duration-500"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#6B7280] w-6 text-right">
                          {loan.progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Total EMI Indicator */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
            <span className="text-xs font-bold text-[#374151]">Total EMI this month</span>
            <span className="text-sm font-extrabold text-[#111827]">
              ₹{totalEMI.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. BOTTOM SECTION (3 Columns) ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel 1: Recent Transactions */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[#111827] tracking-tight">Recent Transactions</h2>
              <Link to="/app/family/transactions" className="text-xs font-bold text-[#005B4F] hover:underline">
                View all
              </Link>
            </div>

            {/* Transactions List */}
            {recentTransactions.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">No transactions recorded</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Record expenses, shared bills or income</p>
                <Link
                  to="/app/family/transactions"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005B4F] text-white text-xs font-semibold hover:bg-[#004A40] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Transaction</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentTransactions.map((tx) => {
                  const Icon = tx.icon;
                  return (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${tx.iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#111827] leading-tight line-clamp-1">{tx.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-[#9CA3AF]">{tx.subtitle}</span>
                            <span className="px-1.5 py-0.2 rounded-sm text-[9px] font-bold bg-[#E6F5F1] text-[#00796B]">
                              {tx.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`text-xs font-bold ${tx.type === "income" ? "text-emerald-600" : "text-rose-500"}`}>
                          {tx.type === "income" ? "+ " : "- "}₹{tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Link Button */}
          <Link
            to="/app/family/transactions"
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
              <h2 className="text-base font-bold text-[#111827] tracking-tight">Savings Goals</h2>
              <Link to="/app/family/goals" className="text-xs font-bold text-[#005B4F] hover:underline">
                View all
              </Link>
            </div>

            {/* Goals List */}
            {savingsGoals.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mb-2">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-gray-700">No active savings goals</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Set up goals for vacation, education or emergency</p>
                <Link
                  to="/app/family/goals"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#005B4F] text-white text-xs font-semibold hover:bg-[#004A40] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Family Goal</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savingsGoals.map((g) => {
                  const Icon = g.icon;
                  return (
                    <div key={g.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl ${g.iconBg} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#111827]">{g.title}</p>
                            <p className="text-[11px] text-[#6B7280]">
                              ₹{g.current.toLocaleString()} / ₹{g.target.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#111827]">{g.progress}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${g.progress}%` }}
                          className="h-full bg-[#005B4F] rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Link Button */}
          <Link
            to="/app/family/goals"
            className="flex items-center justify-center gap-1 text-xs font-bold text-[#005B4F] hover:text-[#004A40] pt-4 mt-3 border-t border-gray-100 transition-colors"
          >
            <span>View All Goals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Panel 3: Family Snapshot */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
          <div>
            <h2 className="text-base font-bold text-[#111827] tracking-tight mb-4">Family Snapshot</h2>

            {/* 2x2 Grid of Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Mini Card 1: Family Members */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB]/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#111827] leading-tight">
                    {loading ? "—" : snapshot.memberCount}
                  </p>
                  <p className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Family Members</p>
                </div>
              </div>

              {/* Mini Card 2: Pending Settlements */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB]/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#111827] leading-tight">
                    {loading ? "—" : `₹${snapshot.pendingSettlements.toLocaleString()}`}
                  </p>
                  <p className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Pending Settlements</p>
                </div>
              </div>

              {/* Mini Card 3: Shared Expenses */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB]/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ReceiptIndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#111827] leading-tight">
                    {loading ? "—" : `₹${snapshot.sharedExpenses.toLocaleString()}`}
                  </p>
                  <p className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Shared Expenses</p>
                </div>
              </div>

              {/* Mini Card 4: Active Goals */}
              <div className="bg-[#F8FAFC] border border-[#E5E7EB]/80 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-[#111827] leading-tight">
                    {loading ? "—" : snapshot.activeGoals}
                  </p>
                  <p className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Active Goals</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Inspirational Banner */}
          <div className="bg-[#EBF7F2] border border-[#D1F0E4] rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#005B4F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#005B4F]">Growing stronger together</p>
              <p className="text-[11px] text-[#4B5563] mt-0.5">One step closer to your financial goals!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
