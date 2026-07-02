import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  HiChatBubbleLeftRight, 
  HiCircleStack, 
  HiCommandLine, 
  HiCog6Tooth, 
  HiChevronLeft, 
  HiChevronRight, 
  HiEllipsisVertical,
  HiArrowRightOnRectangle,
  HiTrash
} from 'react-icons/hi2';
import { useAuth } from '../contexts/AuthContext';

const SidebarNavItem = ({ item, isOpen }) => (
  <NavLink
    to={item.path}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3.5 mx-3 my-0.5 rounded-xl transition-all duration-300 relative group overflow-hidden
      ${isActive 
        ? 'bg-purple-600/[0.15] text-purple-400 border border-purple-500/20' 
        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'}
    `}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
        )}
        <item.icon size={20} className={`flex-shrink-0 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'group-hover:scale-110'}`} />
        {isOpen && (
          <span className="font-semibold text-[14px] tracking-wide whitespace-nowrap">{item.name}</span>
        )}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen, profile, chatSessions = [], activeSessionId, onSwitchChat, onDeleteChat }) => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const currentProfile = profile || {
    name: 'Alex Mercer',
    email: 'alex.mercer@querymind.ai',
    avatar: 'https://ui-avatars.com/api/?name=Alex+Mercer&background=a855f7&color=fff'
  };

  const navItems = [
    { name: 'SQL Chat', icon: HiChatBubbleLeftRight, path: '/' },
    { name: 'Schema Explorer', icon: HiCircleStack, path: '/schema' },
    { name: 'SQL Console', icon: HiCommandLine, path: '/console' },
    { name: 'Settings', icon: HiCog6Tooth, path: '/settings' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div 
      className={`
        relative z-20 flex flex-col border-r border-white/[0.05] transition-all duration-300 bg-[#070712]/95 backdrop-blur-2xl
        ${isOpen ? 'w-64' : 'w-20'} 
        hidden md:flex
      `}
    >
      <div className="flex items-center gap-3 px-5 h-[88px] border-b border-white/[0.05] flex-shrink-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#12122a] border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)] relative">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z" fill="currentColor"/>
          </svg>
        </div>
        {isOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-bold text-white tracking-tight">QueryMind AI</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">AI Engine</span>
          </div>
        )}
      </div>

      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.name} item={item} isOpen={isOpen} />
        ))}

        {/* Chat History Section */}
        {isOpen && (
          <div className="mt-6 mb-2 px-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Recent Chats</h3>
          </div>
        )}
        {chatSessions.map((chat) => (
          isOpen ? (
            <div 
              key={chat.id} 
              onClick={() => onSwitchChat(chat.id)}
              className={`group flex items-center justify-between mx-4 my-0.5 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                activeSessionId === chat.id 
                  ? 'bg-purple-600/[0.1] border border-purple-500/20' 
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <HiChatBubbleLeftRight size={14} className={`flex-shrink-0 ${activeSessionId === chat.id ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className={`text-[13px] truncate ${activeSessionId === chat.id ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>
                  {chat.title || 'New Chat'}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-500 transition-opacity ml-2 flex-shrink-0"
                title="Delete Chat"
              >
                <HiTrash size={14} />
              </button>
            </div>
          ) : (
            <div 
              key={chat.id}
              onClick={() => onSwitchChat(chat.id)}
              className={`flex items-center justify-center mx-3 my-0.5 px-0 py-2.5 rounded-xl cursor-pointer transition-colors ${
                activeSessionId === chat.id ? 'bg-purple-600/[0.1] border border-purple-500/20' : 'hover:bg-white/[0.04] border border-transparent'
              }`}
              title={chat.title || 'New Chat'}
            >
              <HiChatBubbleLeftRight size={18} className={activeSessionId === chat.id ? 'text-purple-400' : 'text-slate-500'} />
            </div>
          )
        ))}
      </nav>

      {isOpen && (
        <div className="mx-4 mb-4 mt-auto">
          <div className="relative w-full h-36 rounded-2xl bg-[#0a0a1a] border border-white/[0.05] flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="w-16 h-16 rounded-full bg-purple-900/20 flex items-center justify-center relative z-10 border border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-600/10 to-transparent blur-md"></div>
          </div>
        </div>
      )}

      {/* User Card with Sign Out Context Dropdown */}
      <div className="relative" ref={menuRef}>
        <div 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`mx-4 mb-6 p-3 bg-[#0a0a1a] rounded-xl border border-white/[0.05] flex items-center gap-3 transition-all cursor-pointer hover:bg-white/[0.03] ${!isOpen ? 'mx-2 p-2 justify-center' : ''}`}
        >
          <div className="w-9 h-9 rounded-full bg-[#12122a] flex items-center justify-center flex-shrink-0 border border-white/[0.1] relative">
            <img src={currentProfile.avatar} alt="User" className="w-full h-full object-cover rounded-full" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a1a] rounded-full"></div>
          </div>
          {isOpen && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-bold text-white truncate tracking-tight">{currentProfile.name}</span>
                <span className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{currentProfile.email}</span>
              </div>
              <HiEllipsisVertical size={16} className="text-slate-500 hover:text-white" />
            </>
          )}
        </div>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div 
            className={`absolute bottom-20 left-4 bg-[#0a0a1a]/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-[999] animate-fade-in ${
              isOpen ? 'w-56' : 'w-48 left-2'
            }`}
          >
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-white/[0.05] hover:text-white text-[13px] font-bold transition-all text-left cursor-pointer"
            >
              <HiCog6Tooth size={16} className="text-slate-400" />
              Settings
            </button>
            <div className="h-[1px] bg-white/[0.05] my-1" />
            <button
              onClick={() => {
                setMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-[13px] font-bold transition-all text-left cursor-pointer"
            >
              <HiArrowRightOnRectangle size={16} className="text-rose-500" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-[32px] w-6 h-6 bg-[#1a1a2e] rounded-full flex items-center justify-center text-slate-400 border border-white/[0.1] hover:text-white hover:bg-[#252540] transition-colors z-50"
      >
        {isOpen ? <HiChevronLeft size={12} /> : <HiChevronRight size={12} />}
      </button>
    </div>
  );
};

export default Sidebar;
