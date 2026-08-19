import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileText, Download, Printer, Check, X, Building2, Calendar, DollarSign } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    items: [{ description: "Consulting / Development Services", quantity: 1, rate: 25000 }],
    tax: 0,
    discount: 0,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editItem ? `${API}/business/invoices/${editItem._id}` : `${API}/business/invoices`;
      await fetch(url, {
        method: editItem ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(form),
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this invoice permanently?")) return;
    try {
      await fetch(`${API}/business/invoices/${id}`, { method: "DELETE", headers: headers() });
      loadInvoices();
    } catch (err) {
      console.error("Delete invoice error:", err);
    }
  };

  const resetForm = () => {
    setForm({
      clientName: "",
      clientEmail: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      items: [{ description: "Consulting / Development Services", quantity: 1, rate: 25000 }],
      tax: 0,
      discount: 0,
      status: "Draft",
      notes: "Payment due within 15 days of invoice date.",
    });
  };

  const filtered = invoices.filter((inv) => {
    if (filterStatus !== "all" && inv.status !== filterStatus) return false;
    if (search && !inv.clientName?.toLowerCase().includes(search.toLowerCase()) && !inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalInvoiced = filtered.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
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
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors shadow-lg shadow-[#1E232A]/20"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Total Revenue Invoiced</p>
          <p className="text-2xl font-extrabold text-[#1E232A] mt-1">{formatCurrency(totalInvoiced)}</p>
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
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "Draft", "Sent", "Paid", "Overdue"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterStatus === st ? "bg-[#1E232A] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50"
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
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No invoices found</p>
            <p className="text-xs text-gray-400 mt-1">Generate your first client bill using the button above</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {filtered.map((inv) => (
              <div key={inv._id} className="flex items-center justify-between p-5 hover:bg-[#F9FAFB] transition-colors flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#1E232A]/10 text-[#1E232A] flex items-center justify-center font-extrabold text-xs">
                    {inv.invoiceNumber || "INV"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#1F2937]">{inv.clientName}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${statusColors[inv.status] || statusColors.Draft}`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mt-0.5">
                      Issued: {new Date(inv.issueDate).toLocaleDateString()} · Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Upon receipt"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-base font-extrabold text-[#1F2937]">{formatCurrency(inv.totalAmount)}</p>

                  <select
                    value={inv.status}
                    onChange={(e) => updateStatus(inv._id, e.target.value)}
                    className="h-8 px-2 border border-[#E5E7EB] rounded-lg text-xs font-semibold text-[#1F2937] outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>

                  <button
                    onClick={() => setPreviewItem(inv)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="View & Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button onClick={() => handleDelete(inv._id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
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
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Client Email</label>
                  <input
                    type="email"
                    placeholder="billing@acme.com"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
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
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider">Line Items</label>
                  <button type="button" onClick={addItemRow} className="text-xs font-bold text-[#1E232A] hover:underline">
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
                        className="flex-3 h-10 px-3 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#1E232A]"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                        min="1"
                        className="w-16 h-10 px-2 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#1E232A]"
                      />
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        required
                        min="0"
                        className="w-24 h-10 px-2 border border-[#E5E7EB] rounded-xl text-xs outline-none focus:border-[#1E232A]"
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
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Tax / GST (₹)</label>
                  <input
                    type="number"
                    value={form.tax}
                    onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })}
                    min="0"
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    min="0"
                    className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] transition-colors"
              >
                Generate & Save Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-[#1F2937]">INVOICE</h2>
                <p className="text-xs text-gray-500 font-semibold">{previewItem.invoiceNumber}</p>
              </div>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E232A] text-white text-xs font-bold rounded-lg">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
            </div>

            <div className="flex justify-between text-xs mb-6">
              <div>
                <p className="font-bold text-gray-700">Billed To:</p>
                <p className="text-base font-extrabold text-[#1F2937]">{previewItem.clientName}</p>
                <p className="text-gray-500">{previewItem.clientEmail}</p>
              </div>
              <div className="text-right">
                <p><span className="font-bold text-gray-700">Date:</span> {new Date(previewItem.issueDate).toLocaleDateString()}</p>
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
              {previewItem.tax > 0 && <p className="text-gray-600">Tax / GST: +{formatCurrency(previewItem.tax)}</p>}
              {previewItem.discount > 0 && <p className="text-emerald-600">Discount: -{formatCurrency(previewItem.discount)}</p>}
              <p className="text-lg font-extrabold text-[#1F2937] pt-2">Total Due: {formatCurrency(previewItem.totalAmount)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
