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
    const email = localStorage.getItem('profileEmail') || 'alex.mercer@querymind.ai';
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
    'Cyber Void': { bg: 'bg-[#030308] bg-gradient-to-br from-[#0c0420] via-[#04010a] to-black', gradient1: 'bg-purple-900/10', gradient2: 'bg-indigo-900/10' },
    'Neon City': { bg: 'bg-[#020205] bg-gradient-to-br from-[#1a022b] via-[#040822] to-[#01010a]', gradient1: 'bg-fuchsia-900/15', gradient2: 'bg-blue-900/15' },
    'Quantum Realm': { bg: 'bg-[#000102] bg-gradient-to-br from-[#011414] via-[#010608] to-black', gradient1: 'bg-cyan-900/15', gradient2: 'bg-emerald-900/15' },
    'Deep Space': { bg: 'bg-black bg-gradient-to-br from-[#03030c] via-[#010104] to-black', gradient1: 'bg-blue-950/15', gradient2: 'bg-slate-900/15' }
  };
  const currentTheme = themeStyles[activeTheme] || themeStyles['Cyber Void'];

  // Lifted Chat State (With Sessions)
  const generateId = () => Math.random().toString(36).substring(2, 9);
  const [chatSessions, setChatSessions] = useState(() => {
    const saved = localStorage.getItem('chatSessions');
    return saved ? JSON.parse(saved) : [{ id: generateId(), title: 'New Chat', messages: [], date: new Date().toISOString() }];
  });
  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('activeSessionId') || chatSessions[0].id;
  });
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInputText, setChatInputText] = useState('');

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem('activeSessionId', activeSessionId);
  }, [activeSessionId]);

  // Derived active messages
  const activeSession = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
  const chatMessages = activeSession.messages;

  const setChatMessages = (newMessagesOrUpdater) => {
    setChatSessions(prev => {
      const updated = prev.map(session => {
        if (session.id === activeSessionId) {
          const newMessages = typeof newMessagesOrUpdater === 'function' ? newMessagesOrUpdater(session.messages) : newMessagesOrUpdater;
          // Auto-generate title from first user message
          let title = session.title;
          if (newMessages.length >= 1 && (title === 'New Chat' || title === 'Untitled Chat')) {
             const firstUserMsg = newMessages.find(m => m.role === 'user');
             if (firstUserMsg) title = firstUserMsg.content.slice(0, 25) + '...';
          }
          return { ...session, messages: newMessages, title };
        }
        return session;
      });
      return updated;
    });
  };

  const createNewChat = () => {
    const newSession = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      date: new Date().toISOString()
    };
    setChatSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const switchChat = (id) => {
    setActiveSessionId(id);
  };

  const deleteChat = (id) => {
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const newSession = { id: generateId(), title: 'New Chat', messages: [], date: new Date().toISOString() };
        setActiveSessionId(newSession.id);
        return [newSession];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

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
    checkStatus();
    const interval = setInterval(checkStatus, 10000); 
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

      {/* ── Status Indicators — LLM & DB ─────────────────────────────── */}
      <div className="fixed top-4 right-5 z-50 flex items-center gap-2"
           style={{
             background: 'linear-gradient(135deg, rgba(10,8,28,0.85) 0%, rgba(6,4,18,0.92) 100%)',
             backdropFilter: 'blur(16px)',
             WebkitBackdropFilter: 'blur(16px)',
             border: '1px solid rgba(255,255,255,0.07)',
             borderRadius: '12px',
             padding: '6px 14px',
             boxShadow: '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
           }}>

        {/* LLM Badge */}
        <div className="flex items-center gap-2">
          {/* Animated dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {llmActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: 'rgba(52,211,153,0.9)' }} />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full"
                  style={{
                    background: llmActive
                      ? 'radial-gradient(circle, #6ee7b7 0%, #10b981 60%)'
                      : 'radial-gradient(circle, #fca5a5 0%, #ef4444 60%)',
                    boxShadow: llmActive
                      ? '0 0 6px 2px rgba(16,185,129,0.55)'
                      : '0 0 6px 2px rgba(239,68,68,0.45)'
                  }} />
          </span>
          {/* Label + status */}
          <div className="flex items-baseline gap-1.5">
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(148,163,184,0.75)',
              fontFamily: "'Inter', sans-serif"
            }}>LLM</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'Inter', sans-serif",
              color: llmActive ? '#34d399' : '#f87171',
              textShadow: llmActive
                ? '0 0 10px rgba(52,211,153,0.6)'
                : '0 0 10px rgba(248,113,113,0.5)'
            }}>
              {llmActive ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          width: '1px',
          height: '16px',
          background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)'
        }} />

        {/* DB Badge */}
        <div className="flex items-center gap-2">
          {/* Animated dot */}
          <span className="relative flex h-2 w-2 flex-shrink-0">
            {dbActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                    style={{ background: 'rgba(52,211,153,0.9)' }} />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full"
                  style={{
                    background: dbActive
                      ? 'radial-gradient(circle, #6ee7b7 0%, #10b981 60%)'
                      : 'radial-gradient(circle, #fca5a5 0%, #ef4444 60%)',
                    boxShadow: dbActive
                      ? '0 0 6px 2px rgba(16,185,129,0.55)'
                      : '0 0 6px 2px rgba(239,68,68,0.45)'
                  }} />
          </span>
          {/* Label + status */}
          <div className="flex items-baseline gap-1.5">
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(148,163,184,0.75)',
              fontFamily: "'Inter', sans-serif"
            }}>DB</span>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'Inter', sans-serif",
              color: dbActive ? '#34d399' : '#f87171',
              textShadow: dbActive
                ? '0 0 10px rgba(52,211,153,0.6)'
                : '0 0 10px rgba(248,113,113,0.5)'
            }}>
              {dbActive ? 'Active' : 'Offline'}
            </span>
          </div>
        </div>

      </div>

      {/* Only show sidebar when user is authenticated */}
      {currentUser && (
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          profile={profile}
          chatSessions={chatSessions}
          activeSessionId={activeSessionId}
          onSwitchChat={switchChat}
          onDeleteChat={deleteChat}
        />
      )}

      <main className="relative flex flex-col flex-1 h-screen overflow-hidden">
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
                    onNewChat={createNewChat}
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
