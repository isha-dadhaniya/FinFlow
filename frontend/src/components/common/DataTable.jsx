import React from "react";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "No data is available for display.",
  actionButton,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-[20px] p-6 border border-[#D9DEE3]/60 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-lg w-full"></div>
        <div className="h-12 bg-gray-50 rounded-lg w-full"></div>
        <div className="h-12 bg-gray-50 rounded-lg w-full"></div>
        <div className="h-12 bg-gray-50 rounded-lg w-full"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} actionButton={actionButton} />;
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#D9DEE3]/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F6F8] border-b border-[#D9DEE3]/60 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-6 ${col.className || ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9DEE3]/40 text-sm text-[#1F2937]">
            {data.map((row, rowIdx) => (
              <tr key={row._id || row.id || rowIdx} className="hover:bg-[#F4F6F8]/60 transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`py-4 px-6 font-medium ${col.className || ""}`}>
                    {col.accessor ? col.accessor(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
