import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, ReceiptIndianRupee, Download, Printer, Check, X, Building2, Calendar, DollarSign } from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";
import finflowLogo from "../../assets/finflow-logo.png";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ description: "Consulting / Development Services", quantity: 1, rate: 25000 }],
    taxRate: "",
    discount: "",
    status: "Draft",
    notes: "Payment due within 15 days of invoice date.",
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/business/invoices`, { headers: headers() });
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Invoices load error:", err);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { description: "", quantity: 1, rate: 0 }],
    }));
  };

  const removeItemRow = (idx) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm((prev) => {
      const next = [...prev.items];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, items: next };
    });
  };

  const currentSubtotal = (form.items || []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
    0
  );
  const currentTaxRate = form.taxRate !== "" && form.taxRate !== undefined ? Number(form.taxRate) : 0;
  const currentTaxAmount = currentTaxRate > 0 ? Math.round(((currentSubtotal * currentTaxRate) / 100) * 100) / 100 : 0;
  const currentDiscount = Number(form.discount) || 0;
  const currentTotal = Math.max(0, currentSubtotal + currentTaxAmount - currentDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editItem ? `${API}/business/invoices/${editItem._id}` : `${API}/business/invoices`;
      await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify({
          ...form,
          subtotal: currentSubtotal,
          taxRate: currentTaxRate,
          tax: currentTaxAmount,
          discount: currentDiscount,
          totalAmount: currentTotal,
        }),
      });
      setShowModal(false);
      setEditItem(null);
      resetForm();
      loadInvoices();
    } catch (err) {
      console.error("Save invoice error:", err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/business/invoices/${id}`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ status }),
      });
      loadInvoices();
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteInvoiceId) return;
    try {
      await fetch(`${API}/business/invoices/${deleteInvoiceId}`, { method: "DELETE", headers: headers() });
      loadInvoices();
    } catch (err) {
      console.error("Delete invoice error:", err);
    } finally {
      setDeleteInvoiceId(null);
    }
  };

  const resetForm = () => {
    setForm({
      clientName: "",
      clientEmail: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [{ description: "Consulting / Development Services", quantity: 1, rate: 25000 }],
      taxRate: "",
      discount: "",
      status: "Draft",
      notes: "Payment due within 15 days of invoice date.",
    });
  };

  const filtered = invoices.filter((inv) => {
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;
    if (search && !inv.clientName?.toLowerCase().includes(search.toLowerCase()) && !inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const paidAmount = invoices.filter((i) => i.status === "Paid").reduce((sum, i) => sum + (i.totalAmount || 0), 0);

  const statusColors = {
    Draft: "bg-gray-100 text-gray-700",
    Sent: "bg-blue-50 text-blue-700",
    Paid: "bg-emerald-50 text-emerald-700",
    Overdue: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Invoice Management</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Create client invoices, track receivables, and export bills</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditItem(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-all shadow-md shadow-[#005B4F]/20 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Revenue Invoiced</p>
          <p className="text-2xl font-extrabold text-[#005B4F] mt-1">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Settled / Paid Invoices</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Outstanding Receivables</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatCurrency(Math.max(0, totalInvoiced - paidAmount))}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "Draft", "Sent", "Paid", "Overdue"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterStatus === st ? "bg-[#005B4F] text-white shadow-md shadow-[#005B4F]/20" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
              }`}
            >
              {st === "all" ? "All" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ReceiptIndianRupee className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No invoices found</p>
            <p className="text-xs text-gray-400 mt-1">Generate your first client bill using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between p-4 sm:p-5 hover:bg-[#F9FAFB] transition-colors gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#005B4F]/10 text-[#005B4F] flex items-center justify-center shrink-0">
                    <ReceiptIndianRupee className="w-5 h-5 text-[#005B4F]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1F2937] truncate">{inv.invoiceNumber || "Invoice"}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5 truncate">
                      <span className="font-semibold text-[#1F2937]">{inv.clientName}</span>
                      <span className="text-[#9CA3AF]"> · Issued: {new Date(inv.issueDate).toLocaleDateString()} · Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Upon receipt"}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <p className="text-sm sm:text-base font-extrabold text-[#1F2937] whitespace-nowrap">{formatCurrency(inv.totalAmount)}</p>

                  <select
                    value={inv.status}
                    onChange={(e) => updateStatus(inv._id, e.target.value)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-bold border-0 outline-none cursor-pointer transition-colors ${
                      inv.status === "Paid"
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : inv.status === "Sent"
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        : inv.status === "Overdue"
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>

                  <button
                    onClick={() => {
                      setEditItem(inv);
                      const derivedRate = inv.taxRate !== undefined && inv.taxRate !== null
                        ? (inv.taxRate || "")
                        : (inv.tax && inv.subtotal ? Math.round((inv.tax / inv.subtotal) * 100) : "");
                      setForm({
                        clientName: inv.clientName || "",
                        clientEmail: inv.clientEmail || "",
                        issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split("T")[0] : "",
                        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "",
                        items: inv.items?.length ? inv.items : [{ description: "", quantity: 1, rate: 0 }],
                        taxRate: derivedRate === 0 ? "" : derivedRate,
                        discount: inv.discount || "",
                        status: inv.status || "Draft",
                        notes: inv.notes || "",
                      });
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#005B4F]"
                    title="Edit Invoice"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setPreviewItem(inv)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="View & Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button onClick={() => setDeleteInvoiceId(inv._id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Generator Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "New"} Invoice</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Client Name</label>
                  <input
                    type="text"
                    placeholder="Acme Corp / John Doe"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="billing@acme.com"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    required
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addItemRow} className="text-xs font-bold text-[#005B4F] hover:underline">
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        required
                        className="flex-3 h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F]"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                        min="1"
                        className="w-16 h-10 px-2 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F]"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        required
                        min="0"
                        className="w-24 h-10 px-2 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#005B4F]"
                      />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItemRow(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Tax / GST (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 18"
                      value={form.taxRate}
                      onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                      onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                      min="0"
                      max="100"
                      step="any"
                      className="w-full h-11 px-4 pr-8 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">%</span>
                  </div>
                  {currentTaxRate > 0 && (
                    <p className="text-[11px] text-[#005B4F] font-semibold mt-1">
                      = {formatCurrency(currentTaxAmount)} ({currentTaxRate}%)
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    onFocus={(e) => { if (e.target.value === "0") e.target.select(); }}
                    min="0"
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#005B4F]"
                >
                  <option value="Draft">Draft (Not sent yet)</option>
                  <option value="Sent">Sent (Issued to client)</option>
                  <option value="Paid">Paid (Settled / Received)</option>
                </select>
              </div>

              {/* Real-time Invoice Calculation Summary */}
              <div className="bg-gray-50 border border-gray-200/70 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(currentSubtotal)}</span>
                </div>
                {currentTaxRate > 0 && (
                  <div className="flex justify-between text-[#005B4F]">
                    <span>Tax / GST ({currentTaxRate}%):</span>
                    <span className="font-semibold">+{formatCurrency(currentTaxAmount)}</span>
                  </div>
                )}
                {currentDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span className="font-semibold">-{formatCurrency(currentDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
                  <span>Total Amount:</span>
                  <span className="text-[#005B4F]">{formatCurrency(currentTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] shadow-md shadow-[#005B4F]/20 transition-all cursor-pointer"
              >
                {editItem ? "Save Changes" : "Generate & Save Invoice"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print-invoice-container" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto print-invoice-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div className="flex items-center gap-3.5">
                <img src={finflowLogo} alt="FinFlow" className="h-9 object-contain" />
                <div className="border-l border-gray-200 pl-3.5">
                  <h2 className="text-xl font-extrabold text-[#1F2937]">INVOICE</h2>
                  <p className="text-xs text-gray-500 font-semibold">{previewItem.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#005B4F] text-white text-xs font-bold rounded-lg hover:bg-[#004A40] transition-colors cursor-pointer">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setPreviewItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between text-xs mb-6">
              <div>
                <p className="font-bold text-gray-700">Billed To:</p>
                <p className="text-base font-extrabold text-[#1F2937]">{previewItem.clientName}</p>
                {previewItem.clientEmail && <p className="text-gray-500">{previewItem.clientEmail}</p>}
              </div>
              <div className="text-right">
                <p><span className="font-bold text-gray-700">Issue Date:</span> {new Date(previewItem.issueDate).toLocaleDateString()}</p>
                <p><span className="font-bold text-gray-700">Due Date:</span> {previewItem.dueDate ? new Date(previewItem.dueDate).toLocaleDateString() : "Upon receipt"}</p>
                <p><span className="font-bold text-gray-700">Status:</span> {previewItem.status}</p>
              </div>
            </div>

            <table className="w-full text-xs text-left mb-6 border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 font-bold text-gray-700">Item</th>
                  <th className="py-2 px-3 font-bold text-gray-700 text-center">Qty</th>
                  <th className="py-2 px-3 font-bold text-gray-700 text-right">Rate</th>
                  <th className="py-2 px-3 font-bold text-gray-700 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(previewItem.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3 font-medium">{it.description}</td>
                    <td className="py-2.5 px-3 text-center">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(it.rate)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatCurrency((it.quantity || 1) * (it.rate || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t pt-4 text-right space-y-1 text-xs">
              <p className="text-gray-600">Subtotal: {formatCurrency(previewItem.subtotal || (previewItem.items || []).reduce((s, it) => s + ((Number(it.quantity) || 1) * (Number(it.rate) || 0)), 0))}</p>
              {previewItem.tax > 0 && (
                <p className="text-gray-600">
                  Tax / GST {previewItem.taxRate ? `(${previewItem.taxRate}%)` : ""}: +{formatCurrency(previewItem.tax)}
                </p>
              )}
              {previewItem.discount > 0 && <p className="text-emerald-600">Discount: -{formatCurrency(previewItem.discount)}</p>}
              <p className="text-lg font-extrabold text-[#1F2937] pt-2">Total Due: {formatCurrency(previewItem.totalAmount)}</p>
            </div>

            {previewItem.notes && (
              <div className="border-t mt-4 pt-3 text-left text-xs text-gray-500">
                <p className="font-semibold text-gray-700 mb-0.5">Notes & Terms:</p>
                <p>{previewItem.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteInvoiceId)}
        onClose={() => setDeleteInvoiceId(null)}
        onConfirm={confirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice permanently? This action cannot be undone."
        confirmText="Delete Invoice"
        isDanger={true}
      />
    </div>
  );
}
