import React from "react";

export default function ChartCard({ title, subtitle, data = [], type = "bar" }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.income || 0, d.expense || 0, d.value || 0)), 100);

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-[#1F2937]">{title}</h3>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#005B4F]" />
            <span className="text-[#6B7280]">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
            <span className="text-[#6B7280]">Expense</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="h-64 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
        {data.map((item, idx) => {
          const incHeight = Math.round(((item.income || 0) / maxVal) * 180);
          const expHeight = Math.round(((item.expense || 0) / maxVal) * 180);

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip on hover */}
              <div className="absolute -top-12 hidden group-hover:flex flex-col items-center bg-[#2B3138] text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl z-20 whitespace-nowrap">
                <span>Inc: ${item.income || 0}</span>
                <span>Exp: ${item.expense || 0}</span>
              </div>

              {/* Bars */}
              <div className="w-full flex items-end justify-center gap-1 h-[200px]">
                <div
                  style={{ height: `${Math.max(incHeight, 8)}px` }}
                  className="w-1/2 max-w-[18px] bg-[#005B4F] rounded-t-lg transition-all duration-500 group-hover:opacity-85"
                />
                <div
                  style={{ height: `${Math.max(expHeight, 8)}px` }}
                  className="w-1/2 max-w-[18px] bg-[#D4AF37] rounded-t-lg transition-all duration-500 group-hover:opacity-85"
                />
              </div>

              {/* Month label */}
              <span className="text-xs font-semibold text-[#6B7280] mt-3">{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
