import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HiEye, HiEyeSlash, HiExclamationTriangle, HiEnvelope, HiUser, HiCheck, HiArrowPath, HiInformationCircle } from 'react-icons/hi2';

// ---- Isolated Success / Email Confirmation Screen ----
function SuccessScreen({ email, onSwitchToLogin }) {
  const { resendVerificationEmail } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0); // seconds remaining

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    try {
      setResending(true);
      setResendError('');
      setResendSuccess(false);
      await resendVerificationEmail();
      setResendSuccess(true);
      setCooldown(60); // 60 second cooldown before allowing resend again
    } catch (err) {
      console.error('Resend error:', err);
      if (err.code === 'auth/too-many-requests') {
        setResendError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setResendError(err.message || 'Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in py-2">
      {/* Icon */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <HiEnvelope size={28} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Account Created! ✅</h3>
          <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            A verification email was sent to{' '}
            <strong className="text-purple-400">{email}</strong>.
          </p>
        </div>
      </div>

      {/* Tips Card */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2.5">
        <p className="text-[12px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
          <HiInformationCircle size={14} /> If you didn't receive the email:
        </p>
        <div className="space-y-1.5 text-[12px] text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">①</span>
            <span>Check your <strong className="text-white">Spam / Junk</strong> folder — Firebase emails often end up there</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">②</span>
            <span>Look for an email from <strong className="text-white font-mono text-[11px]">noreply@querymind-ai.firebaseapp.com</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5 flex-shrink-0">③</span>
            <span>Wait up to <strong className="text-white">2–3 minutes</strong>, then use the resend button below</span>
          </div>
        </div>
      </div>

      {/* Resend feedback */}
      {resendSuccess && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl">
          <HiCheck className="text-emerald-400 flex-shrink-0" size={16} />
          <span className="text-[13px] text-emerald-200 font-medium">Verification email resent successfully!</span>
        </div>
      )}
      {resendError && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-950/60 border border-rose-500/30 rounded-xl">
          <HiExclamationTriangle className="text-rose-400 flex-shrink-0" size={16} />
          <span className="text-[13px] text-rose-200 font-medium">{resendError}</span>
        </div>
      )}

      {/* Resend Button */}
      <button
        onClick={handleResend}
        disabled={resending || cooldown > 0}
        className="w-full py-3 border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 disabled:opacity-40 disabled:cursor-not-allowed text-purple-300 text-[13px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        {resending ? (
          <>
            <HiArrowPath className="animate-spin" size={16} />
            Resending email...
          </>
        ) : cooldown > 0 ? (
          `Resend available in ${cooldown}s`
        ) : (
          <>
            <HiEnvelope size={16} />
            Resend Verification Email
          </>
        )}
      </button>

      {/* Go to Sign In */}
      <button
        onClick={onSwitchToLogin}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-[14px] font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
      >
        Continue to Sign In
      </button>

      <p className="text-center text-[11px] text-slate-500 leading-relaxed">
        You can sign in now. Email verification is optional but recommended for account security.
      </p>
    </div>
  );
}

const SignupForm = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const firebaseErrorMap = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters long.',
    'auth/operation-not-allowed': 'Email/password sign up is not enabled.',
    'auth/network-request-failed': 'Network error. Check your internet connection.'
  };

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-emerald-500' };
    return { level: 5, label: 'Very Strong', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await signup(email, password, name);
      setSuccess(true);
    } catch (err) {
      console.error("Signup error:", err);
      setError(firebaseErrorMap[err.code] || err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <SuccessScreen email={email} onSwitchToLogin={onSwitchToLogin} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-950/60 border border-rose-500/30 rounded-xl animate-fade-in">
          <HiExclamationTriangle className="text-rose-400 flex-shrink-0" size={16} />
          <span className="text-[13px] text-rose-200 font-medium">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
        <div className="relative">
          <HiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl pl-11 pr-4 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
        <div className="relative">
          <HiEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl pl-11 pr-4 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 pr-11 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {showPassword ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
          </button>
        </div>
        {password && (
          <div className="mt-2 space-y-1.5 animate-fade-in">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength.level ? strength.color : 'bg-white/[0.08]'}`} />
              ))}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${strength.level <= 1 ? 'text-rose-400' : strength.level <= 2 ? 'text-amber-400' : strength.level <= 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
              {strength.label}
            </span>
          </div>
        )}
      </div>

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            className={`w-full bg-[#0a0a1a] border rounded-xl px-4 pr-11 py-3 text-[14px] text-white outline-none transition-colors placeholder:text-slate-600 ${confirmPassword && confirmPassword !== password ? 'border-rose-500/50 focus:border-rose-500/50' : 'border-white/[0.1] focus:border-purple-500/50'}`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {showConfirm ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
          </button>
        </div>
        {confirmPassword && confirmPassword !== password && (
          <p className="text-[11px] text-rose-400 mt-1 font-medium animate-fade-in">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all cursor-pointer mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-[13px] text-slate-400">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};

export default SignupForm;
