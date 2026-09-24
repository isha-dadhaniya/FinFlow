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
    description: 'Manage your personal expenses, income, savings goals, budgets, bills, and loans.',
    icon: User,
    emoji: '🧑',
    gradient: 'from-[#005B4F] to-[#008573]',
    shadowColor: 'shadow-[#005B4F]/20',
    ringColor: 'ring-[#005B4F]',
    borderColor: 'border-[#005B4F]',
  },
  {
    id: 'family',
    title: 'Family',
    description: 'Manage shared family finances, split expenses, family budgets, and settlements.',
    icon: Users,
    emoji: '👨‍👩‍👧',
    gradient: 'from-[#2A9D8F] to-[#21867A]',
    shadowColor: 'shadow-[#2A9D8F]/20',
    ringColor: 'ring-[#2A9D8F]',
    borderColor: 'border-[#2A9D8F]',
  },
  {
    id: 'business',
    title: 'Business',
    description: 'Manage company finances, employees, expenses, approvals, vendors, and invoices.',
    icon: Briefcase,
    emoji: '🏢',
    gradient: 'from-[#005B4F] to-[#007D6D]',
    shadowColor: 'shadow-[#005B4F]/20',
    ringColor: 'ring-[#005B4F]',
    borderColor: 'border-[#005B4F]',
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
      <div className="w-full max-w-[500px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(43,49,56,0.08)] border border-[#D9DEE3]/70 p-6 sm:p-7 relative z-10 animate-[fadeInUp_0.5s_ease-out]">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* FinFlow Logo */}
          <div className="flex items-center justify-center mb-4">
            <img
              src={finflowLogo}
              alt="FinFlow"
              className="h-14 sm:h-16 w-auto max-w-[260px] object-contain select-none scale-105 filter drop-shadow-sm"
              draggable="false"
            />
          </div>

          <h1 className="text-xl sm:text-[22px] font-bold text-[#1F2937] tracking-tight mb-2">
            How do you want to manage your finances?
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-[13px] max-w-sm leading-relaxed">
            Select one or more financial workspaces. You can always change this later in settings.
          </p>
        </div>

        {/* Account Type Cards — Multi-Select */}
        <div className="grid gap-3 mb-5">
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
                  group relative w-full text-left rounded-[16px] p-3.5 sm:p-4 transition-all duration-300 ease-out cursor-pointer
                  border-2 outline-none
                  ${isSelected
                    ? `${type.borderColor} bg-gradient-to-r from-white to-[#F0FAF8] ring-4 ${type.ringColor}/10 shadow-md ${type.shadowColor}`
                    : 'border-[#E5E7EB] bg-white hover:border-[#005B4F]/30 hover:shadow-sm'
                  }
                  ${isHovered && !isSelected ? 'scale-[1.005]' : ''}
                  ${isSelected ? 'scale-[1.01]' : ''}
                `}
              >
                <div className="flex items-start gap-3 sm:gap-3.5">
                  {/* Icon */}
                  <div className={`
                    w-10 h-10 sm:w-11 sm:h-11 rounded-[12px] flex items-center justify-center shrink-0
                    transition-all duration-300
                    ${isSelected
                      ? `bg-gradient-to-br ${type.gradient} shadow-md ${type.shadowColor}`
                      : `bg-[#F4F6F8] group-hover:bg-gradient-to-br group-hover:${type.gradient}`
                    }
                  `}>
                    <IconComponent
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-[#005B4F] group-hover:text-white'
                        }`}
                      strokeWidth={1.8}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm sm:text-base font-bold tracking-tight transition-colors duration-200 ${isSelected ? 'text-[#005B4F]' : 'text-[#1F2937]'
                        }`}>
                        {type.title}
                      </h3>

                      {/* Checkbox Indicator */}
                      <div className={`
                        w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300
                        ${isSelected
                          ? 'border-[#005B4F] bg-[#005B4F] scale-105'
                          : 'border-[#D9DEE3] bg-white group-hover:border-[#005B4F]/40'
                        }
                      `}>
                        {isSelected && (
                          <Check className="w-3 h-3 text-white animate-[scaleIn_0.2s_ease-out]" />
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-[13px] text-[#6B7280] leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selection Summary */}
        {selectionSummary && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-[fadeInUp_0.3s_ease-out]">
            <Sparkles className="w-4 h-4 text-[#005B4F]" />
            <span className="text-xs sm:text-sm font-semibold text-[#005B4F]">
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
            w-full h-[48px] sm:h-[50px] rounded-[14px] text-white font-semibold text-[15px]
            transition-all duration-300 flex items-center justify-center gap-2
            ${selected.length > 0
              ? 'bg-[#005B4F] hover:bg-[#004A40] hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-[#005B4F]/20 cursor-pointer'
              : 'bg-[#005B4F]/40 cursor-not-allowed'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Get Started
              <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${selected.length > 0 ? 'group-hover:translate-x-1' : ''}`} />
            </>
          )}
        </button>

        {/* Skip Link */}
        <p className="mt-4 text-center text-[12px] sm:text-[13px] text-[#9CA3AF]">
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
