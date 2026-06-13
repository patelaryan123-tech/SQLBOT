import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HiExclamationTriangle, HiEnvelope, HiCheck, HiArrowLeft } from 'react-icons/hi2';

const ForgotPassword = ({ onSwitchToLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const firebaseErrorMap = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/network-request-failed': 'Network error. Check your internet connection.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(firebaseErrorMap[err.code] || err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-5 animate-fade-in py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <HiCheck size={28} className="text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Check Your Inbox</h3>
          <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs mx-auto">
            We've sent a password reset link to <strong className="text-purple-400">{email}</strong>. Please follow the instructions in the email to reset your password.
          </p>
        </div>
        <button
          onClick={onSwitchToLogin}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-[14px] font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="inline-flex items-center gap-1 text-[12px] text-slate-400 hover:text-slate-300 font-medium transition-colors cursor-pointer"
        >
          <HiArrowLeft size={14} /> Back to Sign In
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-rose-950/60 border border-rose-500/30 rounded-xl animate-fade-in">
          <HiExclamationTriangle className="text-rose-400 flex-shrink-0" size={16} />
          <span className="text-[13px] text-rose-200 font-medium">{error}</span>
        </div>
      )}

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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Sending reset link...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  );
};

export default ForgotPassword;
