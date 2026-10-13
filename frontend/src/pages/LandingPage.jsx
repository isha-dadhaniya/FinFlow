import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Users,
  Briefcase,
  User,
  Wallet,
  Star,
  Check,
  Menu,
  X,
  BarChart3,
  PieChart,
  Receipt,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Building2,
  Calculator,
  IndianRupee,
  Layers,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  Send,
  PiggyBank
} from "lucide-react";
import finflowLogo from "../assets/finflow-logo.png";
import "./LandingPage.css";

/* ───── Currency Guilloche Rosette Watermark (SVG) ───── */
function GuillocheRosette({ size = 520, className = "", reverse = false }) {
  const angles = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`ff-guilloche-watermark ${className}`}
    >
      <g className={reverse ? "ff-rosette-spin-reverse" : "ff-rosette-spin-slow"}>
        {angles.map((ang) => (
          <ellipse
            key={ang}
            cx="250"
            cy="250"
            rx="215"
            ry="68"
            stroke="#10B981"
            strokeWidth="0.8"
            opacity="0.22"
            transform={`rotate(${ang} 250 250)`}
          />
        ))}
        <circle cx="250" cy="250" r="225" stroke="#10B981" strokeWidth="0.9" opacity="0.25" strokeDasharray="3 3" />
        <circle cx="250" cy="250" r="185" stroke="#059669" strokeWidth="0.75" opacity="0.20" />
        <circle cx="250" cy="250" r="145" stroke="#10B981" strokeWidth="0.75" opacity="0.22" strokeDasharray="2 4" />
        <circle cx="250" cy="250" r="95" stroke="#047857" strokeWidth="0.65" opacity="0.25" />
        <circle cx="250" cy="250" r="45" stroke="#10B981" strokeWidth="0.75" opacity="0.30" strokeDasharray="2 2" />
      </g>
    </svg>
  );
}

/* ───── Intersection Observer Hook for Scroll Animations ───── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 200px 0px" }
    );

    const el = ref.current;
    if (el) {
      const revealElements = el.querySelectorAll(
        ".ff-reveal, .ff-reveal-left, .ff-reveal-right, .ff-reveal-scale"
      );
      revealElements.forEach((child) => observer.observe(child));
    }

    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ───── Animated Counter Hook ───── */
