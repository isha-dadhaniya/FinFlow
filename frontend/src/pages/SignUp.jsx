

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { signupUser, googleAuthUser } from '../api/auth';
import finflowLogo from '../assets/finflow-logo.png';

/* ==========================================================================
   UI COMPONENTS (components/ui/)
   ========================================================================== */

/**
 * Reusable Floating Label Input Component (Material UI Outlined Style)
 */
export const FloatingInput = ({
  id,
  name,
  label,
  icon: Icon,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  required = false,
  error = '',
  isValid = false,
  isPassword = false,
  maxLength,
  showPassword,
  togglePassword,
}) => {
  return (
    <div className="w-full space-y-1 text-left">
      <div className="relative flex items-center w-full">
        {/* Left Icon */}
        {Icon && (
          <Icon className="absolute left-4 w-[20px] h-[20px] text-[#6B7280] pointer-events-none z-10" />
        )}

        {/* Input Field */}
        <input
          id={id}
          name={name}
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          maxLength={maxLength}
          placeholder=" " // Required for peer-placeholder-shown trick
          className={`
            peer w-full h-[56px] bg-white rounded-[16px] text-[16px] text-[#1F2937] font-medium
            border transition-all duration-300 ease-in-out outline-none
            pl-[48px] ${isPassword || isValid ? 'pr-[48px]' : 'pr-4'}
            ${
              error
                ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
                : isValid
                ? 'border-[#22C55E] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/15'
                : 'border-[#D9DEE3] hover:border-[#B8C2CC] focus:border-[#005B4F] focus:ring-2 focus:ring-[#005B4F]/15'
            }
          `}
        />

        {/* Outlined Floating Label */}
        <label
          htmlFor={id}
          className={`
            absolute left-[48px] pointer-events-none font-medium text-[#9CA3AF] bg-white px-2
            transition-all duration-300 ease-in-out origin-[0_0] z-10
            
            /* Default Centered Position */
            top-1/2 -translate-y-1/2 text-[16px]
            
            /* Floating State (Directly ON the Top Border) */
            peer-focus:-top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.75] peer-focus:text-[#005B4F]
            peer-[:not(:placeholder-shown)]:-top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.75]
            
            ${error ? 'peer-focus:text-[#DC2626]' : ''}
          `}
        >
          {label} {required && <span className="text-[#DC2626]">*</span>}
        </label>

        {/* Password Toggle Button */}
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-4 text-[#6B7280] hover:text-[#1F2937] focus:outline-none transition-colors duration-200 z-10"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-[20px] h-[20px]" /> : <Eye className="w-[20px] h-[20px]" />}
          </button>
        )}

        {/* Valid Checkmark Icon */}
        {!isPassword && isValid && !error && (
          <Check className="absolute right-4 w-[20px] h-[20px] text-[#22C55E] pointer-events-none z-10" />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 text-[#DC2626] text-[12px] font-medium ml-1 animate-[fadeIn_0.2s_ease-in-out]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Reusable Primary Button Component
 */
export const Button = ({ children, isLoading, disabled, ...props }) => (
  <button
    {...props}
    disabled={isLoading || disabled}
    className="w-full h-[56px] rounded-[16px] bg-[#005B4F] hover:bg-[#004A40] hover:scale-[1.02] active:scale-[0.99] text-white font-semibold text-[16px] shadow-md shadow-[#005B4F]/15 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#005B4F] flex items-center justify-center gap-2 cursor-pointer"
  >
    {isLoading ? (
      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    ) : (
      children
    )}
  </button>
);

/**
 * Reusable Google Authentication Button Component
 */
export const GoogleButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full h-[56px] rounded-[16px] bg-white border border-[#D9DEE3] hover:border-[#B8C2CC] hover:shadow-md hover:scale-[1.005] active:scale-[0.99] text-[#1F2937] font-semibold text-[15px] transition-all duration-300 shadow-sm flex items-center justify-center gap-3 cursor-pointer"
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
    Continue with Google
  </button>
);

/**
 * Reusable Custom Checkbox Component
 */
export const Checkbox = ({ id, name, checked, onChange, label, required }) => (
  <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group select-none">
    <div className="relative flex items-center justify-center mt-0.5">
      <input
        id={id}
        name={name || id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={onChange}
        required={required}
        className="sr-only peer"
      />
      <div className="w-5 h-5 rounded-[6px] border-2 border-[#D9DEE3] bg-white peer-checked:bg-[#005B4F] peer-checked:border-[#005B4F] peer-focus:ring-2 peer-focus:ring-[#005B4F]/20 transition-all duration-200 group-hover:border-[#005B4F]" />
      <Check className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity duration-200 stroke-[3]" />
    </div>
    <span className="text-xs sm:text-sm text-[#6B7280] leading-snug">
      {label}
    </span>
  </label>
);


/* ==========================================================================
   MAIN SIGN UP PAGE COMPONENT
   ========================================================================== */

export default function SignUp() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  // Form Validation Rules
  const validate = () => {
    const errors = {};

    // 1. Full Name
    if (!formData.fullName.trim()) {
      errors.fullName = 'Enter a valid full name.';
    } else if (formData.fullName.trim().length < 3 || !/^[A-Za-z\s]+$/.test(formData.fullName)) {
      errors.fullName = 'Enter a valid full name.';
    }

    // 2. Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = 'Enter a valid email address.';
    }

    // 3. Mobile Number (Optional)
    if (formData.mobile.trim()) {
      if (!/^\d{10}$/.test(formData.mobile)) {
        errors.mobile = 'Mobile number must contain exactly 10 digits.';
      }
    }

    // 4. Password
    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter (A-Z).';
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'Password must contain at least one lowercase letter (a-z).';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain at least one number (0-9).';
    } else if (!/[@\-_!#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      errors.password = 'Password must contain at least one special character (@, -, _, etc.).';
    }

    // 5. Confirm Password
    if (!formData.confirmPassword || formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
  };

  const errors = validate();

  // Password Strength Estimator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'bg-gray-200', text: '' };
    const hasMinLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[@\-_!#$%^&*(),.?":{}|<>]/.test(pass);

    const conditionsMet = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (conditionsMet <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-[#DC2626]', text: 'text-[#DC2626]' };
    } else if (conditionsMet < 5) {
      return { score: 2, label: 'Medium', color: 'bg-[#D4AF37]', text: 'text-[#D4AF37]' };
    } else {
      return { score: 3, label: 'Strong', color: 'bg-[#22C55E]', text: 'text-[#22C55E]' };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'mobile') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 10) return;
      setFormData((prev) => ({ ...prev, mobile: numericValue }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleBlur = (e) => {
    if (e && e.target && e.target.name) {
      setTouched((prev) => ({ ...prev, [e.target.name]: true }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      mobile: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(errors).length === 0 && formData.agreeTerms) {
      setIsSubmitting(true);
      setServerError('');
      try {
        const response = await signupUser({
          fullName: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
        });
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/account-type');
      } catch (error) {
        setServerError(error.response?.data?.message || 'Something went wrong. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsSubmitting(true);
      setServerError('');
      const response = await googleAuthUser({
        email: formData.email.trim() || 'isha.google@gmail.com',
        fullName: formData.fullName.trim() || 'Isha Dadhaniya (Google)'
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/account-type');
    } catch (err) {
      setServerError('Google Sign-Up failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6F8] flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans antialiased selection:bg-[#005B4F]/10 selection:text-[#005B4F]">
      
      {/* Background Decorators - Subtle Blurred Circles */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#005B4F]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Authentication Card */}
      <div className="w-full max-w-[520px] bg-white rounded-[24px] shadow-[0_20px_50px_rgba(43,49,56,0.06)] border border-[#D9DEE3]/80 p-8 sm:p-[40px] relative z-10 animate-[fadeInUp_0.4s_ease-out]">
        
        {/* Top Section */}
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

          <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight mb-2">
            Create your account
          </h1>
          <p className="text-[#6B7280] text-sm sm:text-[15px] max-w-xs">
            Start managing your finances smarter with FinFlow.
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Full Name */}
          <FloatingInput
            id="fullName"
            name="fullName"
            label="Full Name"
            icon={User}
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            error={touched.fullName ? errors.fullName : ''}
            isValid={touched.fullName && !errors.fullName}
          />

          {/* 2. Email Address */}
          <FloatingInput
            id="email"
            name="email"
            type="email"
            label="Email Address"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            error={touched.email ? errors.email : ''}
            isValid={touched.email && !errors.email}
          />

          {/* 3. Mobile Number (Optional) */}
          <FloatingInput
            id="mobile"
            name="mobile"
            type="tel"
            label="Mobile Number (Optional)"
            icon={Phone}
            value={formData.mobile}
            onChange={handleChange}
            onBlur={handleBlur}
            maxLength={10}
            error={touched.mobile ? errors.mobile : ''}
            isValid={touched.mobile && Boolean(formData.mobile) && !errors.mobile}
          />

          {/* 4. Password */}
          <div className="space-y-2">
            <FloatingInput
              id="password"
              name="password"
              label="Password"
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              isPassword
              showPassword={showPassword}
              togglePassword={() => setShowPassword(!showPassword)}
              error={touched.password ? errors.password : ''}
              isValid={touched.password && !errors.password}
            />

            {/* Password Strength Progress Bar & Requirements Checklist */}
            {formData.password && (
              <div className="space-y-2 pt-1 transition-all duration-300">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6B7280] font-medium">Password Strength</span>
                  <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          step <= strength.score ? strength.color : 'bg-transparent'
                        } transition-all duration-500 ease-out`}
                      />
                    </div>
                  ))}
                </div>

                {/* Requirements Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                  {[
                    { label: '8+ characters', pass: formData.password.length >= 8 },
                    { label: 'Uppercase (A-Z)', pass: /[A-Z]/.test(formData.password) },
                    { label: 'Lowercase (a-z)', pass: /[a-z]/.test(formData.password) },
                    { label: 'Number (0-9)', pass: /[0-9]/.test(formData.password) },
                    { label: 'Special symbol (@, -, _)', pass: /[@\-_!#$%^&*(),.?":{}|<>]/.test(formData.password) },
                  ].map((req, idx) => (
                    <div key={idx} className={`flex items-center space-x-1 ${req.pass ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                      <Check className={`w-3 h-3 ${req.pass ? 'text-green-600 opacity-100' : 'opacity-30'}`} />
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Confirm Password */}
          <FloatingInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            icon={Lock}
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            isPassword
            showPassword={showConfirmPassword}
            togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
            error={touched.confirmPassword ? errors.confirmPassword : ''}
            isValid={touched.confirmPassword && !errors.confirmPassword}
          />

          {/* Terms & Conditions Checkbox */}
          <div className="pt-2 pb-1">
            <Checkbox
              id="agreeTerms"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              label={
                <span className="text-xs text-[#6B7280] leading-snug">
                  I agree to FinFlow's{' '}
                  <a href="#terms" className="text-[#005B4F] font-semibold hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#privacy" className="text-[#005B4F] font-semibold hover:underline">
                    Privacy Policy
                  </a>
                  .
                </span>
              }
            />
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="flex items-center gap-2 text-[#DC2626] text-sm font-medium bg-[#DC2626]/10 rounded-[12px] px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <Button type="submit" isLoading={isSubmitting} disabled={!formData.agreeTerms}>
            Create Account
          </Button>
        </form>

        {/* Bottom Section */}
        <div className="mt-8 text-center text-sm text-[#6B7280]">
          Already have an account?{' '}
          <Link to="/Login" className="text-[#005B4F] font-semibold hover:underline transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}