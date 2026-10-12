import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Users,
  Briefcase,
  User,
  Calculator,
  Wallet,
  Star,
  Check,
  Menu,
  X,
  CreditCard,
  Building,
  Receipt,
  Sparkles
} from "lucide-react";
import finflowLogo from "../assets/finflow-logo.png";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Authentication check
  const isAuthenticated = Boolean(localStorage.getItem("token"));

  // Interactive Loan EMI Calculator State (in Indian Rupees ₹)
  const [loanAmount, setLoanAmount] = useState(1000000); // 10 Lakhs
  const [loanRate, setLoanRate] = useState(8.5); // 8.5% p.a.
  const [loanTenureYears, setLoanTenureYears] = useState(5); // 5 years

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Format numbers in Indian number format (e.g. 10,00,000)
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0
    }).format(val);
  };

  // Monthly EMI calculation formula: [P x R x (1+R)^N]/[(1+R)^N-1]
  const calculateEMI = () => {
    const p = parseFloat(loanAmount);
    const annualRate = parseFloat(loanRate);
    const n = parseFloat(loanTenureYears) * 12;

    if (!p || !annualRate || !n) return { emi: 0, totalPayment: 0, totalInterest: 0 };

    const r = annualRate / 12 / 100;
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      principalRatio: Math.round((p / totalPayment) * 100),
      interestRatio: Math.round((totalInterest / totalPayment) * 100)
    };
  };

  const emiData = calculateEMI();

  return (
    <div className="min-h-screen bg-white text-[#344554] font-sans overflow-x-hidden selection:bg-[#12C48B] selection:text-white">

      {/* ───────────────── HEADER (SPENDEE STYLE) ───────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#E8EEF2] py-3.5 shadow-xs"
            : "bg-white py-5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src={finflowLogo}
              alt="FinFlow"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="font-extrabold text-2xl tracking-tight text-[#344554]">
              FinFlow
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#6C767F]">
            <a href="#how-it-works" className="hover:text-[#12C48B] transition-colors">
              How It Works
            </a>
            <a href="#workspaces" className="hover:text-[#12C48B] transition-colors">
              Workspaces
            </a>
            <a href="#emi-tool" className="hover:text-[#12C48B] transition-colors">
              EMI Calculator
            </a>
            <a href="#testimonials" className="hover:text-[#12C48B] transition-colors">
              Reviews
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate("/app/dashboard")}
                className="h-10 px-6 rounded-full bg-[#12C48B] hover:bg-[#0EAA77] text-white font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer"
              >
                Go to App &rarr;
              </button>
            ) : (
              <>
                <Link
                  to="/Login"
                  className="text-sm font-bold text-[#344554] hover:text-[#12C48B] px-3 py-2 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/SignUp"
                  className="h-10 px-6 rounded-full bg-[#12C48B] hover:bg-[#0EAA77] text-white font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#344554] hover:bg-gray-100 rounded-lg"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E8EEF2] px-6 py-5 shadow-lg">
            <div className="flex flex-col gap-4 text-base font-semibold text-[#344554] mb-6">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#workspaces" onClick={() => setMobileMenuOpen(false)}>
                Workspaces (Personal, Family, Business)
              </a>
              <a href="#emi-tool" onClick={() => setMobileMenuOpen(false)}>
                Loan EMI Tool
              </a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>
                Reviews
              </a>
            </div>

            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate("/app/dashboard")}
                  className="w-full h-11 rounded-full bg-[#12C48B] text-white font-bold text-sm flex items-center justify-center"
                >
                  Go to App &rarr;
                </button>
              ) : (
                <>
                  <Link
                    to="/Login"
                    className="w-full h-11 rounded-full border border-gray-300 text-[#344554] font-bold text-sm flex items-center justify-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/SignUp"
                    className="w-full h-11 rounded-full bg-[#12C48B] text-white font-bold text-sm flex items-center justify-center"
                  >
                    Get Started Free &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ───────────────── HERO SECTION (EXACT SPENDEE LAYOUT) ───────────────── */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        
        {/* Spendee SVG geometric circle background graphic */}
        <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/4 w-[750px] h-[750px] pointer-events-none opacity-40 -z-10">
          <svg viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="400" cy="400" r="390" stroke="#12C48B" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="400" cy="400" r="280" fill="#52EBBA" fillOpacity="0.12" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Spendee-style Typography & Copy */}
            <div className="lg:col-span-6 text-center lg:text-left">
              
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-normal text-[#344554] tracking-tight leading-[1.15] mb-5">
                The only app that <br />
                <b className="font-extrabold text-[#344554]">gets your money into shape</b>
              </h1>

              <p className="text-lg text-[#6C767F] font-normal leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                Manage personal budgeting, family shared splits, and business finances with ease from one place.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                <Link
                  to="/SignUp"
                  className="w-full sm:w-auto h-13 px-8 rounded-full bg-[#12C48B] hover:bg-[#0EAA77] text-white font-bold text-base transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                >
                  <span>Start Free with FinFlow</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/Login"
                  className="w-full sm:w-auto h-13 px-7 rounded-full bg-white hover:bg-gray-50 text-[#344554] font-bold text-base border border-[#D9DFE5] transition-all duration-200 flex items-center justify-center cursor-pointer"
                >
                  Log In to App
                </Link>
              </div>

              {/* Minimal Trust Indicator */}
              <div className="flex items-center justify-center lg:justify-start gap-6 text-xs text-[#6C767F] font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#12C48B] stroke-[3]" />
                  Personal, Family & Business
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#12C48B] stroke-[3]" />
                  Free to use
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#12C48B] stroke-[3]" />
                  100% Private
                </span>
              </div>
            </div>

            {/* Right Column: Realistic Spendee Smartphone Mockup */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
              
              {/* Phone Device Mockup */}
              <div className="spendee-phone-frame">
                
                {/* Speaker pill */}
                <div className="phone-speaker" />

                {/* Status Bar */}
                <div className="px-6 pt-1 pb-3 flex justify-between items-center text-[11px] font-bold text-gray-400">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Inside Phone Screen Content */}
                <div className="px-5 pb-6">
                  
                  {/* Total Expenses Header */}
                  <div className="text-center my-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#FE5A61] tracking-tight block">
                      - ₹48,500
                    </span>
                    <span className="text-xs font-semibold text-[#8C98A4]">
                      Total monthly expenses
                    </span>
                  </div>

                  {/* Colorful Circular SVG Donut Chart (Spendee Signature) */}
                  <div className="relative w-44 h-44 mx-auto my-4 flex items-center justify-center">
                    <svg className="w-full h-full donut-ring" viewBox="0 0 100 100">
                      {/* Segment 1: Rent (26%) Blue */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#40C3F9"
                        strokeWidth="11"
                        strokeDasharray="62 176"
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: SIP & Savings (22%) Mint Green */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#12C48B"
                        strokeWidth="11"
                        strokeDasharray="52 186"
                        strokeDashoffset="-63"
                      />
                      {/* Segment 3: Swiggy & Groceries (20%) Coral */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#FE5A61"
                        strokeWidth="11"
                        strokeDasharray="48 190"
                        strokeDashoffset="-116"
                      />
                      {/* Segment 4: Home Loan EMI (18%) Yellow */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#FFC053"
                        strokeWidth="11"
                        strokeDasharray="43 195"
                        strokeDashoffset="-165"
                      />
                      {/* Segment 5: Bills & WiFi (14%) Pink */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#FF6FAF"
                        strokeWidth="11"
                        strokeDasharray="33 205"
                        strokeDashoffset="-209"
                      />
                    </svg>

                    {/* Donut Center: Quick Status */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Oct 2026
                      </span>
                      <span className="text-sm font-extrabold text-[#344554]">
                        28 Trans.
                      </span>
                    </div>

                    {/* Floating percentage badges around the donut */}
                    <span className="absolute -top-1 right-3 text-[10px] font-bold bg-[#12C48B] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                      22% SIP
                    </span>
                    <span className="absolute bottom-2 -left-2 text-[10px] font-bold bg-[#FE5A61] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                      20% Food
                    </span>
                    <span className="absolute -bottom-1 right-4 text-[10px] font-bold bg-[#FFC053] text-white px-1.5 py-0.5 rounded-full shadow-xs">
                      18% EMI
                    </span>
                  </div>

                  {/* Spendee stats: Average expense & Busiest day */}
                  <div className="grid grid-cols-2 text-center py-2.5 my-3 bg-[#F9FAFB] rounded-xl border border-[#E8EEF2] text-xs">
                    <div className="border-r border-[#E8EEF2] pr-2">
                      <span className="font-extrabold text-[#344554] block">
                        ₹1,560
                      </span>
                      <span className="text-[10px] text-[#8C98A4]">
                        Avrg expenses
                      </span>
                    </div>
                    <div className="pl-2">
                      <span className="font-extrabold text-[#344554] block">
                        Saturday
                      </span>
                      <span className="text-[10px] text-[#8C98A4]">
                        Busiest day
                      </span>
                    </div>
                  </div>

                  {/* Transaction Rows inside Phone */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8EEF2]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FE5A61]/15 text-[#FE5A61] flex items-center justify-center font-bold text-sm">
                          🍕
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#344554] block">
                            Swiggy & Dining
                          </span>
                          <span className="text-[10px] text-[#8C98A4]">
                            14 transactions
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#FE5A61]">
                        - ₹4,200
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E8EEF2]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#40C3F9]/15 text-[#40C3F9] flex items-center justify-center font-bold text-sm">
                          🏠
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#344554] block">
                            Apartment Rent
                          </span>
                          <span className="text-[10px] text-[#8C98A4]">
                            Auto-debited
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-[#FE5A61]">
                        - ₹18,000
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Floating Pill Card 1: Salary Credited */}
              <div className="hidden sm:flex absolute -top-3 -left-10 bg-white p-3 rounded-2xl shadow-lg border border-[#E8EEF2] items-center gap-2.5 anim-float-1 max-w-[210px]">
                <div className="w-8 h-8 rounded-xl bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center font-bold text-xs shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8C98A4] block">Salary Credited</span>
                  <span className="text-xs font-extrabold text-[#12C48B]">+ ₹85,000</span>
                </div>
              </div>

              {/* Floating Pill Card 2: Loan EMI Tracker */}
              <div className="hidden sm:flex absolute -bottom-4 -right-6 bg-white p-3 rounded-2xl shadow-lg border border-[#E8EEF2] items-center gap-2.5 anim-float-2 max-w-[220px]">
                <div className="w-8 h-8 rounded-xl bg-[#FFC053]/20 text-[#D97706] flex items-center justify-center font-bold text-xs shrink-0">
                  ⚡
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8C98A4] block">Car Loan EMI Paid</span>
                  <span className="text-xs font-extrabold text-[#344554]">₹12,500 / mo</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── STEP 1: SEE ALL MONEY IN ONE PLACE (SPENDEE STEP 1) ───────────────── */}
      <section id="how-it-works" className="py-20 lg:py-24 bg-[#F9FAFB] border-t border-[#E8EEF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Step 1 Explanation */}
            <div className="lg:col-span-6 relative">
              <div className="spendee-step-num -mb-12">
                1
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12C48B] block mb-2">
                Step 1
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight mb-4">
                See all your money <br />in one place
              </h2>
              <ul className="space-y-3.5 text-sm text-[#6C767F]">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Track all your bank accounts (HDFC, SBI, ICICI) and cash in one clean interface.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Family shared pool for joint household expenses without mixing personal savings.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Add manual cash expenses quickly on the go.</span>
                </li>
              </ul>
            </div>

            {/* Right: Spendee-Style Card Stack */}
            <div className="lg:col-span-6 space-y-3 max-w-md mx-auto lg:mx-0">
              
              {/* Wallet Card 1: HDFC Salary */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEF2] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="text-[11px] font-bold text-[#8C98A4] block">Salary Account</span>
                  <span className="text-sm font-extrabold text-[#344554] block">HDFC Bank • ****5012</span>
                  <span className="text-xs text-[#6C767F]">Auto-categorized</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#12C48B]">₹85,400</span>
                </div>
              </div>

              {/* Wallet Card 2: Mutual Fund SIP */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEF2] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="text-[11px] font-bold text-[#8C98A4] block">Investment & SIP</span>
                  <span className="text-sm font-extrabold text-[#344554] block">Zerodha Coin & Nifty 50</span>
                  <span className="text-xs text-[#6C767F]">Monthly deposit: ₹10,000</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#344554]">₹2,40,000</span>
                </div>
              </div>

              {/* Wallet Card 3: Family Shared Wallet */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEF2] shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="text-[11px] font-bold text-[#8C98A4] block">Family Shared Wallet</span>
                  <span className="text-sm font-extrabold text-[#344554] block">Household Groceries & Rent</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">M</span>
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center">D</span>
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px] flex items-center justify-center">R</span>
                    <span className="text-[11px] text-[#8C98A4] ml-1">3 members</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-[#344554]">₹24,500</span>
                </div>
              </div>

              {/* Add Account Button (Spendee style) */}
              <div className="border-2 border-dashed border-[#D9DFE5] rounded-2xl p-3.5 text-center text-xs font-bold text-[#6C767F] hover:border-[#12C48B] hover:text-[#12C48B] transition-colors cursor-pointer">
                + Add New Wallet or Bank Account
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── STEP 2: UNDERSTAND FINANCIAL HABITS (SPENDEE STEP 2) ───────────────── */}
      <section className="py-20 lg:py-24 bg-white border-t border-[#E8EEF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Spendee Area Chart & Cashflow status */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-[#F9FAFB] p-6 rounded-3xl border border-[#E8EEF2] shadow-sm space-y-4 max-w-md mx-auto lg:mx-0">
                
                {/* Account Balance Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-[#8C98A4] uppercase">Account Cashflow</span>
                    <span className="text-sm font-bold text-[#344554] block">Oct 1 – Oct 31, 2026</span>
                  </div>
                  <span className="text-xs font-bold text-[#12C48B] bg-[#12C48B]/10 px-2 py-0.5 rounded-full">
                    Positive Net
                  </span>
                </div>

                {/* Simulated Wave Graph */}
                <div className="h-28 w-full relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 300 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="spendeeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#12C48B" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#12C48B" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q50,20 100,50 T200,20 T300,40 L300,100 L0,100 Z"
                      fill="url(#spendeeGrad)"
                    />
                    <path
                      d="M0,80 Q50,20 100,50 T200,20 T300,40"
                      fill="none"
                      stroke="#12C48B"
                      strokeWidth="3"
                    />
                  </svg>
                </div>

                {/* Status Badges */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-[#E8EEF2] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C98A4] block">Monthly Net</span>
                      <span className="text-xs font-extrabold text-[#12C48B]">+ ₹36,900</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-[#E8EEF2] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#FE5A61]/15 text-[#FE5A61] flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8C98A4] block">Current Balance</span>
                      <span className="text-xs font-extrabold text-[#344554]">₹3,25,400</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right: Step 2 Text */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative">
              <div className="spendee-step-num -mb-12">
                2
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12C48B] block mb-2">
                Step 2
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight mb-4">
                Understand your <br />financial habits
              </h2>
              <ul className="space-y-3.5 text-sm text-[#6C767F]">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Analyze your cashflow with simple, beautiful charts. No complex Excel sheets.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>See where your money goes every month (Swiggy, EMIs, Rent, Utilities).</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Know whether you spend less than you earn in one tap.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── STEP 3: FAMILY SPLITS & BUSINESS INVOICES ───────────────── */}
      <section id="workspaces" className="py-20 lg:py-24 bg-[#F9FAFB] border-t border-[#E8EEF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left: Step 3 Text */}
            <div className="lg:col-span-6 relative">
              <div className="spendee-step-num -mb-12">
                3
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12C48B] block mb-2">
                Step 3
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight mb-4">
                Split family bills & <br />invoice clients stress-free
              </h2>
              <ul className="space-y-3.5 text-sm text-[#6C767F]">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span><strong>Family Settlements:</strong> Automatically calculates who owes who to eliminate awkward money talks.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span><strong>Business Invoicing:</strong> Create professional GST-ready client invoices and track payments.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#12C48B]/15 text-[#12C48B] flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Switch seamlessly between Personal, Family, and Business with 1 click.</span>
                </li>
              </ul>
            </div>

            {/* Right: Dual Visual Cards (Settlement Demo + Business Invoice) */}
            <div className="lg:col-span-6 space-y-4 max-w-md mx-auto lg:mx-0">
              
              {/* Card 1: Family Trip Settlement */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEF2] shadow-sm">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#344554] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#12C48B]" />
                    Goa Trip Split (3 Members)
                  </span>
                  <span className="text-[11px] font-bold text-[#12C48B] bg-[#12C48B]/10 px-2 py-0.5 rounded-full">
                    Auto-Settled
                  </span>
                </div>

                <div className="space-y-2 text-xs mb-3">
                  <div className="flex justify-between text-[#344554]">
                    <span>Pooja paid Resort Stay</span>
                    <span className="font-extrabold">₹6,000</span>
                  </div>
                  <div className="flex justify-between text-[#344554]">
                    <span>Rahul paid Dinner & Drinks</span>
                    <span className="font-extrabold">₹3,000</span>
                  </div>
                  <div className="flex justify-between text-[#8C98A4]">
                    <span>Aman paid</span>
                    <span>₹0</span>
                  </div>
                </div>

                <div className="bg-[#12C48B]/10 border border-[#12C48B]/20 p-2.5 rounded-xl text-xs font-semibold text-[#0EAA77] flex items-center justify-between">
                  <span>⚡ Aman pays Pooja: <strong>₹3,000</strong></span>
                  <span className="text-[10px] bg-[#12C48B] text-white px-2 py-0.5 rounded-md font-bold">Done</span>
                </div>
              </div>

              {/* Card 2: Business Invoice */}
              <div className="bg-white p-5 rounded-2xl border border-[#E8EEF2] shadow-sm">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#344554] flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-[#40C3F9]" />
                    Tax Invoice #INV-2026-01
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Paid via UPI
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#344554] block">TechCorp Solutions Pvt Ltd</span>
                    <span className="text-[11px] text-[#8C98A4]">Full Stack App Development</span>
                  </div>
                  <span className="text-base font-black text-[#344554]">₹45,000</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── INTERACTIVE LOAN & EMI CALCULATOR ───────────────── */}
      <section id="emi-tool" className="py-20 lg:py-24 bg-white border-t border-[#E8EEF2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12C48B] block mb-1">
              Interactive Tool
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight">
              Home & Car Loan EMI Calculator
            </h2>
            <p className="text-sm sm:text-base text-[#6C767F] mt-2">
              Adjust the sliders below to calculate monthly payments and total interest for your loans.
            </p>
          </div>

          <div className="bg-[#F9FAFB] rounded-3xl p-6 sm:p-10 border border-[#E8EEF2] shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Sliders */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Loan Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#6C767F] uppercase">Loan Amount</span>
                    <span className="text-lg font-black text-[#12C48B]">
                      ₹{formatINR(loanAmount)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50000"
                    max="5000000"
                    step="50000"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="spendee-range"
                  />
                  <div className="flex justify-between text-[11px] text-[#8C98A4] mt-1">
                    <span>₹50K</span>
                    <span>₹25 Lakh</span>
                    <span>₹50 Lakh</span>
                  </div>
                </div>

                {/* Interest Rate Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#6C767F] uppercase">Interest Rate</span>
                    <span className="text-lg font-black text-[#12C48B]">
                      {loanRate}% p.a.
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6.0"
                    max="18.0"
                    step="0.25"
                    value={loanRate}
                    onChange={(e) => setLoanRate(Number(e.target.value))}
                    className="spendee-range"
                  />
                  <div className="flex justify-between text-[11px] text-[#8C98A4] mt-1">
                    <span>6% (Home Loan)</span>
                    <span>10% (Car)</span>
                    <span>18% (Personal)</span>
                  </div>
                </div>

                {/* Tenure Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-[#6C767F] uppercase">Loan Tenure</span>
                    <span className="text-lg font-black text-[#12C48B]">
                      {loanTenureYears} Years ({loanTenureYears * 12} Mos)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={loanTenureYears}
                    onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                    className="spendee-range"
                  />
                  <div className="flex justify-between text-[11px] text-[#8C98A4] mt-1">
                    <span>1 Year</span>
                    <span>10 Years</span>
                    <span>20 Years</span>
                  </div>
                </div>

              </div>

              {/* Output Display Card */}
              <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#E8EEF2] shadow-sm text-center">
                <span className="text-xs font-bold text-[#8C98A4] uppercase tracking-wider block mb-1">
                  Monthly EMI Payable
                </span>
                <span className="text-3xl sm:text-4xl font-black text-[#344554] tracking-tight block mb-4">
                  ₹{formatINR(emiData.emi)}
                  <span className="text-xs font-normal text-[#8C98A4]">/mo</span>
                </span>

                <div className="space-y-2.5 pt-4 border-t border-[#E8EEF2] text-xs">
                  <div className="flex justify-between text-[#6C767F]">
                    <span>Principal Amount:</span>
                    <span className="font-extrabold text-[#344554]">₹{formatINR(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#6C767F]">
                    <span>Total Interest:</span>
                    <span className="font-extrabold text-[#12C48B]">₹{formatINR(emiData.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-[#6C767F]">
                    <span>Total Payment:</span>
                    <span className="font-extrabold text-[#344554]">₹{formatINR(emiData.totalPayment)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/SignUp"
                    className="w-full py-2.5 rounded-full bg-[#12C48B] hover:bg-[#0EAA77] text-white font-bold text-xs flex items-center justify-center transition-colors"
                  >
                    Track All Loans in FinFlow &rarr;
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ───────────────── REVIEWS (SPENDEE STYLE) ───────────────── */}
      <section id="testimonials" className="py-20 lg:py-24 bg-[#F9FAFB] border-t border-[#E8EEF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12C48B] block mb-1">
              Community
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight">
              Why people love FinFlow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-[#E8EEF2] shadow-xs flex flex-col justify-between">
              <p className="text-sm text-[#6C767F] leading-relaxed mb-6">
                "The app works intuitively, it makes it super easy to control your money. It helped me realize how much I was spending on Swiggy and weekend cabs."
              </p>
              <div className="pt-3 border-t border-gray-100">
                <strong className="text-xs font-extrabold text-[#344554] block">Aakash Sharma</strong>
                <span className="text-[11px] text-[#8C98A4]">Bangalore, India</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8EEF2] shadow-xs flex flex-col justify-between">
              <p className="text-sm text-[#6C767F] leading-relaxed mb-6">
                "The fact that it supports shared family wallets made my life so much easier. My partner and I always know where we stand without awkward math."
              </p>
              <div className="pt-3 border-t border-gray-100">
                <strong className="text-xs font-extrabold text-[#344554] block">Neha & Rohan Patel</strong>
                <span className="text-[11px] text-[#8C98A4]">Mumbai, India</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8EEF2] shadow-xs flex flex-col justify-between">
              <p className="text-sm text-[#6C767F] leading-relaxed mb-6">
                "I've tried other money tracking apps before, but I stuck to FinFlow because of its simplicity, Indian Rupee support, and clean invoice generation."
              </p>
              <div className="pt-3 border-t border-gray-100">
                <strong className="text-xs font-extrabold text-[#344554] block">Vikram Mehta</strong>
                <span className="text-[11px] text-[#8C98A4]">Freelance Developer</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ───────────────── BOTTOM BANNER (SPENDEE STYLE) ───────────────── */}
      <section className="py-20 bg-white border-t border-[#E8EEF2] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#344554] tracking-tight mb-4">
            Get your money into shape today
          </h2>
          <p className="text-base text-[#6C767F] mb-8">
            Join thousands of users who take control of their personal, family, and business cash flow with FinFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/SignUp"
              className="h-12 px-8 rounded-full bg-[#12C48B] hover:bg-[#0EAA77] text-white font-bold text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/Login"
              className="h-12 px-8 rounded-full bg-white hover:bg-gray-50 text-[#344554] font-bold text-sm border border-[#D9DFE5] transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── FOOTER (SPENDEE STYLE) ───────────────── */}
      <footer className="bg-[#F9FAFB] border-t border-[#E8EEF2] py-12 text-xs text-[#8C98A4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src={finflowLogo} alt="FinFlow" className="h-6 w-auto" />
            <span className="font-extrabold text-base text-[#344554]">FinFlow</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-[#6C767F]">
            <a href="#how-it-works" className="hover:text-[#12C48B]">How It Works</a>
            <a href="#workspaces" className="hover:text-[#12C48B]">Workspaces</a>
            <a href="#emi-tool" className="hover:text-[#12C48B]">EMI Calculator</a>
            <Link to="/Login" className="hover:text-[#12C48B]">Login</Link>
          </div>

          <div>
            &copy; {new Date().getFullYear()} FinFlow. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
