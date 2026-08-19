import React, { useState, useMemo } from "react";

export default function CashFlowGraph({
  totalIncome = 0,
  totalExpenses = 0,
  incomes = [],
  expenses = [],
  transactions = [],
}) {
  const [period, setPeriod] = useState("month");
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Safe date parser
  const parseDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  // Pure single-source real stream calculation (no duplicates, no fake data)
  const { realIncomes, realExpenses } = useMemo(() => {
    const incList = [];
    const expList = [];

    // Prioritize direct Incomes & Expenses records if present
    if (Array.isArray(incomes) && incomes.length > 0) {
      incomes.forEach((i) => {
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

    if (Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach((e) => {
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

    // If incomes or expenses were empty, fallback to transactions
    if (incList.length === 0 && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const dt = parseDate(t.date || t.createdAt);
        const amt = Math.abs(Number(t.amount) || 0);
        if (dt && (t.type === "income" || (t.amount > 0 && t.type !== "expense"))) {
          incList.push({
            id: String(t._id || Math.random()),
            amount: amt,
            date: dt,
          });
        }
      });
    }

    if (expList.length === 0 && Array.isArray(transactions)) {
      transactions.forEach((t) => {
        const dt = parseDate(t.date || t.createdAt);
        const amt = Math.abs(Number(t.amount) || 0);
        if (dt && (t.type === "expense" || t.amount < 0)) {
          expList.push({
            id: String(t._id || Math.random()),
            amount: amt,
            date: dt,
          });
        }
      });
    }

    return { realIncomes: incList, realExpenses: expList };
  }, [incomes, expenses, transactions]);

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

    // ─── 2. YEAR VIEW: Months up to Current Month ───
    if (period === "year") {
      const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const currentMonthIdx = now.getMonth();
      
      // Select up to 6 representative months up to the current month
      const availableMonths = allMonths.slice(0, currentMonthIdx + 1);
      let selectedIndices = [];
      if (availableMonths.length <= 6) {
        selectedIndices = availableMonths.map((_, i) => i);
      } else {
        const step = (currentMonthIdx) / 5;
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
        const endOfMonth = new Date(currentYear, monthIdx + 1, 0, 23, 59, 59, 999);

        const cumInc = realIncomes
          .filter((item) => item.date.getFullYear() === currentYear && item.date <= endOfMonth)
          .reduce((sum, item) => sum + item.amount, 0);

        const cumExp = realExpenses
          .filter((item) => item.date.getFullYear() === currentYear && item.date <= endOfMonth)
          .reduce((sum, item) => sum + item.amount, 0);

        return {
          label,
          fullDate: `${label} ${currentYear}`,
          income: cumInc,
          expense: cumExp,
        };
      });
    }

    // ─── 3. MONTH VIEW (Default): Dynamic milestones strictly up to TODAY (No future dates) ───
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
      // Cumulative real income up to this milestone date
      const cumIncome = realIncomes
        .filter((item) => {
          const d = item.date;
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() <= dayNum
          );
        })
        .reduce((sum, item) => sum + item.amount, 0);

      // Cumulative real expenses up to this milestone date
      const cumExpense = realExpenses
        .filter((item) => {
          const d = item.date;
          return (
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth &&
            d.getDate() <= dayNum
          );
        })
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

  // Dimensions & Scales
  const width = 480;
  const height = 210;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  // Maximum value strictly from data
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

  const yTicks = [
    { value: maxY, label: `₹${maxY >= 1000 ? `${maxY / 1000}k` : maxY}` },
    { value: maxY * 0.8, label: `₹${(maxY * 0.8) >= 1000 ? `${Math.round((maxY * 0.8) / 1000)}k` : Math.round(maxY * 0.8)}` },
    { value: maxY * 0.6, label: `₹${(maxY * 0.6) >= 1000 ? `${Math.round((maxY * 0.6) / 1000)}k` : Math.round(maxY * 0.6)}` },
    { value: maxY * 0.4, label: `₹${(maxY * 0.4) >= 1000 ? `${Math.round((maxY * 0.4) / 1000)}k` : Math.round(maxY * 0.4)}` },
    { value: maxY * 0.2, label: `₹${(maxY * 0.2) >= 1000 ? `${Math.round((maxY * 0.2) / 1000)}k` : Math.round(maxY * 0.2)}` },
    { value: 0, label: "₹0" },
  ];

  // Coordinates
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

  // Smooth Bézier curve generator
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
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 flex flex-col justify-between hover:shadow-xs transition-all">
      {/* Header with Title and Period Filter */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <h2 className="text-base font-bold text-[#111827]">Cash Flow</h2>
          <p className="text-xs text-[#6B7280] mt-0.5">Income vs Expenses</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl">
          {[
            { id: "week", label: "Week" },
            { id: "month", label: "Month" },
            { id: "year", label: "Year" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                period === item.id
                  ? "bg-white text-[#111827] shadow-xs"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-visible my-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            {/* Income Green Area Gradient */}
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#10B981" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>

            {/* Expense Red Area Gradient */}
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.18" />
              <stop offset="85%" stopColor="#F43F5E" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Y-Axis Labels */}
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
                  fontSize="10"
                  fontWeight="500"
                  fill="#9CA3AF"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={incomeAreaPath} fill="url(#incomeGradient)" />
          <path d={expenseAreaPath} fill="url(#expenseGradient)" />

          {/* Income Line */}
          <path
            d={incomeLinePath}
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Expense Line */}
          <path
            d={expenseLinePath}
            fill="none"
            stroke="#F43F5E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />

          {/* Milestone Data Points on Lines */}
          {points.map((pt, i) => (
            <g key={i}>
              {/* Income Point */}
              <circle
                cx={pt.x}
                cy={pt.incomeY}
                r={hoveredIdx === i ? "5" : "3.5"}
                fill="#10B981"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer"
              />
              {/* Expense Point */}
              <circle
                cx={pt.x}
                cy={pt.expenseY}
                r={hoveredIdx === i ? "4.5" : "3"}
                fill="#F43F5E"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                className="transition-all duration-200 cursor-pointer"
              />
            </g>
          ))}

          {/* X-Axis Labels */}
          {points.map((pt, i) => (
            <text
              key={i}
              x={pt.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="500"
              fill="#6B7280"
            >
              {pt.label}
            </text>
          ))}

          {/* Hover Vertical Guide Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingTop}
              x2={activePoint.x}
              y2={baselineY}
              stroke="#9CA3AF"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}

          {/* Transparent Hover Hit Boxes for smooth interactivity */}
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

        {/* Hover Tooltip */}
        {activePoint && (
          <div
            className="absolute -top-3 pointer-events-none transform -translate-x-1/2 -translate-y-full bg-[#1F2937] text-white text-[11px] py-1.5 px-3 rounded-xl shadow-xl z-20 whitespace-nowrap transition-all duration-150"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
            }}
          >
            <p className="font-bold text-gray-200 border-b border-gray-700 pb-1 mb-1">
              {activePoint.fullDate || activePoint.label}
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-gray-300">Income:</span>
              <span className="font-bold text-emerald-400">
                +₹{activePoint.income.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-gray-300">Expenses:</span>
              <span className="font-bold text-rose-400">
                -₹{activePoint.expense.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-gray-700/60 mt-1">
              <span className="text-gray-400">Net:</span>
              <span
                className={`font-extrabold ${
                  activePoint.income - activePoint.expense >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                ₹{(activePoint.income - activePoint.expense).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100/60 mt-1">
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
