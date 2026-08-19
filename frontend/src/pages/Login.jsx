
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { loginUser, googleAuthUser } from '../api/auth';
import finflowLogo from '../assets/finflow-logo.png';

// ==========================================
// REUSABLE UI COMPONENTS (components/ui/)
// ==========================================

/**
 * Checkbox Component
 */
const Checkbox = ({ id, label, checked, onChange }) => {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer group select-none">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div className="w-5 h-5 border-2 border-[#D9DEE3] rounded-md bg-white peer-checked:bg-[#005B4F] peer-checked:border-[#005B4F] peer-focus:ring-2 peer-focus:ring-[#005B4F]/20 transition-all duration-200 group-hover:border-[#005B4F]/60 flex items-center justify-center">
          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200 stroke-[3]" />
        </div>
      </div>
      <span className="text-sm font-medium text-[#2B3138] group-hover:text-[#1F2937] transition-colors duration-200">
        {label}
      </span>
    </label>
  );
};

/**
 * Button Component
 */
const Button = ({ children, type = 'button', onClick, className = '', disabled = false }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[56px] rounded-[16px] bg-[#005B4F] hover:bg-[#004A40] hover:scale-[1.02] active:scale-[0.99] text-white font-semibold text-[16px] shadow-md shadow-[#005B4F]/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#005B4F] flex items-center justify-center gap-2 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
};

/**
 * Google Button Component
 */
const GoogleButton = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-[56px] bg-white border border-[#D9DEE3] text-[#1F2937] font-medium text-base rounded-[16px] hover:border-[#9CA3AF] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-in-out flex items-center justify-center gap-3 cursor-pointer"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  );
};

/**
 * Floating Label Input Component
 */
const FloatingInput = ({
  id,
  type = 'text',
  label,
  value,
  onChange,
  onBlur,
  error,
  icon: Icon,
  endAdornment,
}) => {
  return (
    <div className="w-full">
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-[#6B7280]">
            <Icon size={20} />
          </div>
        )}

        {/* Input Field */}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          className={`peer w-full h-[56px] pl-[48px] pr-[48px] bg-white border ${
            error ? 'border-[#DC2626]' : 'border-[#D9DEE3]'
          } rounded-[16px] text-base text-[#1F2937] font-normal outline-none transition-all duration-300 ease-in-out hover:border-[#9CA3AF] focus:border-[#005B4F] focus:ring-4 ${
            error ? 'focus:ring-[#DC2626]/15' : 'focus:ring-[#005B4F]/15'
          }`}
        />

        {/* Outlined Floating Label */}
        <label
          htmlFor={id}
          className={`absolute left-[44px] pointer-events-none bg-white px-2 transition-all duration-300 ease-in-out origin-[0_0] select-none
            ${
              error
                ? 'text-[#DC2626] peer-focus:text-[#DC2626]'
                : 'text-[#9CA3AF] peer-focus:text-[#005B4F]'
            }
            /* Default / Empty state: Centered inside input */
            top-1/2 -translate-y-1/2 scale-100 text-base font-medium
            /* Floating State: Triggered on focus OR when placeholder is NOT shown (has text) */
            peer-focus:-translate-y-[35px] peer-focus:scale-[0.75] peer-focus:font-semibold
            peer-[&:not(:placeholder-shown)]:-translate-y-[35px] peer-[&:not(:placeholder-shown)]:scale-[0.75] peer-[&:not(:placeholder-shown)]:font-semibold
          `}
        >
          {label}
        </label>

        {/* Right Icon / Custom Adornment */}
        {endAdornment && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            {endAdornment}
          </div>
        )}
      </div>

      {/* Validation Error Message */}
      {error && (
        <p className="mt-1.5 ml-2 text-sm text-[#DC2626] font-medium animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Password Input Component (Extends FloatingInput)
 */
const PasswordInput = ({ id, label, value, onChange, onBlur, error }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FloatingInput
      id={id}
      type={showPassword ? 'text' : 'password'}
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      error={error}
      icon={Lock}
      endAdornment={
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-[#6B7280] hover:text-[#1F2937] focus:outline-none transition-colors duration-200 cursor-pointer p-1"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      }
    />
  );
};

// ==========================================
// MAIN PAGE COMPONENT (FinFlow Login)
// ==========================================

export default function FinFlowLogin() {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Validation State
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();

  // Real-time Validation Rules
  const validateEmail = (val) => {
    if (!val.trim()) return 'Enter a valid email address.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Enter a valid email address.';
    return '';
  };

  const validatePassword = (val) => {
    if (!val) {
      return 'Password is required.';
    }
    if (val.length < 8) {
      return 'Password must be at least 8 characters.';
    }
    return '';
  };

  // Handlers
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setEmailError(validateEmail(val));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setPasswordError(validatePassword(val));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') setEmailError(validateEmail(email));
    if (field === 'password') setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setEmailError(eErr);
    setPasswordError(pErr);

    if (!eErr && !pErr) {
      setIsSubmitting(true);
      setServerError('');
      try {
        const response = await loginUser({ email, password });
        // Save token and user info to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Redirect based on whether accountType is set
        if (!response.data.user.accountType) {
          navigate('/account-type');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        setServerError(error.response?.data?.message || 'Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setServerError('');
      const response = await googleAuthUser({
        email: email.trim() || 'isha.google@gmail.com',
        fullName: 'Isha Dadhaniya (Google)'
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (!response.data.user.accountType) {
        navigate('/account-type');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setServerError('Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is fully valid (all fields filled and no errors)
  const isFormValid = email.trim() && password.trim() && !validateEmail(email) && !validatePassword(password);

  return (
    <div className="relative min-h-screen w-full bg-[#F4F6F8] flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-hidden antialiased">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] rounded-full bg-[#005B4F]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/10 blur-[140px] pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="relative w-full max-w-[520px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-[#D9DEE3]/60 p-8 sm:p-[40px] transition-all duration-300 animate-[fadeInUp_0.5s_ease-out]">
        
        {/* Top Section */}
        <div className="flex flex-col items-center text-center mb-8">
          {/* FinFlow Logo */}
          <div className="flex items-center justify-center mb-5">
            <img
              src={finflowLogo}
              alt="FinFlow"
              className="h-20 sm:h-28 md:h-[110px] w-auto max-w-[400px] object-contain select-none scale-105"
              draggable="false"
            />
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight mb-2">
            Welcome back
          </h1>

          {/* Subtitle */}
          <p className="text-[#6B7280] text-sm sm:text-base leading-relaxed max-w-[360px]">
            Login to continue managing your finances smarter with FinFlow.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* 1. Email Address */}
          <FloatingInput
            id="email"
            type="email"
            label="Email Address"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            error={emailError}
            icon={Mail}
          />

          {/* 2. Password */}
          <PasswordInput
            id="password"
            label="Password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            error={passwordError}
          />

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between pt-1">
            <Checkbox
              id="rememberMe"
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

            <a
              href="#forgot-password"
              className="text-sm font-semibold text-[#005B4F] hover:underline transition-all duration-200"
            >
              Forgot Password?
            </a>
          </div>

          {/* Server Error Message */}
          {serverError && (
            <div className="flex items-center gap-2 text-[#DC2626] text-sm font-medium bg-[#DC2626]/10 rounded-[12px] px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Sign In Button */}
          <Button type="submit" className="mt-2" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Bottom Section */}
        <div className="mt-8 text-center text-sm text-[#6B7280]">
          Don't have an account?{' '}
          <Link
            to="/SignUp"
            className="font-semibold text-[#005B4F] hover:underline transition-all duration-200 ml-1"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}