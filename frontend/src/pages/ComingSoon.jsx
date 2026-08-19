import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Construction, ArrowLeft } from "lucide-react";

export default function ComingSoon() {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#005B4F]/10 flex items-center justify-center mb-5">
        <Construction className="w-8 h-8 text-[#005B4F]" />
      </div>
      <h1 className="text-xl font-bold text-[#1F2937] mb-2">{pageName}</h1>
      <p className="text-sm text-[#6B7280] max-w-sm mb-6">
        This page is coming soon. We're building something great here!
      </p>
      <Link to="/app/dashboard"
        className="flex items-center gap-2 px-4 py-2.5 bg-[#005B4F] text-white text-sm font-semibold rounded-xl hover:bg-[#004A40] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
