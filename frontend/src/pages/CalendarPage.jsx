import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

const API = "http://localhost:5000/api";
const getToken = () => localStorage.getItem("token");
const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` });

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarEvents();
  }, [currentDate]);

  const loadCalendarEvents = async () => {
    try {
      setLoading(true);
      const [txnRes, billRes] = await Promise.allSettled([
        fetch(`${API}/transactions`, { headers: headers() }),
        fetch(`${API}/bills`, { headers: headers() }),
      ]);

      const txns = txnRes.status === "fulfilled" && txnRes.value.ok ? (await txnRes.value.json()).transactions || [] : [];
      const bills = billRes.status === "fulfilled" && billRes.value.ok ? await billRes.value.json() : [];

      const combined = [
        ...txns.map((t) => ({ ...t, eventType: "transaction", dateObj: new Date(t.date) })),
        ...bills.map((b) => ({ ...b, title: `Bill: ${b.name}`, eventType: "bill", dateObj: new Date(b.dueDate) })),
      ];

      setEvents(combined);
    } catch (err) {
      console.error("Calendar load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthYearStr = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const currentMonthEvents = events.filter((e) => {
    return e.dateObj.getMonth() === currentDate.getMonth() && e.dateObj.getFullYear() === currentDate.getFullYear();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Financial Calendar</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Timeline of transactions, bill due dates, and EMI schedules</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 shadow-xs">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-xs font-bold text-[#1F2937] min-w-[120px] text-center">{monthYearStr}</span>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Events List for Current Month */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#1F2937]">Scheduled & Logged Events for {monthYearStr}</h2>
          <span className="text-xs text-[#6B7280]">{currentMonthEvents.length} Items</span>
        </div>
        {currentMonthEvents.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No financial events recorded for this month.
          </div>
        ) : (
          <div className="divide-y divide-[#F4F6F8]">
            {currentMonthEvents.map((evt, idx) => (
              <div key={evt._id || idx} className="flex items-center justify-between px-6 py-4 hover:bg-[#F9FAFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-700">
                    {evt.dateObj.getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1F2937]">{evt.title}</p>
                    <p className="text-xs text-[#9CA3AF]">
                      {evt.eventType === "bill" ? "Bill Due Date" : evt.category || "Transaction"} · {evt.dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold ${evt.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                  {evt.type === "income" ? "+" : "-"}{formatCurrency(evt.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
