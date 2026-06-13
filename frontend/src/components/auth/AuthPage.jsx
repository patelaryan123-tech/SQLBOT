import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPassword from './ForgotPassword';
import { HiCircleStack, HiSparkles } from 'react-icons/hi2';

const AuthPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login', 'signup', 'forgot'

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center bg-[#030014] overflow-hidden px-4">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f29370a_1px,transparent_1px),linear-gradient(to_bottom,#1f29370a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Auth Container */}
      <div className="w-full max-w-[460px] relative z-10 animate-fade-in">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-[0_0_30px_rgba(124,58,237,0.3)] mb-4">
            <HiCircleStack className="text-white" size={28} />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            Nexus<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">SQL</span>
            <HiSparkles className="text-purple-400" size={16} />
          </h2>
          <p className="text-[14px] text-slate-400 mt-2">Enterprise-grade AI-powered SQL Assistant</p>
        </div>

        {/* Premium Glassmorphic Card */}
        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Card subtle inner glow border */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

          {activeTab !== 'forgot' && (
            /* Tabs Navigation */
            <div className="flex bg-[#070715] p-1.5 rounded-2xl border border-white/[0.05] mb-8">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Render Active Form */}
          {activeTab === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setActiveTab('signup')}
              onSwitchToForgot={() => setActiveTab('forgot')}
            />
          )}

          {activeTab === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setActiveTab('login')}
            />
          )}

          {activeTab === 'forgot' && (
            <ForgotPassword
              onSwitchToLogin={() => setActiveTab('login')}
            />
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-[12px] text-slate-500">
            Secure, encrypted connections. Built with Firebase Authentication.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
