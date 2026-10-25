import React, { useState } from "react";
import { Download, FileSpreadsheet, FileText, CheckCircle2, Calendar, Database } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

export default function ExportPage() {
  const [exportType, setExportType] = useState("all");
  const [format, setFormat] = useState("csv");
  const [downloading, setDownloading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setDownloading(true);
      const [txnRes, expRes, incRes, billRes, invRes] = await Promise.allSettled([
        fetch(`${API}/transactions`, { headers: headers() }),
        fetch(`${API}/expenses`, { headers: headers() }),
        fetch(`${API}/incomes`, { headers: headers() }),
        fetch(`${API}/bills`, { headers: headers() }),
        fetch(`${API}/business/invoices`, { headers: headers() }),
      ]);

      const txns = txnRes.status === "fulfilled" && txnRes.value.ok ? (await txnRes.value.json()).transactions || [] : [];
      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];
      const incomes = incRes.status === "fulfilled" && incRes.value.ok ? await incRes.value.json() : [];
      const bills = billRes.status === "fulfilled" && billRes.value.ok ? await billRes.value.json() : [];
      const invoices = invRes.status === "fulfilled" && invRes.value.ok ? await invRes.value.json() : [];

      if (format === "json") {
        const fullBackup = { transactions: txns, expenses, incomes, bills, invoices, exportedAt: new Date() };
        const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `finflow_complete_backup_${new Date().toISOString().split("T")[0]}.json`;
        a.click();
      } else {
        const rows = [
          ["Record Type", "Title/Entity", "Amount", "Category/Type", "Date", "Status"],
          ...txns.map((t) => ["Transaction", `"${t.title || ""}"`, t.amount || 0, t.category || "General", new Date(t.date).toLocaleDateString(), t.status || "Completed"]),
          ...expenses.map((e) => ["Expense", `"${e.title || ""}"`, e.amount || 0, e.category || "General", new Date(e.date).toLocaleDateString(), "Paid"]),
          ...incomes.map((i) => ["Income", `"${i.title || ""}"`, i.amount || 0, i.source || "Salary", new Date(i.date).toLocaleDateString(), "Received"]),
          ...bills.map((b) => ["Bill", `"${b.name || ""}"`, b.amount || 0, b.category || "Bills", new Date(b.dueDate).toLocaleDateString(), b.status || "Pending"]),
          ...invoices.map((inv) => ["Invoice", `"${inv.clientName || ""}"`, inv.totalAmount || 0, inv.invoiceNumber, new Date(inv.issueDate).toLocaleDateString(), inv.status || "Draft"]),
        ];
        const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `finflow_export_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">Data Export & Backup</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Download your financial records in spreadsheet or structured JSON format</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-sm font-semibold animate-[fadeIn_0.2s_ease-out]">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Export generated successfully! Download has started.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Select Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat("csv")}
              className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${format === "csv" ? "border-[#005B4F] bg-[#005B4F]/5 ring-2 ring-[#005B4F]/20" : "border-[#E5E7EB] hover:bg-gray-50"
                }`}
            >
              <FileSpreadsheet className={`w-6 h-6 ${format === "csv" ? "text-[#005B4F]" : "text-gray-400"}`} />
              <div>
                <p className="text-sm font-bold text-[#1F2937]">CSV Spreadsheet</p>
                <p className="text-xs text-[#6B7280]">Compatible with Excel & Google Sheets</p>
              </div>
            </button>

            <button
              onClick={() => setFormat("json")}
              className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${format === "json" ? "border-[#005B4F] bg-[#005B4F]/5 ring-2 ring-[#005B4F]/20" : "border-[#E5E7EB] hover:bg-gray-50"
                }`}
            >
              <Database className={`w-6 h-6 ${format === "json" ? "text-[#005B4F]" : "text-gray-400"}`} />
              <div>
                <p className="text-sm font-bold text-[#1F2937]">Full JSON Backup</p>
                <p className="text-xs text-[#6B7280]">Complete schema dump for restoration</p>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={downloading}
          className="w-full h-12 bg-[#005B4F] text-white text-sm font-bold rounded-xl hover:bg-[#004A40] transition-colors shadow-lg shadow-[#005B4F]/20 flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Preparing Export..." : "Download Export File"}
        </button>
      </div>
    </div>
  );
}
