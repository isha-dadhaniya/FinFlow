import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, X, Briefcase } from "lucide-react";

const ROLES = ["Owner", "Admin", "Finance", "Manager", "Employee", "Accountant"];
const DEPARTMENTS = ["Sales", "Marketing", "HR", "Finance", "IT", "Operations", "Development", "Other"];

export default function Employees() {
  const [employees, setEmployees] = useState([]); const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", employeeId: "", department: "IT", designation: "", role: "Employee", email: "", phone: "" });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const t = localStorage.getItem("token"); const r = await fetch("http://localhost:5000/api/workspace/employees?workspace=business", { headers: { Authorization: `Bearer ${t}` } }); const d = await r.json(); setEmployees(Array.isArray(d) ? d : []); } catch { setEmployees([]); } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); const t = localStorage.getItem("token");
    const url = editItem ? `http://localhost:5000/api/workspace/employees/${editItem._id}` : "http://localhost:5000/api/workspace/employees";
    await fetch(url, { method: editItem ? "PUT" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ ...form, workspace: "business" }) });
    setShowForm(false); setEditItem(null); setForm({ name: "", employeeId: "", department: "IT", designation: "", role: "Employee", email: "", phone: "" }); loadData();
  };

  const del = async (id) => { if (!confirm("Remove?")) return; const t = localStorage.getItem("token"); await fetch(`http://localhost:5000/api/workspace/employees/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } }); loadData(); };

  const roleColors = { Owner: "bg-purple-50 text-purple-600", Admin: "bg-red-50 text-red-600", Finance: "bg-blue-50 text-blue-600", Manager: "bg-amber-50 text-amber-600", Employee: "bg-gray-100 text-gray-600", Accountant: "bg-[#005B4F]/10 text-[#005B4F]" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1F2937]">Employees</h1><p className="text-sm text-[#6B7280] mt-0.5">Manage team members</p></div>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E] shadow-lg shadow-[#1E232A]/20"><Plus className="w-4 h-4" /> Add Employee</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm text-gray-400">Loading...</div> :
        employees.length === 0 ? <div className="p-12 text-center"><Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No employees added</p></div> : (
          <div className="divide-y divide-[#F4F6F8]">
            {employees.map(emp => (
              <div key={emp._id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1E232A] text-white font-bold text-sm flex items-center justify-center">{emp.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-semibold text-[#1F2937]">{emp.name} <span className="text-[10px] text-[#9CA3AF] ml-1">{emp.employeeId}</span></p>
                    <p className="text-[11px] text-[#9CA3AF]">{emp.designation || emp.role} · {emp.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${roleColors[emp.role] || roleColors.Employee}`}>{emp.role}</span>
                  <button onClick={() => { setEditItem(emp); setForm({ name: emp.name, employeeId: emp.employeeId, department: emp.department, designation: emp.designation, role: emp.role, email: emp.email, phone: emp.phone }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(emp._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold text-[#1F2937]">{editItem ? "Edit" : "Add"} Employee</h2><button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]" />
                <input type="text" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm">{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="h-11 px-3 border border-[#E5E7EB] rounded-xl text-sm">{ROLES.map(r => <option key={r}>{r}</option>)}</select>
              </div>
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#1E232A]" />
              <button type="submit" className="w-full h-12 bg-[#1E232A] text-white text-sm font-semibold rounded-xl hover:bg-[#15191E]">{editItem ? "Update" : "Add"} Employee</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
