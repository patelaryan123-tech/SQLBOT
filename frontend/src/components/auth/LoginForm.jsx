import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { HiEye, HiEyeSlash, HiExclamationTriangle, HiEnvelope } from 'react-icons/hi2';

const LoginForm = ({ onSwitchToSignup, onSwitchToForgot }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const firebaseErrorMap = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/network-request-failed': 'Network error. Check your internet connection.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      setError(firebaseErrorMap[err.code] || err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div>
        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 pr-11 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-600"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {showPassword ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-white/[0.1] bg-[#0a0a1a] text-purple-600 focus:ring-purple-500/40 cursor-pointer"
          />
          <span className="text-[12px] text-slate-400 font-medium">Remember me</span>
        </label>
        <button
          type="button"
          onClick={onSwitchToForgot}
          className="text-[12px] text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-bold rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      <p className="text-center text-[13px] text-slate-400">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
        >
          Create one
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