function useCounter(end, duration = 2000, startWhenVisible = false) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!startWhenVisible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startWhenVisible, hasStarted]);

  useEffect(() => {
    if (!hasStarted && startWhenVisible) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, hasStarted, startWhenVisible]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════
   LIGHT-THEMED LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const pageRef = useScrollReveal();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState("business");

  // Authentication check
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  // Interactive EMI Calculator State
  const [loanAmount, setLoanAmount] = useState(1200000); // ₹12 Lakhs
  const [loanRate, setLoanRate] = useState(9.2); // 9.2% p.a.
  const [loanTenureYears, setLoanTenureYears] = useState(5); // 5 years

  // Scroll listener for floating navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format INR numbers
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // EMI Calculation Formula
  const calculateEMI = () => {
    const P = loanAmount;
    const r = loanRate / 12 / 100;
    const n = loanTenureYears * 12;
    if (r === 0) return { emi: P / n, totalPayment: P, totalInterest: 0 };
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;
    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest)
    };
  };

  const { emi, totalPayment, totalInterest } = calculateEMI();

  // Animated counters
  const usersCounter = useCounter(12500, 2200, true);
  const assetsCounter = useCounter(65, 2000, true); // in Crores
  const workspacesCounter = useCounter(3, 1000, true);

  // Testimonials list
  const testimonials = [
    {
      name: "Rohit Deshmukh",
      role: "Founder, Zenith Studios",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      content:
        "FinFlow's project budget approval workflow completely eliminated expense leakages in our agency. Everything requires manager approval before balance deduction.",
      rating: 5,
      workspace: "Business Suite"
    },
    {
      name: "Ananya Sharma",
      role: "Architect & Household Lead",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
      content:
        "The Family workspace is a game-changer. My husband and I split monthly groceries, rent, and utility bills transparently with zero confusion.",
      rating: 5,
      workspace: "Family Workspace"
    },
    {
      name: "Vikram Mehta",
      role: "Senior Software Consultant",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      content:
        "The clean light interface and instant EMI calculators make financial planning enjoyable. Tracking SIPs and multiple bank balances is effortless.",
      rating: 5,
      workspace: "Personal Vault"
    },
    {
      name: "Pooja Singhania",
      role: "Managing Director, Apex Labs",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
      content:
        "Having vendor bills, project limits, and invoice generation in a single unified dashboard saved our finance team over 15 hours every week.",
      rating: 5,
      workspace: "Business Suite"
    }
  ];

  return (
    <div ref={pageRef} className="ff-landing-root min-h-screen">
      
      {/* ── Fixed Modern Currency / Guilloche Watermark & Ambient Mint Glows ── */}
      <div className="ff-currency-guilloche-bg" />
      <div className="ff-guilloche-glows">
        <div className="ff-glow-orb-1" />
        <div className="ff-glow-orb-2" />
        <div className="ff-glow-orb-3" />
      </div>

      {/* ───────────────── FLOATING LIGHT NAVBAR ───────────────── */}
      <header className={`ff-navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src={finflowLogo}
              alt="FinFlow"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="ff-nav-link">Features</a>
            <a href="#how-it-works" className="ff-nav-link">How It Works</a>
            <a href="#workspaces" className="ff-nav-link">Workspaces</a>
            <a href="#emi-tool" className="ff-nav-link">EMI Calculator</a>
            <a href="#testimonials" className="ff-nav-link">Reviews</a>
          </nav>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/app/dashboard")}
                className="ff-btn-primary"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link
                  to="/Login"
                  className="text-sm font-bold text-[#334155] hover:text-[#059669] px-4 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/SignUp"
                  className="ff-btn-primary"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-[#334155] hover:text-[#0F172A] hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-[#E2E8F0] px-6 py-6 shadow-xl animate-in slide-in-from-top-4 duration-200">
            <div className="flex flex-col gap-4 text-base font-semibold text-[#334155] mb-6">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-emerald-600">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-emerald-600">How It Works</a>
              <a href="#workspaces" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-emerald-600">Workspaces</a>
              <a href="#emi-tool" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-emerald-600">Loan EMI Calculator</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="py-1 hover:text-emerald-600">Reviews</a>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/app/dashboard")}
                  className="ff-btn-primary w-full"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <Link
                    to="/Login"
                    className="w-full h-11 rounded-full border border-slate-200 bg-white text-[#334155] font-bold text-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/SignUp"
                    className="ff-btn-primary w-full"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ───────────────── HERO SECTION ───────────────── */}
      <section className="relative pt-32 pb-2 lg:pt-36 lg:pb-4 overflow-hidden bg-gradient-to-b from-white/70 via-[#F8FAFC]/50 to-white/70">
        
        {/* Modern Currency Watermark Rosettes */}
        <GuillocheRosette size={680} className="top-4 -right-44 hidden lg:block" />
        <GuillocheRosette size={560} className="top-1/3 -left-36 hidden lg:block" reverse />

        <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
          
          {/* Top Pill Announcement */}
          <div className="flex justify-center mb-6 ff-reveal">
            <div className="ff-badge shadow-xs">
              <span className="ff-pulse-dot" />
              <span>India's Next-Gen Wealth & Expense Operating System</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {/* Hero Headlines */}
          <div className="text-center max-w-4xl mx-auto mb-10 ff-reveal">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.12] mb-6">
              Master Your Money with{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Absolute Clarity & Control.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-[#475569] leading-relaxed max-w-2xl mx-auto">
              Track personal wealth, split family household costs, and manage company project budgets with automated approval workflows. One platform for every rupee you earn, save, and spend.
            </p>
          </div>

          {/* Hero CTA Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 ff-reveal">
            <Link to="/SignUp" className="ff-btn-primary w-full sm:w-auto text-base">
              <span>Start Free Today</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#how-it-works" className="ff-btn-secondary w-full sm:w-auto text-base">
              <span>Explore Live Flow</span>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* 3D Dashboard Mockup in Light Theme */}
          <div className="max-w-5xl mx-auto relative ff-hero-mockup-wrapper ff-reveal-scale">
            
            {/* Floating Inflow Badge */}
            <div className="hidden lg:flex items-center gap-3.5 bg-white/95 backdrop-blur-md border border-emerald-100 shadow-xl rounded-2xl px-4 py-3 absolute -top-6 -left-8 z-20 ff-float">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Live Inflow</span>
                <span className="text-sm font-black text-emerald-600">+₹42,500 Salary Credited</span>
              </div>
            </div>

            {/* Floating Project Approval Badge */}
            <div className="hidden lg:flex items-center gap-3.5 bg-white/95 backdrop-blur-md border border-blue-100 shadow-xl rounded-2xl px-4 py-3 absolute -bottom-6 -right-6 z-20 ff-float-delay">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Approval Workflow</span>
                <span className="text-sm font-black text-slate-800">₹15,000 Project Claim Approved</span>
              </div>
            </div>

            {/* The Main Crisp Dashboard Frame */}
            <div className="ff-hero-mockup">
              
              {/* Window Header Bar */}
              <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-slate-400" />
                    finflow.app/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Sync
                  </span>
                </div>
              </div>

              {/* Dashboard Content Interior */}
              <div className="p-6 sm:p-8 bg-white">
                
                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  
                  {/* Balance Card */}
                  <div className="ff-kpi-card ff-kpi-shimmer bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-200 rounded-2xl p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Balance</span>
                      <span className="ff-badge-pulse text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                        <TrendingUp className="w-3 h-3" />
                        +18.4%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#0F172A] tracking-tight mb-2 group-hover:text-emerald-700 transition-colors">
                      ₹4,82,450.00
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Across 4 Accounts</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Zero Leakage
                      </span>
                    </div>
                  </div>

                  {/* Monthly Inflow */}
                  <div className="ff-kpi-card ff-kpi-shimmer bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Inflow</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-emerald-600 tracking-tight mb-2 group-hover:translate-x-0.5 transition-transform">
                      ₹1,12,000.00
                    </div>
                    <div className="text-xs text-slate-500">
                      Salary, Freelance & Dividends
                    </div>
                  </div>

                  {/* Project Budget Safe Indicator */}
                  <div className="ff-kpi-card ff-kpi-shimmer bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl p-5 group">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Budget Status</span>
                      <span className="ff-badge-pulse text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md shadow-xs">
                        78% Remaining
                      </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                      ₹39,000 / ₹50,000
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden p-0.5">
                      <div className="ff-progress-animated h-full rounded-full transition-all duration-1000" style={{ width: "78%" }} />
                    </div>
                  </div>

                </div>

                {/* Quick Action Pills & Recent Stream */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Quick Action Buttons */}
                  <div className="lg:col-span-5 flex flex-wrap gap-2.5">
                    <button className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors">
                      <Send className="w-3.5 h-3.5 text-slate-500" />
                      Quick Transfer
                    </button>
                    <button className="h-10 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-2 transition-colors border border-emerald-200">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      Add Expense
                    </button>
                    <button className="h-10 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-2 transition-colors border border-blue-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Approvals (2)
                    </button>
                  </div>

                  {/* Recent Activity Bar */}
                  <div className="lg:col-span-7 bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                        ₹
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">AWS Cloud Server Budget</span>
                        <span className="text-[11px] text-slate-400">Approved by Lead &bull; Deducted from Project</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-900">-₹4,500</span>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── ANIMATED STATS BAR ───────────────── */}
      {/* <section className="bg-white/80 backdrop-blur-xs border-y border-[#E2E8F0] py-12 relative z-10 shadow-xs">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            
            <div className="ff-reveal ff-stat-kpi group cursor-default" ref={usersCounter.ref}>
              <div className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mb-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>{usersCounter.count.toLocaleString("en-IN")}</span>
                <span className="text-emerald-600">+</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-slate-900 transition-colors">Active Financial Users</p>
            </div>

            <div className="ff-reveal ff-stat-kpi group cursor-default" ref={assetsCounter.ref}>
              <div className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mb-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>₹{assetsCounter.count}</span>
                <span className="text-emerald-600">Cr+</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-slate-900 transition-colors">Managed Capital & Inflow</p>
            </div>

            <div className="ff-reveal ff-stat-kpi group cursor-default">
              <div className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mb-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>99.9</span>
                <span className="text-emerald-600">%</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-slate-900 transition-colors">Bank-Grade Security SLA</p>
            </div>

            <div className="ff-reveal ff-stat-kpi group cursor-default" ref={workspacesCounter.ref}>
              <div className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mb-1 flex items-center justify-center group-hover:scale-105 transition-transform">
                <span>{workspacesCounter.count}</span>
                <span className="text-emerald-600"> in 1</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#64748B] group-hover:text-slate-900 transition-colors">Personal, Family & Business</p>
            </div>

          </div>
        </div>
      </section> */}

      {/* ───────────────── BENTO GRID FEATURES ───────────────── */}
      <section id="features" className="pt-2 pb-20 bg-transparent relative">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-10 ff-reveal">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Platform Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-4 mb-4">
              Engineered for Complete Capital Clarity
            </h2>
            <p className="text-base text-[#475569]">
              Every tool you need to track, project, allocate, and approve cash flows with zero friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Feature 1: Multi-Workspace Isolation */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Multi-Workspace Isolation</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Switch effortlessly between Personal Vault, Shared Family, and Business profiles. Accounts and transactions stay strictly partitioned.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                <span>Seamless Switcher</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 2: Project Approvals */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-6 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Project Budget Approval System</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Expenses submitted to projects automatically route through an approval gate. Rejected claims preserve remaining project balances.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                <span>Zero Budget Overruns</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 3: Live Expense Analytics */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-6 shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Deep Spending Analytics</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Gain instant clarity on cash burn by categories, vendors, and tags with automated categorization and intelligent trend reports.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600">
                <span>Interactive Charts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 4: Family Expense Split */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Family & Household Splits</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Split groceries, maid payments, school fees, and rent among family members with automated settlement ledgers.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600">
                <span>Fair Settlement Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 5: Invoicing & Vendors */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-6 shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">GST Invoices & Vendor Tracking</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Create clean GST-ready invoices, manage outstanding vendor bills, and monitor payment cycles without extra software.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600">
                <span>Print & PDF Export</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Feature 6: Bank-Grade Privacy */}
            <div className="ff-card-white rounded-3xl p-8 ff-reveal">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-6 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Bank-Grade Privacy & Encryption</h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Your data is strictly protected with token-based session isolation, encrypted passwords, and multi-tenant security architecture.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                <span>256-Bit Protection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ───────────────── 3 STEPS: HOW IT WORKS ───────────────── */}
      <section id="how-it-works" className="py-24 bg-white/75 backdrop-blur-xs border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 ff-reveal">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Simple 3-Step Flow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-4 mb-4">
              How FinFlow Powers Your Finances
            </h2>
            <p className="text-base text-[#475569]">
              Get onboarded and operational in under three minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl p-8 relative ff-reveal">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-sm">
                01
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Set Up Workspaces</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Choose your setup: Personal for individual cash flow, Family for household budgeting, or Business for team projects and vendor bills.
              </p>
            </div>

            <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl p-8 relative ff-reveal">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-sm">
                02
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Connect & Record Inflows</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Log bank accounts, credit cards, and cash reserves. Record expenses on the fly with category tags and invoice attachments.
              </p>
            </div>

            <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl p-8 relative ff-reveal">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-sm">
                03
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Govern, Approve & Grow</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Control project expenses via approvals, forecast monthly interest with the loan simulator, and watch your net capital compound.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ───────────────── WORKSPACE SHOWCASE (TABBED) ───────────────── */}
      <section id="workspaces" className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 ff-reveal">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Tailored Environments
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-4 mb-4">
              Three Workspaces. One Seamless Platform.
            </h2>
            <p className="text-base text-[#475569]">
              Toggle between views to see how FinFlow adapts to your needs.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-10 ff-reveal">
            <div className="bg-slate-200/80 p-1.5 rounded-full flex gap-1 border border-slate-300/50 shadow-inner">
              <button
                onClick={() => setActiveWorkspaceTab("business")}
                className={`ff-tab-button ${activeWorkspaceTab === "business" ? "active" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Business Suite</span>
                </div>
              </button>
              <button
                onClick={() => setActiveWorkspaceTab("personal")}
                className={`ff-tab-button ${activeWorkspaceTab === "personal" ? "active" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Personal Vault</span>
                </div>
              </button>
              <button
                onClick={() => setActiveWorkspaceTab("family")}
                className={`ff-tab-button ${activeWorkspaceTab === "family" ? "active" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Family & Home</span>
                </div>
              </button>
            </div>
          </div>

          {/* Active Tab Card */}
          <div className="max-w-4xl mx-auto bg-white border border-[#E2E8F0] shadow-lg rounded-3xl p-8 sm:p-12 ff-reveal">
            {activeWorkspaceTab === "business" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
                    Enterprise & Agency Grade
                  </span>
                  <h3 className="text-2xl font-black text-[#0F172A] mb-4">
                    Business Capital, Projects & Approvals
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    Designed specifically for agencies, startups, and SMBs. Prevent overspending with real-time budget limits and mandatory manager approvals.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-semibold mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Project budget limit checks & remaining balance deductions
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Mandatory reason required for rejected expense claims
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Vendor invoice tracker and payment status management
                    </li>
                  </ul>
                  <Link to="/SignUp" className="ff-btn-primary">
                    Launch Business Workspace
                  </Link>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Live Project Ledger</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Approval Gate Active
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Mobile App Redesign</span>
                        <span className="text-[11px] text-slate-400">Budget: ₹1,50,000</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">₹85,000 Remaining</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Server Infrastructure</span>
                        <span className="text-[11px] text-slate-400">Budget: ₹50,000</span>
                      </div>
                      <span className="text-xs font-black text-blue-600">₹39,000 Remaining</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeWorkspaceTab === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
                    Individual Wealth
                  </span>
                  <h3 className="text-2xl font-black text-[#0F172A] mb-4">
                    Personal Income, Expenses & SIP Goals
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    Organize your individual net worth, monitor daily expenses by categories, and set automated savings targets for your dream milestones.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-semibold mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Visual monthly envelopes & instant expense logger
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Bank accounts, credit cards & cash balance dashboard
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Emergency fund and wealth compounding targets
                    </li>
                  </ul>
                  <Link to="/SignUp" className="ff-btn-primary">
                    Create Personal Vault
                  </Link>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Savings Milestone</span>
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                      74% Completed
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 mb-3">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-slate-800">New Car Fund</span>
                      <span className="text-emerald-600">₹3,70,000 / ₹5,00,000</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "74%" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeWorkspaceTab === "family" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2 block">
                    Shared Harmony
                  </span>
                  <h3 className="text-2xl font-black text-[#0F172A] mb-4">
                    Family Budgeting & Split Expenses
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed mb-6">
                    Manage collective household spending with family members. Keep track of who paid for what and balance split shares automatically.
                  </p>
                  <ul className="space-y-3 text-sm text-slate-700 font-semibold mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Shared grocery, utility and domestic staff expense log
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Automated balance settlement between family members
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Joint savings contribution tracking for holidays
                    </li>
                  </ul>
                  <Link to="/SignUp" className="ff-btn-primary">
                    Start Family Workspace
                  </Link>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Monthly Split Balance</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Settled
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Monthly Grocery (Supermarket)</span>
                      <span className="text-xs font-bold text-slate-600">₹8,450 &bull; Split 50/50</span>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800">Electricity & High-Speed WiFi</span>
                      <span className="text-xs font-bold text-slate-600">₹3,200 &bull; Split 50/50</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ───────────────── INTERACTIVE LOAN & EMI CALCULATOR ───────────────── */}
      <section id="emi-tool" className="py-24 bg-white/75 backdrop-blur-xs border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 ff-reveal">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Interactive Tool
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-4 mb-4">
              Home, Car & Business EMI Calculator
            </h2>
            <p className="text-base text-[#475569]">
              Adjust the sliders below to calculate monthly payments, total interest, and your amortization schedule.
            </p>
          </div>

          <div className="bg-[#FAFBFC] border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-sm ff-reveal">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Sliders on Left */}
              <div className="lg:col-span-7 space-y-7">
                
                {/* Loan Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Principal</span>
                    <span className="text-lg font-black text-emerald-600">₹{formatINR(loanAmount)}</span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="50000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="ff-range-slider"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1.5">
                    <span>₹50K</span>
                    <span>₹25 Lakh</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interest Rate</span>
                    <span className="text-lg font-black text-emerald-600">{loanRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="18.0"
                    step="0.25"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="ff-range-slider"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1.5">
                    <span>6.0% (Home Loan)</span>
                    <span>12.0%</span>
                    <span>18.0% (Personal)</span>
                  </div>
                </div>

                {/* Loan Tenure */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loan Tenure</span>
                    <span className="text-lg font-black text-emerald-600">{loanTenureYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="ff-range-slider"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-1.5">
                    <span>1 Year</span>
                    <span>15 Years</span>
                    <span>30 Years</span>
                  </div>
                </div>

              </div>

              {/* Result Summary on Right */}
              <div className="lg:col-span-5 bg-white border border-emerald-200/80 rounded-2xl p-6 sm:p-7 shadow-sm text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Monthly Installment (EMI)
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight mb-6">
                  ₹{formatINR(emi)}
                </div>

                <div className="space-y-3.5 pt-4 border-t border-slate-100 text-left">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Principal Amount:</span>
                    <span className="font-bold text-slate-800">₹{formatINR(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Total Interest:</span>
                    <span className="font-bold text-amber-600">₹{formatINR(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm pt-2 border-t border-slate-100">
                    <span className="text-slate-800 font-bold">Total Payable:</span>
                    <span className="font-black text-slate-900">₹{formatINR(totalPayment)}</span>
                  </div>
                </div>

                <Link
                  to="/SignUp"
                  className="mt-6 w-full h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  Track Loans in FinFlow
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── TESTIMONIALS ───────────────── */}
      <section id="testimonials" className="py-24 bg-transparent overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-14 text-center ff-reveal">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Real User Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight mt-4 mb-3">
            Loved by 12,000+ Founders & Families
          </h2>
          <p className="text-base text-[#475569]">
            Here is how everyday users optimize their capital with FinFlow.
          </p>
        </div>

        {/* Marquee Track */}
        <div className="ff-marquee-track gap-6 px-4">
          {[...testimonials, ...testimonials].map((t, idx) => (
            <div
              key={idx}
              className="w-80 sm:w-96 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm shrink-0 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3 text-amber-400">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-[#334155] leading-relaxed mb-6 font-medium">
                "{t.content}"
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">{t.name}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{t.role}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {t.workspace}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────── HIGH-CONVERSION CTA BANNER ───────────────── */}
      <section className="py-20 bg-transparent">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-xl ff-reveal">
            
            {/* Background Light Circles */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/20 text-white px-3.5 py-1 rounded-full mb-4 backdrop-blur-sm">
                Get Started in 60 Seconds
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
                Take Full Control of Your Financial Future Today.
              </h2>
              <p className="text-base sm:text-lg text-emerald-100 mb-8 leading-relaxed">
                Join thousands of individuals, families, and businesses tracking budgets with zero confusion. Completely free to start.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/SignUp"
                  className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:scale-105"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 text-emerald-700" />
                </Link>
                <Link
                  to="/Login"
                  className="w-full sm:w-auto h-12 px-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/30 flex items-center justify-center transition-colors"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-emerald-100 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-white" />
                  No Credit Card Required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-white" />
                  Instant Setup
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-white" />
                  Export Anytime
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── MODERN LIGHT FOOTER ───────────────── */}
      <footer className="bg-[#F8FAFC]/90 backdrop-blur-md border-t border-[#E2E8F0] py-14 text-slate-500">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={finflowLogo}
                  alt="FinFlow"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed mb-4">
                India's unified finance platform for individuals, families, and growing businesses.
              </p>
              <div className="text-xs text-slate-400">
                Engineered with precision for complete transparency.
              </div>
            </div>

            {/* Product column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] mb-4">Product</h4>
              <div className="space-y-2.5">
                <a href="#features" className="ff-footer-link block">Features</a>
                <a href="#how-it-works" className="ff-footer-link block">How It Works</a>
                <a href="#emi-tool" className="ff-footer-link block">EMI Calculator</a>
                <a href="#workspaces" className="ff-footer-link block">Workspaces</a>
              </div>
            </div>

            {/* Workspaces column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] mb-4">Workspaces</h4>
              <div className="space-y-2.5">
                <span className="ff-footer-link block">Personal Vault</span>
                <span className="ff-footer-link block">Shared Family Suite</span>
                <span className="ff-footer-link block">Business & Approvals</span>
              </div>
            </div>

            {/* Get Started column */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#0F172A] mb-4">Get Started</h4>
              <div className="space-y-2.5">
                <Link to="/SignUp" className="ff-footer-link block">Create Account</Link>
                <Link to="/Login" className="ff-footer-link block">Sign In</Link>
                <a href="#testimonials" className="ff-footer-link block">Client Reviews</a>
              </div>
            </div>

          </div>

          <div className="ff-divider" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
            <span className="text-xs text-[#94A3B8]">
              &copy; {new Date().getFullYear()} FinFlow. All rights reserved.
            </span>
            <div className="flex items-center gap-6 text-xs text-[#94A3B8]">
              <span className="hover:text-slate-700 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-slate-700 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-slate-700 cursor-pointer transition-colors">Security Standards</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
