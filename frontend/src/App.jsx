import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SQLChat from './components/SQLChat';
import SchemaExplorer from './components/SchemaExplorer';
import SQLConsole from './components/SQLConsole';
import SettingsDashboard from './components/SettingsDashboard';
import AuthPage from './components/auth/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getHealthStatus, getChatHistory } from './services/api';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dbActive, setDbActive] = useState(false);
  const [llmActive, setLlmActive] = useState(false);

  // Lifted Profile State with localStorage persistence
  const [profile, setProfile] = useState(() => {
    const name = localStorage.getItem('profileName') || 'Alex Mercer';
    const email = localStorage.getItem('profileEmail') || 'alex.mercer@nexus.io';
    const role = localStorage.getItem('profileRole') || 'Data Engineer';
    const bio = localStorage.getItem('profileBio') || 'Data enthusiast, database administrator and AI explorer. Designing smart solutions.';
    const avatar = localStorage.getItem('profileAvatar') || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`;
    return { name, email, role, bio, avatar };
  });

  // Sync profile details if Firebase user updates
  useEffect(() => {
    if (currentUser) {
      const name = currentUser.displayName || profile.name;
      const email = currentUser.email || profile.email;
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff`;
      
      setProfile(prev => ({
        ...prev,
        name,
        email,
        avatar
      }));
    }
  }, [currentUser]);

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem('profileName', newProfile.name);
    localStorage.setItem('profileEmail', newProfile.email);
    localStorage.setItem('profileRole', newProfile.role);
    localStorage.setItem('profileBio', newProfile.bio);
    localStorage.setItem('profileAvatar', newProfile.avatar);
  };

  // Lifted Theme and Accent Color State with localStorage persistence
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('theme') || 'Cyber Void');
  const [activeColor, setActiveColor] = useState(() => localStorage.getItem('accentColor') || 'purple');

  const changeTheme = (themeName) => {
    setActiveTheme(themeName);
    localStorage.setItem('theme', themeName);
  };

  const changeColor = (colorName) => {
    setActiveColor(colorName);
    localStorage.setItem('accentColor', colorName);
  };

  const themeStyles = {
    'Cyber Void': {
      bg: 'bg-[#030308] bg-gradient-to-br from-[#0c0420] via-[#04010a] to-black',
      gradient1: 'bg-purple-900/10',
      gradient2: 'bg-indigo-900/10'
    },
    'Neon City': {
      bg: 'bg-[#020205] bg-gradient-to-br from-[#1a022b] via-[#040822] to-[#01010a]',
      gradient1: 'bg-fuchsia-900/15',
      gradient2: 'bg-blue-900/15'
    },
    'Quantum Realm': {
      bg: 'bg-[#000102] bg-gradient-to-br from-[#011414] via-[#010608] to-black',
      gradient1: 'bg-cyan-900/15',
      gradient2: 'bg-emerald-900/15'
    },
    'Deep Space': {
      bg: 'bg-black bg-gradient-to-br from-[#03030c] via-[#010104] to-black',
      gradient1: 'bg-blue-950/15',
      gradient2: 'bg-slate-900/15'
    }
  };

  const currentTheme = themeStyles[activeTheme] || themeStyles['Cyber Void'];

  // Lifted Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data } = await getHealthStatus();
        setDbActive(data.services?.database?.connected || false);
        setLlmActive(true);
      } catch (err) {
        setDbActive(false);
        setLlmActive(false);
      }
    };

    const loadHistory = async () => {
      try {
        const { data } = await getChatHistory();
        if (data.history) {
          const mapped = [];
          data.history.forEach(h => {
            if (h.userMessage) {
              mapped.push({ role: 'user', content: h.userMessage });
            }
            if (h.response) {
              mapped.push({
                role: 'assistant',
                response: h.response.message || h.response.explanation || h.response.response || '',
                sqlQuery: h.response.sql || h.response.sqlQuery || '',
                queryResult: h.response.queryResult || null
              });
            }
          });
          setChatMessages(mapped);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };

    checkStatus();
    loadHistory();
    const interval = setInterval(checkStatus, 10000); // check status every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // While Firebase is resolving auth state, let ProtectedRoute/AdminRoute show the spinner.
  // We only need to hide the sidebar shell during that time or on /auth.
  const showShell = !isAuthPage && (loading || currentUser);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`app-layout relative min-h-screen flex transition-all duration-1000 ${currentTheme.bg}`}>
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[10000ms] transition-all duration-1000 ${currentTheme.gradient1}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[150px] mix-blend-screen animate-pulse duration-[7000ms] transition-all duration-1000 ${currentTheme.gradient2}`} />
      </div>

      {/* Unified Top-Right Status Indicators - Ultra Sleek & Compact */}
      <div className="fixed top-5 right-6 z-50 flex items-center gap-3 bg-[#050512]/60 backdrop-blur-md border border-white/[0.04] rounded-lg px-2.5 py-1.5 shadow-[0_0_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {llmActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/80 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${llmActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">LLM</span>
          <span className={`text-[9px] font-bold uppercase tracking-tight ${llmActive ? 'text-emerald-400' : 'text-rose-500'}`}>
            {llmActive ? 'Active' : 'Offline'}
          </span>
        </div>
        <div className="w-[1px] h-2 bg-white/[0.08]" />
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {dbActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/80 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dbActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">DB</span>
          <span className={`text-[9px] font-bold uppercase tracking-tight ${dbActive ? 'text-emerald-400' : 'text-rose-500'}`}>
            {dbActive ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Only show sidebar when user is authenticated */}
      {currentUser && <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} profile={profile} />}

      <main className="relative z-10 flex flex-col flex-1 h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <SQLChat 
                    messages={chatMessages}
                    setMessages={setChatMessages}
                    inputText={chatInputText}
                    setInputText={setChatInputText}
                    loading={chatLoading}
                    setLoading={setChatLoading}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schema" 
              element={
                <ProtectedRoute>
                  <SchemaExplorer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/console" 
              element={
                <ProtectedRoute>
                  <SQLConsole />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsDashboard 
                    profile={profile} 
                    onUpdateProfile={updateProfile} 
                    activeTheme={activeTheme}
                    setActiveTheme={changeTheme}
                    activeColor={activeColor}
                    setActiveColor={changeColor}
                  />
                </ProtectedRoute>
              } 
            />
            {/* ── Admin-only (requires admin Firebase custom claim) ─── */}
            {/* Uncomment and replace AdminDashboard with your component: */}
            {/* <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> */}
            {/* <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
