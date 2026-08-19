import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, Briefcase, ArrowRight, Check, Sparkles } from 'lucide-react';
import finflowLogo from '../assets/finflow-logo.png';

/* ==========================================================================
   ACCOUNT TYPE SELECTION PAGE (Onboarding)
   Multi-select: User can pick one or more financial workspace modes.
   ========================================================================== */

const accountTypes = [
  {
    id: 'personal',
    title: 'Personal',
    subtitle: 'My Money',
    description: 'Manage your personal expenses, income, savings goals, budgets, bills, and loans.',
    icon: User,
    emoji: '🧑',
    gradient: 'from-[#005B4F] to-[#008573]',
    shadowColor: 'shadow-[#005B4F]/20',
    ringColor: 'ring-[#005B4F]',
    borderColor: 'border-[#005B4F]',
    features: ['Expense Tracking', 'Savings Goals', 'Budget Planner', 'Bills & Loans'],
  },
  {
    id: 'family',
    title: 'Family',
    subtitle: 'Our Money',
    description: 'Manage shared family finances, split expenses, family budgets, and settlements.',
    icon: Users,
    emoji: '👨‍👩‍👧',
    gradient: 'from-[#2A9D8F] to-[#21867A]',
    shadowColor: 'shadow-[#2A9D8F]/20',
    ringColor: 'ring-[#2A9D8F]',
    borderColor: 'border-[#2A9D8F]',
    features: ['Shared Expenses', 'Family Budget', 'Settlements', 'Family Goals'],
  },
  {
    id: 'business',
    title: 'Business',
    subtitle: 'Company Money',
    description: 'Manage company finances, employees, expenses, approvals, vendors, and invoices.',
    icon: Briefcase,
    emoji: '🏢',
    gradient: 'from-[#1E232A] to-[#2B3138]',
    shadowColor: 'shadow-[#1E232A]/20',
    ringColor: 'ring-[#1E232A]',
    borderColor: 'border-[#1E232A]',
    features: ['Employee Expenses', 'Approvals', 'Invoices', 'Projects & Vendors'],
  },
];

