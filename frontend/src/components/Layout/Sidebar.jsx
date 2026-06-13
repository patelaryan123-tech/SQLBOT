import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiChatBubbleLeftRight, HiCircleStack, HiCommandLine, HiCog6Tooth, HiChevronLeft, HiChevronRight, HiEllipsisVertical } from 'react-icons/hi2';
import { FaRobot } from 'react-icons/fa6'; // Assuming react-icons/fa6 is available or use standard SVG

const SidebarNavItem = ({ item, isOpen }) => (
  <NavLink
    to={item.path}
    className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 mx-3 my-1 rounded-xl transition-all duration-300 relative group overflow-hidden
      ${isActive 
        ? 'bg-purple-600/[0.15] text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)] border border-purple-500/20' 
        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border border-transparent'}
    `}
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
        )}
        <item.icon size={20} className={`flex-shrink-0 transition-transform ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'group-hover:scale-110'}`} />
        {isOpen && (
          <span className="font-semibold text-[14px] tracking-wide whitespace-nowrap">{item.name}</span>
        )}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navItems = [
    { name: 'SQL Chat', icon: HiChatBubbleLeftRight, path: '/' },
    { name: 'Schema Explorer', icon: HiCircleStack, path: '/schema' },
    { name: 'SQL Console', icon: HiCommandLine, path: '/console' },
    { name: 'Settings', icon: HiCog6Tooth, path: '/settings' },
  ];

  return (
    <div 
      className={`
        relative z-20 flex flex-col glass-panel border-r border-white/[0.08] transition-all duration-300
        ${isOpen ? 'w-64' : 'w-20'} 
        hidden md:flex
      `}
      style={{ backgroundColor: 'rgba(5, 5, 15, 0.7)' }}
    >
      {/* ─── Logo ─── */}
      <div className="flex items-center gap-3 px-5 h-20 border-b border-white/[0.06] flex-shrink-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] relative overflow-hidden border border-purple-400/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white drop-shadow-md">
            <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zM9.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="currentColor"/>
          </svg>
        </div>
        {isOpen && (
          <div className="flex flex-col min-w-0">
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">SQLBot</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">AI Assistant</span>
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar flex flex-col gap-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.name} item={item} isOpen={isOpen} />
        ))}
      </nav>

      {/* ─── AI Illustration ─── */}
      {isOpen && (
        <div className="mx-4 mb-4 mt-auto">
          <div className="relative w-full h-32 rounded-2xl bg-gradient-to-b from-purple-900/20 to-black border border-purple-500/20 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)] group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center relative z-10 border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all duration-500">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                <path d="M12 2a2 2 0 0 1 2 2v2h3a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2zM9.5 12a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" fill="currentColor"/>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-purple-600/20 to-transparent blur-xl"></div>
            <div className="absolute bottom-0 w-[80%] h-[2px] bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,1)]"></div>
          </div>
        </div>
      )}

      {/* ─── User Profile ─── */}
      <div className={`mx-4 mb-6 p-2.5 bg-black/40 rounded-2xl border border-white/[0.05] flex items-center gap-3 transition-all cursor-pointer hover:bg-white/[0.05] shadow-xl ${!isOpen ? 'mx-2 p-2 justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)] border border-purple-400/30 relative">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=transparent&color=fff&bold=true" alt="User" className="w-full h-full object-cover rounded-full opacity-90" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        </div>
        {isOpen && (
          <>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-bold text-white truncate tracking-tight">Admin User</span>
              <span className="text-[11px] font-medium text-slate-400 truncate mt-0.5">admin@sqlbot.com</span>
            </div>
            <HiEllipsisVertical size={18} className="text-slate-500 hover:text-white" />
          </>
        )}
      </div>

      {/* ─── Toggle ─── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-24 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] hover:scale-110 transition-transform z-50 border border-purple-400"
      >
        {isOpen ? <HiChevronLeft size={14} /> : <HiChevronRight size={14} />}
      </button>
    </div>
  );
};

export default Sidebar;
