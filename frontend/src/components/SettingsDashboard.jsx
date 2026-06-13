import React, { useState, useEffect } from 'react';
import { 
  HiCog6Tooth, 
  HiCheck, 
  HiUser, 
  HiCircleStack, 
  HiKey, 
  HiShieldCheck, 
  HiAdjustmentsHorizontal, 
  HiTrash, 
  HiPlus, 
  HiArrowPath, 
  HiLockClosed, 
  HiEye, 
  HiEyeSlash, 
  HiClipboard, 
  HiClock, 
  HiGlobeAlt, 
  HiXMark,
  HiExclamationTriangle,
  HiSparkles
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';

const SettingsDashboard = ({ 
  profile, 
  onUpdateProfile, 
  activeTheme, 
  setActiveTheme, 
  activeColor, 
  setActiveColor 
}) => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [toasts, setToasts] = useState([]);
  
  const { 
    currentUser, 
    updateDisplayName, 
    changeEmail, 
    changePassword, 
    resendVerificationEmail 
  } = useAuth();

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Profile States ---
  const [profileName, setProfileName] = useState(profile?.name || 'Alex Mercer');
  const [profileEmail, setProfileEmail] = useState(profile?.email || 'alex.mercer@nexus.io');
  const [profileRole, setProfileRole] = useState(profile?.role || 'Data Engineer');
  const [profileBio, setProfileBio] = useState(profile?.bio || 'Data enthusiast, database administrator and AI explorer. Designing smart solutions.');
  const [profileAvatar, setProfileAvatar] = useState(profile?.avatar || 'https://ui-avatars.com/api/?name=Alex+Mercer&background=a855f7&color=fff');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [resending, setResending] = useState(false);

  // Keep local states in sync if profile prop changes
  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || 'Alex Mercer');
      setProfileEmail(profile.email || 'alex.mercer@nexus.io');
      setProfileRole(profile.role || 'Data Engineer');
      setProfileBio(profile.bio || 'Data enthusiast, database administrator and AI explorer. Designing smart solutions.');
      setProfileAvatar(profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Alex Mercer')}&background=a855f7&color=fff`);
    }
  }, [profile]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    try {
      // 1. Sync display name with Firebase if changed
      if (currentUser && profileName !== currentUser.displayName) {
        await updateDisplayName(profileName);
      }

      // 2. Sync email with Firebase if changed
      if (currentUser && profileEmail !== currentUser.email) {
        await changeEmail(profileEmail);
        showToast('Verification email sent to your new email. Please verify it.', 'warning');
      }

      const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=a855f7&color=fff`;
      setProfileAvatar(newAvatar);
      
      if (onUpdateProfile) {
        onUpdateProfile({
          name: profileName,
          email: profileEmail,
          role: profileRole,
          bio: profileBio,
          avatar: newAvatar
        });
      }
      showToast('Profile information updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update profile info.', 'error');
    }
  };

  const handleResendVerification = async () => {
    try {
      setResending(true);
      await resendVerificationEmail();
      showToast('Verification email resent successfully! Check your inbox.');
    } catch (err) {
      showToast(err.message || 'Failed to resend verification email.', 'error');
    } finally {
      setResending(false);
    }
  };

  const triggerAvatarUpload = () => {
    const mockAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=0284c7&color=fff`;
    setProfileAvatar(mockAvatar);
    if (onUpdateProfile) {
      onUpdateProfile({
        name: profileName,
        email: profileEmail,
        role: profileRole,
        bio: profileBio,
        avatar: mockAvatar
      });
    }
    showToast('Profile picture uploaded successfully! (Simulated)');
  };

  const removeAvatar = () => {
    const newAvatar = 'https://ui-avatars.com/api/?name=User&background=64748b&color=fff';
    setProfileAvatar(newAvatar);
    if (onUpdateProfile) {
      onUpdateProfile({
        name: profileName,
        email: profileEmail,
        role: profileRole,
        bio: profileBio,
        avatar: newAvatar
      });
    }
    showToast('Profile picture removed.');
  };

  // --- Database Connections States ---
  const [connections, setConnections] = useState([
    { id: 1, name: 'Primary PostgreSQL (Production)', type: 'PostgreSQL', host: 'postgres.nexus.io', port: 5432, dbname: 'commerce_prod', status: 'Connected' },
    { id: 2, name: 'Analytic Snowflake (Staging)', type: 'Snowflake', host: 'sf-staging.nexus.io', port: 443, dbname: 'analytics_db', status: 'Connected' }
  ]);
  const [newConnName, setNewConnName] = useState('');
  const [newConnType, setNewConnType] = useState('PostgreSQL');
  const [newConnHost, setNewConnHost] = useState('');
  const [newConnPort, setNewConnPort] = '5432';
  const [portInput, setPortInput] = useState('5432');
  const [newConnDbName, setNewConnDbName] = useState('');
  const [newConnUser, setNewConnUser] = useState('');
  const [newConnPass, setNewConnPass] = useState('');
  const [newConnSsl, setNewConnSsl] = useState(true);
  const [testingConn, setTestingConn] = useState(false);

  const handleTypeChange = (type) => {
    setNewConnType(type);
    if (type === 'PostgreSQL') setPortInput('5432');
    else if (type === 'MySQL') setPortInput('3306');
    else if (type === 'SQLite') setPortInput('0');
    else if (type === 'MongoDB') setPortInput('27017');
    else if (type === 'Snowflake') setPortInput('443');
  };

  const handleTestConnection = () => {
    if (!newConnHost) {
      showToast('Please provide a Host or Connection URI to test.', 'error');
      return;
    }
    setTestingConn(true);
    setTimeout(() => {
      setTestingConn(false);
      showToast(`Connection test successful! Validated ${newConnType} connection.`, 'success');
    }, 1500);
  };

  const handleSaveConnection = (e) => {
    e.preventDefault();
    if (!newConnName.trim()) {
      showToast('Connection Name is required.', 'error');
      return;
    }
    if (!newConnHost.trim()) {
      showToast('Connection Host/URI is required.', 'error');
      return;
    }
    const newConn = {
      id: Date.now(),
      name: newConnName,
      type: newConnType,
      host: newConnHost,
      port: parseInt(portInput) || 0,
      dbname: newConnDbName || 'default',
      status: 'Connected'
    };
    setConnections(prev => [...prev, newConn]);
    showToast(`Database "${newConnName}" added and connected!`);
    
    // Reset Form
    setNewConnName('');
    setNewConnHost('');
    setNewConnDbName('');
    setNewConnUser('');
    setNewConnPass('');
  };

  const deleteConnection = (id, name) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    showToast(`Database connection "${name}" disconnected and removed.`, 'warning');
  };

  // --- Preferences States ---
  const [fontSize, setFontSize] = useState('Medium');
  
  const [editorPrefs, setEditorPrefs] = useState({
    autoComplete: true,
    autoCompleteParentheses: true,
    autoSave: true,
    autoSaveInterval: 30,
    sqlFormatting: 'Uppercase Keywords',
    maxRowLimit: 500
  });

  const savePreferences = () => {
    showToast('Preferences and theme saved successfully!');
  };

  const resetPreferences = () => {
    setActiveTheme('Cyber Void');
    setActiveColor('purple');
    setFontSize('Medium');
    setEditorPrefs({
      autoComplete: true,
      autoCompleteParentheses: true,
      autoSave: true,
      autoSaveInterval: 30,
      sqlFormatting: 'Uppercase Keywords',
      maxRowLimit: 500
    });
    showToast('All preferences reset to default values.', 'warning');
  };

  // --- API Keys States ---
    { id: 1, name: 'Production LLM Key', key: 'nx_live_6f9e2d5a8b7c3d1e9f0a', created: '2026-04-15', lastUsed: '5 mins ago' },
    { id: 2, name: 'Staging Integration Key', key: 'nx_live_1a2b3c4d5e6f7g8h9i0j', created: '2026-05-10', lastUsed: '2 hours ago' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpiry, setNewKeyExpiry] = useState('Never');
  const [newKeyScopes, setNewKeyScopes] = useState({
    read: true,
    write: false,
    execute: true,
    admin: false
  });
  const [generatedKeyDetails, setGeneratedKeyDetails] = useState(null);

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      showToast('Please enter an API Key name.', 'error');
      return;
    }
    const randPart = Array.from({length: 20}, () => Math.floor(Math.random()*16).toString(16)).join('');
    const fullKey = `nx_live_${randPart}`;
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      key: `${fullKey.slice(0, 11)}...${fullKey.slice(-4)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };

    setApiKeys(prev => [...prev, newKey]);
    setGeneratedKeyDetails(fullKey);
    showToast(`API Key "${newKeyName}" generated successfully!`);
    setNewKeyName('');
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const revokeKey = (id, name) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
    showToast(`API Key "${name}" has been permanently revoked.`, 'warning');
  };

  // --- Security States ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [sessions, setSessions] = useState([
    { id: 1, browser: 'Chrome on Windows (Current)', ip: '192.168.1.84', location: 'Mumbai, India', date: 'Active Now' },
    { id: 2, browser: 'Safari on iPhone 15 Pro', ip: '103.24.12.8', location: 'Mumbai, India', date: '2 hours ago' }
  ]);

  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false);
  const [allowedIps, setAllowedIps] = useState('');

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast('All password fields are required.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New password and password confirmation do not match.', 'error');
      return;
    }

    try {
      if (currentUser) {
        await changePassword(newPassword);
        showToast('Your account password has been updated securely!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('You must be signed in to change your password.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update password. You may need to re-login to complete this action.', 'error');
    }
  };

  const handleRevokeOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.id === 1)); // Keep current only
    showToast('Logged out of all other active browser and app sessions.', 'warning');
  };

  const handleSaveSecurity = (e) => {
    e.preventDefault();
    showToast('IP Whitelist and active firewall configurations updated.');
  };

  // Core Static Lists
  const tabs = [
    { name: 'Profile', icon: HiUser },
    { name: 'Database Connections', icon: HiCircleStack },
    { name: 'Preferences', icon: HiAdjustmentsHorizontal },
    { name: 'API Keys', icon: HiKey },
    { name: 'Security', icon: HiShieldCheck }
  ];

  const themes = [
    { name: 'Cyber Void', class: 'bg-gradient-to-br from-purple-900 to-black border-purple-500' },
    { name: 'Neon City', class: 'bg-gradient-to-br from-fuchsia-900 to-blue-900 border-transparent' },
    { name: 'Quantum Realm', class: 'bg-gradient-to-br from-cyan-900 to-emerald-900 border-transparent' },
    { name: 'Deep Space', class: 'bg-gradient-to-br from-[#0c0c1d] to-[#050510] border-transparent' },
  ];

  const colors = ['cyan', 'blue', 'indigo', 'purple', 'fuchsia', 'rose', 'orange', 'amber', 'emerald'];

  // --- Sub-renderers for each tab ---

  const renderProfileTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Columns - Edit Details */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handleProfileSave} className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-5">
          <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight">Profile Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                {currentUser && (
                  currentUser.emailVerified ? (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <HiCheck size={12} /> Verified
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        Unverified
                      </span>
                      <button 
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-bold transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {resending ? 'Sending...' : 'Resend Link'}
                      </button>
                    </div>
                  )
                )}
              </div>
              <input 
                type="email" 
                value={profileEmail} 
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-slate-300 outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
              <select 
                value={profileRole}
                onChange={(e) => setProfileRole(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Data Engineer">Data Engineer</option>
                <option value="Administrator">Administrator</option>
                <option value="Analyst">Analyst</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bio</label>
              <textarea 
                rows="3"
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-slate-300 outline-none focus:border-purple-500/50 transition-colors resize-none" 
              />
            </div>
          </div>
          <div className="pt-3 flex justify-end">
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Right Column - Picture & Account Details */}
      <div className="space-y-6">
        {/* Avatar Slot */}
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
          <h3 className="text-[14px] font-bold text-slate-300 mb-6 uppercase tracking-wider self-start">Profile Image</h3>
          <div className="relative w-24 h-24 rounded-full border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)] mb-4">
            <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#070712] rounded-full"></div>
          </div>
          <h4 className="text-white font-bold text-[15px]">{profileName}</h4>
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-widest mt-1">{profileRole}</span>
          
          <div className="flex gap-2.5 mt-6 w-full">
            <button 
              onClick={triggerAvatarUpload}
              className="flex-1 px-4 py-2 border border-white/[0.1] hover:bg-white/[0.04] text-white text-[12px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Upload New
            </button>
            <button 
              onClick={removeAvatar}
              className="px-3 py-2 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-[12px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Account Security Quick Overview */}
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-[14px] font-bold text-slate-300 uppercase tracking-wider mb-2">Account Overview</h3>
          
          <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
            <span className="text-[13px] text-slate-400">Security Status</span>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-bold rounded-md border border-emerald-500/20">Secure</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
            <span className="text-[13px] text-slate-400">Two-Factor Auth</span>
            <div 
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                showToast(`Two-factor Authentication ${!twoFactorEnabled ? 'enabled' : 'disabled'}.`);
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${twoFactorEnabled ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${twoFactorEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[13px] text-slate-400">Active Sessions</span>
            <span className="text-[13px] font-bold text-white">2 Devices</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Active Databases List */}
      <div className="space-y-6">
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <h3 className="text-[16px] font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <HiCircleStack className="text-purple-400" /> Connected Databases
          </h3>
          
          <div className="space-y-4">
            {connections.map((conn) => (
              <div 
                key={conn.id} 
                className="bg-[#0a0a1a] border border-white/[0.05] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-purple-500/25 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-900/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                    <HiCircleStack size={20} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-white">{conn.name}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold rounded-md uppercase tracking-wider border border-emerald-500/20">
                        {conn.status}
                      </span>
                    </div>
                    <span className="text-[12px] text-slate-400 mt-0.5 font-mono">{conn.type} • {conn.host}:{conn.port}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button 
                    onClick={() => {
                      showToast(`Successfully verified connection to "${conn.name}"!`);
                    }}
                    className="px-3 py-1.5 border border-white/[0.05] hover:bg-white/[0.04] text-slate-300 hover:text-white text-[12px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Test
                  </button>
                  <button 
                    onClick={() => deleteConnection(conn.id, conn.name)}
                    className="p-2 border border-rose-500/10 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Disconnect"
                  >
                    <HiTrash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Database Connection */}
      <div className="space-y-6">
        <form onSubmit={handleSaveConnection} className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight flex items-center gap-2">
            <HiPlus className="text-purple-400" /> New Database Connection
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Connection Name</label>
              <input 
                type="text" 
                placeholder="e.g. Local Analytics Replica"
                value={newConnName}
                onChange={(e) => setNewConnName(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Database Type</label>
              <select 
                value={newConnType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="SQLite">SQLite</option>
                <option value="MongoDB">MongoDB</option>
                <option value="Snowflake">Snowflake</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Host / Endpoint</label>
              <input 
                type="text" 
                placeholder="localhost or DB URL"
                value={newConnHost}
                onChange={(e) => setNewConnHost(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Port</label>
              <input 
                type="text" 
                value={portInput}
                onChange={(e) => setPortInput(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Database Name</label>
              <input 
                type="text" 
                placeholder="e.g. test_commerce"
                value={newConnDbName}
                onChange={(e) => setNewConnDbName(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Username</label>
              <input 
                type="text" 
                placeholder="postgres"
                value={newConnUser}
                onChange={(e) => setNewConnUser(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                value={newConnPass}
                onChange={(e) => setNewConnPass(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>

            <div className="col-span-2 flex items-center justify-between border-t border-white/[0.04] pt-4 mt-1">
              <span className="text-[12px] text-slate-400 font-medium">Require Secure SSL Connection</span>
              <div 
                onClick={() => {
                  setNewConnSsl(!newConnSsl);
                  showToast(`SSL enforcement ${!newConnSsl ? 'enabled' : 'disabled'}.`);
                }}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${newConnSsl ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${newConnSsl ? 'translate-x-4.5' : 'translate-x-0'}`} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/[0.04]">
            <button 
              type="button" 
              onClick={handleTestConnection}
              disabled={testingConn}
              className="px-5 py-2.5 border border-white/[0.1] hover:bg-white/[0.04] disabled:opacity-50 text-white text-[13px] font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {testingConn ? (
                <HiArrowPath className="animate-spin text-purple-400" size={14} />
              ) : (
                <HiArrowPath size={14} />
              )}
              {testingConn ? 'Testing...' : 'Test Connection'}
            </button>
            <button 
              type="submit" 
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              Save Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Column 1 - Theme & Accent */}
      <div className="space-y-6">
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <h3 className="text-[16px] font-bold text-white mb-6 tracking-tight">Appearance & Theme</h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">UI Theme Style</label>
              <div className="grid grid-cols-2 gap-4">
                {themes.map(t => (
                  <div key={t.name} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => {
                    setActiveTheme(t.name);
                    showToast(`Theme changed to ${t.name}!`);
                  }}>
                    <div className={`w-full aspect-video rounded-xl border-2 transition-all ${t.class} ${activeTheme === t.name ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-white/[0.1] opacity-70 group-hover:opacity-100'}`} />
                    <span className={`text-[12px] font-bold ${activeTheme === t.name ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{t.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">Accent Color Indicator</label>
              <div className="flex items-center gap-3 flex-wrap">
                {colors.map(c => (
                  <div 
                    key={c} 
                    onClick={() => {
                      setActiveColor(c);
                      showToast(`Accent color set to ${c}.`);
                    }}
                    className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-all ${activeColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#070712]' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: c === 'cyan' ? '#06b6d4' : c === 'blue' ? '#3b82f6' : c === 'indigo' ? '#6366f1' : c === 'purple' ? '#a855f7' : c === 'fuchsia' ? '#d946ef' : c === 'rose' ? '#f43f5e' : c === 'orange' ? '#f97316' : c === 'amber' ? '#f59e0b' : '#10b981' }}
                  >
                    {activeColor === c && <HiCheck size={14} className="text-white" />}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3">Font Hierarchy Size</label>
              <select 
                value={fontSize}
                onChange={(e) => {
                  setFontSize(e.target.value);
                  showToast(`Workspace font scale set to ${e.target.value}.`);
                }}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-3 text-[14px] text-white outline-none focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="Small">Small (12px)</option>
                <option value="Medium">Medium (14px)</option>
                <option value="Large">Large (16px)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2 - Editor / Console Configs */}
      <div className="space-y-6">
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-6">
          <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight flex items-center gap-2">
            <HiSparkles className="text-purple-400 animate-pulse" /> SQL Editor Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[14px] text-slate-300 font-medium group-hover:text-white transition-colors">Smart SQL Autocomplete</span>
                <span className="text-[11px] text-slate-500">Provide real-time context aware auto suggestions.</span>
              </div>
              <div 
                onClick={() => setEditorPrefs(p => ({ ...p, autoComplete: !p.autoComplete }))}
                className={`w-11 h-6 flex-shrink-0 rounded-full p-1 transition-colors cursor-pointer ${editorPrefs.autoComplete ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editorPrefs.autoComplete ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[14px] text-slate-300 font-medium group-hover:text-white transition-colors">Autocomplete Parentheses</span>
                <span className="text-[11px] text-slate-500">Automatically insert matching quotes and brackets.</span>
              </div>
              <div 
                onClick={() => setEditorPrefs(p => ({ ...p, autoCompleteParentheses: !p.autoCompleteParentheses }))}
                className={`w-11 h-6 flex-shrink-0 rounded-full p-1 transition-colors cursor-pointer ${editorPrefs.autoCompleteParentheses ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editorPrefs.autoCompleteParentheses ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-[14px] text-slate-300 font-medium group-hover:text-white transition-colors">Auto-save Local Queries</span>
                <span className="text-[11px] text-slate-500">Enable local background auto-saving for drafts.</span>
              </div>
              <div 
                onClick={() => setEditorPrefs(p => ({ ...p, autoSave: !p.autoSave }))}
                className={`w-11 h-6 flex-shrink-0 rounded-full p-1 transition-colors cursor-pointer ${editorPrefs.autoSave ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editorPrefs.autoSave ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </div>

            {editorPrefs.autoSave && (
              <div className="pt-2 animate-fade-in">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Auto-save Interval (seconds)</label>
                  <span className="text-[12px] font-mono text-purple-400 font-bold">{editorPrefs.autoSaveInterval}s</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="120"
                  value={editorPrefs.autoSaveInterval}
                  onChange={(e) => setEditorPrefs(p => ({ ...p, autoSaveInterval: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-purple-500" 
                />
              </div>
            )}

            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Default SQL Formatter</label>
              <select 
                value={editorPrefs.sqlFormatting}
                onChange={(e) => setEditorPrefs(p => ({ ...p, sqlFormatting: e.target.value }))}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
              >
                <option value="Uppercase Keywords">Uppercase Keywords (SELECT * FROM)</option>
                <option value="Lowercase Keywords">Lowercase Keywords (select * from)</option>
                <option value="Unformatted">Unformatted Plain Text</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Max Query Result Preview Rows</label>
              <input 
                type="number"
                value={editorPrefs.maxRowLimit}
                onChange={(e) => setEditorPrefs(p => ({ ...p, maxRowLimit: parseInt(e.target.value) || 0 }))}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.04] flex items-center justify-end gap-3">
            <button 
              onClick={resetPreferences}
              className="px-5 py-2.5 border border-white/[0.1] hover:bg-white/[0.04] text-white text-[13px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Reset Defaults
            </button>
            <button 
              onClick={savePreferences}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiKeysTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in relative">
      
      {/* Generated Key Panel (Centered Overlay / Modal Modal design) */}
      {generatedKeyDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#070712] border border-purple-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">API Key Generated</h3>
            <p className="text-[13px] text-slate-400 mb-5 leading-relaxed">
              Please copy your API key and save it in a secure location. For security purposes, <strong className="text-purple-400">you will not be able to view it again.</strong>
            </p>

            <div className="relative bg-[#050510] border border-white/[0.05] rounded-xl p-3 flex items-center justify-between gap-3 group">
              <span className="font-mono text-[12px] text-emerald-400 overflow-x-auto select-all pr-2 whitespace-nowrap scrollbar-none">
                {generatedKeyDetails}
              </span>
              <button 
                onClick={() => copyToClipboard(generatedKeyDetails, 'API Key')}
                className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer"
                title="Copy Key"
              >
                <HiClipboard size={14} />
              </button>
            </div>

            <button 
              onClick={() => setGeneratedKeyDetails(null)}
              className="mt-6 w-full py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white text-[13px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* Active API Keys List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <h3 className="text-[16px] font-bold text-white mb-6 tracking-tight flex items-center gap-2">
            <HiKey className="text-purple-400" /> Active API Access Keys
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px] min-w-[450px]">
              <thead>
                <tr className="border-b border-white/[0.05] text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3.5 pl-2">Name</th>
                  <th className="pb-3.5">API Token Key</th>
                  <th className="pb-3.5">Created</th>
                  <th className="pb-3.5">Last Active</th>
                  <th className="pb-3.5 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                  <tr key={key.id} className="hover:bg-white/[0.01]">
                    <td className="py-4 pl-2 font-bold text-white">{key.name}</td>
                    <td className="py-4 font-mono text-[12px] text-slate-400">{key.key}</td>
                    <td className="py-4 text-slate-300">{key.created}</td>
                    <td className="py-4 text-slate-300">{key.lastUsed}</td>
                    <td className="py-4 text-right pr-2">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => copyToClipboard(key.key, 'Token key')}
                          className="p-1.5 border border-white/[0.05] hover:bg-white/[0.04] text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Copy Key Reference"
                        >
                          <HiClipboard size={12} />
                        </button>
                        <button 
                          onClick={() => revokeKey(key.id, key.name)}
                          className="p-1.5 border border-rose-500/10 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Revoke Key"
                        >
                          <HiTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate API Key Form */}
      <div className="space-y-6">
        <form onSubmit={handleGenerateKey} className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight">Generate Key</h3>
          
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Key Name / Description</label>
            <input 
              type="text" 
              placeholder="e.g. Analytics App Pipeline"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Expiration Limit</label>
            <select 
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
              className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
            >
              <option value="Never">Never (Permanent)</option>
              <option value="30 days">30 Days</option>
              <option value="90 days">90 Days</option>
              <option value="365 days">1 Year</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Key Scopes & Access</label>
            <div className="space-y-2 pt-1">
              {[
                { label: 'Read DB Tables', key: 'read' },
                { label: 'Write & Edit Schema', key: 'write' },
                { label: 'Execute Queries', key: 'execute' },
                { label: 'Administrator Settings', key: 'admin' }
              ].map((scope) => (
                <div key={scope.key} className="flex items-center gap-2.5">
                  <input 
                    type="checkbox"
                    checked={newKeyScopes[scope.key]}
                    onChange={(e) => setNewKeyScopes(prev => ({ ...prev, [scope.key]: e.target.checked }))}
                    id={`scope-${scope.key}`}
                    className="w-4 h-4 rounded border-white/[0.1] bg-[#0a0a1a] text-purple-600 focus:ring-purple-500/40 cursor-pointer" 
                  />
                  <label htmlFor={`scope-${scope.key}`} className="text-[13px] text-slate-300 font-medium select-none cursor-pointer">
                    {scope.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04]">
            <button 
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              Generate Token Key
            </button>
          </div>
        </form>
      </div>

    </div>
  );

  const renderSecurityTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Change Password Form */}
      <div className="lg:col-span-2 space-y-6">
        <form onSubmit={handlePasswordUpdate} className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-4">
          <h3 className="text-[16px] font-bold text-white mb-2 tracking-tight flex items-center gap-2">
            <HiLockClosed className="text-purple-400" /> Change Account Password
          </h3>

          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Password</label>
              <div className="relative">
                <input 
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl pl-4 pr-11 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
                />
                <button 
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showCurrent ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Password</label>
              <div className="relative">
                <input 
                  type={showNew ? 'text' : 'password'}
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl pl-4 pr-11 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
                />
                <button 
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showNew ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl pl-4 pr-11 py-2.5 text-[13px] text-white outline-none focus:border-purple-500/50 transition-colors" 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showConfirm ? <HiEyeSlash size={16} /> : <HiEye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500">Security Requirement:</span>
              <span className="text-[10px] text-purple-400 font-bold">✓ 8+ chars • ✓ 1 Capital • ✓ 1 Symbol</span>
            </div>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Sessions and IP whitelist */}
      <div className="space-y-6">
        
        {/* Active Browser Sessions */}
        <div className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl">
          <h3 className="text-[15px] font-bold text-white mb-4 tracking-tight flex items-center gap-2">
            <HiClock className="text-purple-400" /> Active Logged-in Devices
          </h3>

          <div className="space-y-3.5">
            {sessions.map(s => (
              <div key={s.id} className="flex flex-col pb-3 border-b border-white/[0.03] last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-white">{s.browser}</span>
                  {s.active ? (
                    <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[9px] font-extrabold rounded uppercase tracking-wider border border-emerald-500/10">Active</span>
                  ) : (
                    <span className="text-[11px] text-slate-500">{s.date}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                  <HiGlobeAlt size={12} className="text-slate-500" /> {s.ip} • {s.location}
                </div>
              </div>
            ))}
          </div>

          {sessions.length > 1 && (
            <button 
              onClick={handleRevokeOtherSessions}
              className="mt-5 w-full py-2 border border-rose-500/10 hover:bg-rose-500/10 text-rose-400 text-[12px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Revoke All Other Sessions
            </button>
          )}
        </div>

        {/* IP Access Whitelist Firewall */}
        <form onSubmit={handleSaveSecurity} className="bg-[#070712]/80 backdrop-blur-xl border border-white/[0.05] rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-white tracking-tight">IP Whitelisting</h3>
            <div 
              onClick={() => {
                setIpWhitelistEnabled(!ipWhitelistEnabled);
                showToast(`IP Firewall restriction ${!ipWhitelistEnabled ? 'activated' : 'deactivated'}.`);
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${ipWhitelistEnabled ? 'bg-purple-600' : 'bg-white/[0.1]'}`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${ipWhitelistEnabled ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </div>
          </div>

          {ipWhitelistEnabled ? (
            <div className="space-y-3.5 animate-fade-in">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest">Allowed IP Addresses</label>
              <textarea 
                rows="2"
                placeholder="192.168.1.1, 10.0.0.0/24"
                value={allowedIps}
                onChange={(e) => setAllowedIps(e.target.value)}
                className="w-full bg-[#0a0a1a] border border-white/[0.1] rounded-xl px-4 py-2 text-[13px] text-white outline-none focus:border-purple-500/50 font-mono resize-none transition-colors" 
              />
              <button 
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-bold rounded-xl transition-all cursor-pointer"
              >
                Save Firewall Rules
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Enable IP Whitelisting firewall restriction rules to only permit commerce query console access from approved secure network CIDRs.
            </p>
          )}
        </form>
      </div>

    </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-6 md:p-8 relative">
      
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in-right ${
              toast.type === 'success' 
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20' 
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/20'
                : 'bg-amber-950/90 border-amber-500/30 text-amber-200 shadow-amber-950/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' && <HiCheck className="text-emerald-400 flex-shrink-0" size={18} />}
              {toast.type === 'error' && <HiExclamationTriangle className="text-rose-400 flex-shrink-0" size={18} />}
              {toast.type === 'warning' && <HiExclamationTriangle className="text-amber-400 flex-shrink-0" size={18} />}
              <span className="text-[13px] font-bold leading-normal">{toast.message}</span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)} 
              className="text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <HiXMark size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Background Gear */}
      <div className="absolute top-10 right-20 text-purple-500/10 pointer-events-none blur-[4px] z-0">
        <HiCog6Tooth size={250} className="animate-[spin_100s_linear_infinite]" />
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-[15px] text-slate-400 mt-1">Manage your application settings, data connections, and preferences.</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-8 px-2 border-b border-white/[0.05] mb-8 relative z-10 overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`pb-4 text-[14px] font-bold tracking-wide relative transition-all whitespace-nowrap flex items-center gap-2.5 cursor-pointer ${
              activeTab === tab.name ? 'text-purple-400 font-extrabold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} className={`transition-transform duration-300 ${activeTab === tab.name ? 'scale-110' : 'group-hover:scale-110'}`} />
            {tab.name}
            {activeTab === tab.name && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 pb-10">
        {activeTab === 'Profile' && renderProfileTab()}
        {activeTab === 'Database Connections' && renderDatabaseTab()}
        {activeTab === 'Preferences' && renderPreferencesTab()}
        {activeTab === 'API Keys' && renderApiKeysTab()}
        {activeTab === 'Security' && renderSecurityTab()}
      </div>
    </div>
  );
};

export default SettingsDashboard;