export default function AccountTypeSelection() {
  const [selected, setSelected] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const toggleSelection = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/auth/selected-modes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedModes: selected,
          defaultMode: selected[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save selected modes');
      }

      const data = await response.json();

      // Update user in localStorage with selectedModes
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.selectedModes = data.user.selectedModes;
      user.defaultMode = data.user.defaultMode;
      user.accountType = data.user.accountType;
      localStorage.setItem('user', JSON.stringify(user));

      // Set the active workspace mode
      localStorage.setItem('finflow_active_mode', data.user.defaultMode);

      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error saving selected modes:', error);
      // Still navigate on error for now
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.selectedModes = selected;
      user.defaultMode = selected[0];
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('finflow_active_mode', selected[0]);
      navigate('/app/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectionSummary = selected.length > 0
    ? selected.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' + ')
    : null;

  return (
    <div className="min-h-screen w-full bg-[#F4F6F8] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans antialiased selection:bg-[#005B4F]/10 selection:text-[#005B4F]">

      {/* Background Decorators */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#005B4F]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#D4AF37]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#005B4F]/3 rounded-full blur-[200px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-[720px] bg-white rounded-[28px] shadow-[0_25px_60px_rgba(43,49,56,0.07)] border border-[#D9DEE3]/70 p-8 sm:p-10 relative z-10 animate-[fadeInUp_0.5s_ease-out]">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* FinFlow Logo */}
          <div className="flex items-center justify-center mb-5">
            <img
              src={finflowLogo}
              alt="FinFlow"
              className="h-20 sm:h-28 md:h-[110px] w-auto max-w-[400px] object-contain select-none scale-110 filter drop-shadow-sm"
              draggable="false"
            />
          </div>

          <h1 className="text-2xl sm:text-[28px] font-bold text-[#1F2937] tracking-tight mb-2.5">
            How do you want to manage your finances?
          </h1>
          <p className="text-[#6B7280] text-sm sm:text-[15px] max-w-md leading-relaxed">
            Select one or more financial workspaces. You can always change this later in settings.
          </p>
        </div>

        {/* Account Type Cards — Multi-Select */}
        <div className="grid gap-4 mb-6">
          {accountTypes.map((type) => {
            const isSelected = selected.includes(type.id);
            const isHovered = hovered === type.id;
            const IconComponent = type.icon;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleSelection(type.id)}
                onMouseEnter={() => setHovered(type.id)}
                onMouseLeave={() => setHovered(null)}
                className={`
                  group relative w-full text-left rounded-[20px] p-5 sm:p-6 transition-all duration-300 ease-out cursor-pointer
                  border-2 outline-none
                  ${isSelected
                    ? `${type.borderColor} bg-gradient-to-r from-white to-[#F0FAF8] ring-4 ${type.ringColor}/10 shadow-lg ${type.shadowColor}`
                    : 'border-[#E5E7EB] bg-white hover:border-[#005B4F]/30 hover:shadow-md hover:shadow-[#005B4F]/5'
                  }
                  ${isHovered && !isSelected ? 'scale-[1.005]' : ''}
                  ${isSelected ? 'scale-[1.01]' : ''}
                `}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] flex items-center justify-center shrink-0
                    transition-all duration-300
                    ${isSelected
                      ? `bg-gradient-to-br ${type.gradient} shadow-lg ${type.shadowColor}`
                      : `bg-[#F4F6F8] group-hover:bg-gradient-to-br group-hover:${type.gradient}`
                    }
                  `}>
                    <IconComponent
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-[#005B4F] group-hover:text-white'
                        }`}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className={`text-lg font-bold tracking-tight transition-colors duration-200 ${isSelected ? 'text-[#005B4F]' : 'text-[#1F2937]'
                          }`}>
                          {type.title}
                        </h3>
                        <span className="text-[11px] font-medium text-[#9CA3AF] bg-[#F4F6F8] px-2 py-0.5 rounded-full">
                          {type.subtitle}
                        </span>
                      </div>

                      {/* Checkbox Indicator */}
                      <div className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-300
                        ${isSelected
                          ? 'border-[#005B4F] bg-[#005B4F] scale-110'
                          : 'border-[#D9DEE3] bg-white group-hover:border-[#005B4F]/40'
                        }
                      `}>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-white animate-[scaleIn_0.2s_ease-out]" />
                        )}
                      </div>
                    </div>

                    <p className="text-[13px] sm:text-sm text-[#6B7280] leading-relaxed mb-3">
                      {type.description}
                    </p>

                    {/* Feature Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {type.features.map((feature) => (
                        <span
                          key={feature}
                          className={`text-[10px] sm:text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors duration-200 ${
                            isSelected
                              ? 'bg-[#005B4F]/10 text-[#005B4F]'
                              : 'bg-[#F4F6F8] text-[#6B7280]'
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectionSummary && (
          <div className="flex items-center justify-center gap-2 mb-5 animate-[fadeInUp_0.3s_ease-out]">
            <Sparkles className="w-4 h-4 text-[#005B4F]" />
            <span className="text-sm font-semibold text-[#005B4F]">
              {selectionSummary}
            </span>
            <span className="text-xs text-[#9CA3AF]">
              ({selected.length} workspace{selected.length > 1 ? 's' : ''})
            </span>
          </div>
        )}

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={selected.length === 0 || isSubmitting}
          className={`
            w-full h-[56px] rounded-[16px] text-white font-semibold text-[16px]
            transition-all duration-300 flex items-center justify-center gap-2.5
            ${selected.length > 0
              ? 'bg-[#005B4F] hover:bg-[#004A40] hover:scale-[1.02] active:scale-[0.99] shadow-lg shadow-[#005B4F]/20 cursor-pointer'
              : 'bg-[#005B4F]/40 cursor-not-allowed'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Get Started
              <ArrowRight className={`w-5 h-5 transition-transform duration-300 ${selected.length > 0 ? 'group-hover:translate-x-1' : ''}`} />
            </>
          )}
        </button>

        {/* Skip Link */}
        <p className="mt-5 text-center text-[13px] text-[#9CA3AF]">
          Not sure yet?{' '}
          <button
            type="button"
            onClick={() => {
              // Default to personal if skipping
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              user.selectedModes = ['personal'];
              user.defaultMode = 'personal';
              localStorage.setItem('user', JSON.stringify(user));
              localStorage.setItem('finflow_active_mode', 'personal');
              navigate('/app/dashboard');
            }}
            className="text-[#005B4F] font-semibold hover:underline transition-colors duration-200 cursor-pointer"
          >
            Skip for now
          </button>
          <span className="text-[11px] text-[#B0B5BB] ml-1">(defaults to Personal)</span>
        </p>
      </div>

      {/* Custom Keyframe Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
