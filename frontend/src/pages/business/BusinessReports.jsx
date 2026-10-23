import React, { useState, useEffect } from "react";
import { Download, FileText, FileSpreadsheet, Building2, TrendingUp, TrendingDown, DollarSign, Users, Briefcase } from "lucide-react";
import { AlertModal } from "../../components/common/ConfirmModal";
import finflowLogo from "../../assets/finflow-logo.png";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function BusinessReports() {
  const [data, setData] = useState({
    invoices: [],
    expenses: [],
    employees: [],
    departments: [],
  });
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [invRes, expRes, empRes, deptRes] = await Promise.allSettled([
        fetch(`${API}/business/invoices`, { headers: headers() }),
        fetch(`${API}/expenses?module=business`, { headers: headers() }),
        fetch(`${API}/workspace/employees?workspace=business`, { headers: headers() }),
        fetch(`${API}/workspace/departments?workspace=business`, { headers: headers() }),
      ]);

      const invoices = invRes.status === "fulfilled" && invRes.value.ok ? await invRes.value.json() : [];
      const expenses = expRes.status === "fulfilled" && expRes.value.ok ? await expRes.value.json() : [];
      const employees = empRes.status === "fulfilled" && empRes.value.ok ? await empRes.value.json() : [];
      const departments = deptRes.status === "fulfilled" && deptRes.value.ok ? await deptRes.value.json() : [];

      setData({
        invoices: Array.isArray(invoices) ? invoices : [],
        expenses: Array.isArray(expenses) ? expenses : [],
        employees: Array.isArray(employees) ? employees : [],
        departments: Array.isArray(departments) ? departments : [],
      });
    } catch (err) {
      console.error("Business reports load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = data.invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setAlertMessage("Please allow popups in your browser to export the PDF report.");
      return;
    }

    const logoUrl = finflowLogo.startsWith("http") || finflowLogo.startsWith("data:")
      ? finflowLogo
      : `${window.location.origin}${finflowLogo}`;

    const postings = [
      ...data.invoices.map((inv) => ({
        type: "Invoice (Revenue)",
        title: `Invoice #${inv.invoiceNumber} — ${inv.clientName}`,
        category: `Status: ${inv.status}`,
        date: new Date(inv.issueDate).toLocaleDateString("en-IN"),
        amount: inv.totalAmount || 0,
        isIncome: true,
      })),
      ...data.expenses.map((exp) => ({
        type: "Operating Expense",
        title: exp.title,
        category: `${exp.category} (${exp.department || "General"})`,
        date: new Date(exp.date).toLocaleDateString("en-IN"),
        amount: exp.amount || 0,
        isIncome: false,
      })),
    ];

    const rowsHtml = postings
      .map(
        (item, idx) => `
        <tr style="border-bottom: 1px solid #E5E7EB;">
          <td style="padding: 10px 12px; font-size: 11px; color: #6B7280;">#${idx + 1}</td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; color: #111827;">${item.title}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: ${item.isIncome ? "#005B4F" : "#6B7280"}; font-weight: 600;">${item.type}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #4B5563;">${item.category}</td>
          <td style="padding: 10px 12px; font-size: 11px; color: #6B7280;">${item.date}</td>
          <td style="padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: right; color: ${item.isIncome ? "#059669" : "#DC2626"};">
            ${item.isIncome ? "+" : "-"}${formatCurrency(item.amount)}
          </td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FinFlow - Business Financial Report</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; margin: 0; padding: 20px; color: #111827; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #005B4F; padding-bottom: 16px; margin-bottom: 20px; }
            .subtitle { font-size: 12px; color: #6B7280; margin-top: 2px; }
            .meta { font-size: 11px; color: #6B7280; text-align: right; line-height: 1.5; }
            .summary { display: flex; gap: 16px; margin-bottom: 24px; }
            .sum-card { flex: 1; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px 16px; }
            .sum-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #6B7280; letter-spacing: 0.5px; }
            .sum-val { font-size: 18px; font-weight: 800; margin-top: 4px; }
            .revenue { color: #059669; }
            .expense { color: #DC2626; }
            .surplus { color: ${netIncome >= 0 ? "#059669" : "#DC2626"}; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 10px 12px; background: #005B4F; color: #ffffff; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
            .footer { margin-top: 30px; font-size: 10px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 12px; }
            @media print {
              body { padding: 0; }
              .sum-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #005B4F !important; color: white !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display: flex; align-items: center; gap: 16px;">
              <img src="${logoUrl}" alt="FinFlow Logo" style="height: 48px; object-fit: contain;" />
              <div style="border-left: 2px solid #E5E7EB; padding-left: 14px;">
                <div style="font-size: 13px; font-weight: 800; color: #005B4F; text-transform: uppercase; letter-spacing: 0.5px;">Business Financial Statement</div>
                <div class="subtitle">Commercial Financial Audit & Executive Report</div>
              </div>
            </div>
            <div class="meta">
              <div>Workspace: <strong>Business</strong></div>
              <div>Generated: <strong>${new Date().toLocaleString("en-IN")}</strong></div>
              <div>Total Records: <strong>${postings.length}</strong></div>
            </div>
          </div>

          <div class="summary">
            <div class="sum-card">
              <div class="sum-label">Settled Invoiced Revenue</div>
              <div class="sum-val revenue">${formatCurrency(totalRevenue)}</div>
            </div>
            <div class="sum-card">
              <div class="sum-label">Operating Expenditures</div>
              <div class="sum-val expense">${formatCurrency(totalExpenses)}</div>
            </div>
            <div class="sum-card">
              <div class="sum-label">Net Commercial Surplus</div>
              <div class="sum-val surplus">${formatCurrency(netIncome)}</div>
            </div>
          </div>

          <h3 style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Commercial Financial Journal</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Posting / Title</th>
                <th>Type</th>
                <th>Category / Department</th>
                <th>Date</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #9CA3AF;">No postings recorded</td></tr>'}
            </tbody>
          </table>

          <div class="footer" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${logoUrl}" alt="FinFlow" style="height: 18px; object-fit: contain; opacity: 0.75;" />
              <span>FinFlow Commercial Finance Management Suite</span>
            </div>
            <div>Confidential Audit Statement &bull; Page 1 of 1</div>
          </div>

          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 300);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportCSV = () => {
    const rows = [
      ["Type", "Title/Client", "Category/Status", "Amount", "Date"],
      ...data.invoices.map((i) => ["Invoice (Revenue)", `"${i.clientName}"`, i.status, i.totalAmount, new Date(i.issueDate).toLocaleDateString()]),
      ...data.expenses.map((e) => ["Operating Expense", `"${e.title}"`, e.category, e.amount, new Date(e.date).toLocaleDateString()]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `finflow_business_audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Business Financial Reports</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Audit-ready commercial ledgers, revenue analysis, and expense statements</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Audit PDF
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Settled Invoiced Revenue</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Operating Expenditures</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Net Commercial Surplus</p>
          <p className={`text-2xl font-extrabold mt-1 ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(netIncome)}
          </p>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937]">Commercial Financial Journal</h2>
          <span className="text-xs text-[#6B7280]">{data.invoices.length + data.expenses.length} Total Postings</span>
        </div>
        <div className="divide-y divide-[#F4F6F8]">
          {data.invoices.map((inv) => (
            <div key={inv._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Invoice #{inv.invoiceNumber} — {inv.clientName}</p>
                <p className="text-xs text-[#9CA3AF]">Status: {inv.status} · {new Date(inv.issueDate).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-emerald-600">+{formatCurrency(inv.totalAmount)}</p>
            </div>
          ))}
          {data.expenses.map((exp) => (
            <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-[#F9FAFB]">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{exp.title}</p>
                <p className="text-xs text-[#9CA3AF]">{exp.category} · {exp.department || "General"} · {new Date(exp.date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm font-bold text-rose-600">-{formatCurrency(exp.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={Boolean(alertMessage)}
        onClose={() => setAlertMessage("")}
        title="Export PDF Notice"
        message={alertMessage}
        type="warning"
      />
    </div>
  );
}
