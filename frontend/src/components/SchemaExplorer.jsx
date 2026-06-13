import React, { useState, useEffect, useRef } from 'react';
import { HiCircleStack, HiTableCells, HiChevronRight, HiChevronDown, HiArrowPath, HiMagnifyingGlass } from 'react-icons/hi2';
import { getTables, getTableSchema, getDatabases, switchDatabase } from '../services/api';

const SchemaExplorer = () => {
  const [tables, setTables] = useState([]);
  const [activeTable, setActiveTable] = useState(null);
  const [activeTab, setActiveTab] = useState('Columns');
  const [schema, setSchema] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [databases, setDatabases] = useState([]);
  const [activeDatabase, setActiveDatabase] = useState('sqlbot_db');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchDatabases();
    fetchTables();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDatabases = async () => {
    try {
      const { data } = await getDatabases();
      setDatabases(data.databases || []);
      if (data.currentDatabase) {
        setActiveDatabase(data.currentDatabase);
      }
    } catch (err) {
      console.error('Failed to fetch databases:', err);
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const { data } = await getTables();
      setTables(data.tables || []);
      if (data.tables?.length > 0 && !activeTable) {
        handleTableSelect(data.tables[0]);
      }
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseSelect = async (dbName) => {
    setDropdownOpen(false);
    setLoading(true);
    try {
      await switchDatabase(dbName);
      setActiveDatabase(dbName);
      setActiveTable(null);
      setSchema([]);
      const { data } = await getTables();
      setTables(data.tables || []);
      if (data.tables?.length > 0) {
        handleTableSelect(data.tables[0]);
      }
    } catch (err) {
      console.error('Failed to switch database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = async (tableName) => {
    setActiveTable(tableName);
    setLoading(true);
    try {
      const { data } = await getTableSchema(tableName);
      setSchema(data.schema || []);
    } catch (err) {
      console.error('Failed to fetch schema:', err);
      setSchema([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tables.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Schema Explorer</h1>
          <p className="text-[15px] text-slate-400 mt-1">Explore your database schema, tables, columns and relationships.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a1a] border border-white/[0.1] rounded-xl w-56 cursor-pointer hover:bg-white/[0.05] transition-colors text-left"
            >
              <span className="text-[13px] font-semibold text-slate-200 truncate">{activeDatabase}</span>
              <HiChevronDown className={`text-slate-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} size={16} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0a0a1a]/95 backdrop-blur-md border border-white/[0.1] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                {databases.length > 0 ? (
                  databases.map(dbName => (
                    <button
                      key={dbName}
                      onClick={() => handleDatabaseSelect(dbName)}
                      className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                        activeDatabase === dbName 
                          ? 'bg-purple-600/20 text-purple-400 font-bold border-l-2 border-purple-500' 
                          : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                      }`}
                    >
                      {dbName}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2.5 text-[13px] text-slate-500">No databases found</div>
                )}
              </div>
            )}
          </div>
          <button onClick={fetchTables} className="w-[42px] h-[42px] flex items-center justify-center bg-[#0a0a1a] border border-white/[0.1] rounded-xl text-slate-400 hover:text-white hover:border-purple-500/50 transition-colors shadow-lg shadow-black">
            <HiArrowPath size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[320px] flex flex-col bg-[#070712] border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden shrink-0">
          <div className="p-5 border-b border-white/[0.05] bg-[#0a0a1a]">
            <h2 className="text-[18px] font-bold text-white tracking-tight mb-4">Tables</h2>
            <div className="flex items-center gap-3 bg-black/40 border border-white/[0.1] rounded-xl px-4 py-2.5 focus-within:border-purple-500/50 transition-colors">
              <HiMagnifyingGlass className="text-slate-500" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tables..." 
                className="bg-transparent border-none outline-none text-[13px] text-white w-full placeholder:text-slate-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {filteredTables.map(table => (
              <button
                key={table}
                onClick={() => handleTableSelect(table)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  activeTable === table 
                    ? 'bg-purple-600/[0.15] border border-purple-500/30 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]' 
                    : 'bg-transparent border border-transparent hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <HiTableCells size={18} className={activeTable === table ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className={`font-semibold text-[13px] ${activeTable === table ? 'text-purple-100' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {table}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#070712] border border-white/[0.05] rounded-3xl shadow-2xl overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-[#070712]/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <HiArrowPath size={32} className="text-purple-500 animate-spin" />
            </div>
          )}
          
          {activeTable ? (
            <>
              <div className="p-6 md:p-8 border-b border-white/[0.05] bg-[#0a0a1a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{activeTable}</h2>
                  <p className="text-[13px] text-slate-400 mt-1">Stores {activeTable.replace(/_/g, ' ')} information</p>
                </div>
            <button className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
              View Relationships
            </button>
          </div>

          <div className="flex items-center gap-8 px-8 border-b border-white/[0.05] bg-[#0a0a1a]">
            {['Columns', 'Relationships', 'Indexes'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-[13px] font-bold tracking-wide relative transition-colors ${
                  activeTab === tab ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#050510] border-b border-white/[0.05] sticky top-0 z-10">
                <tr>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Column Name</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data Type</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nullable</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Key</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Default</th>
                  <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Extra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {schema.map((col, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 text-[13px] font-semibold text-slate-200">{col.Field || col.name}</td>
                    <td className="px-8 py-4 text-[13px] font-mono text-purple-300">{col.Type || col.type}</td>
                    <td className="px-8 py-4 text-[13px] text-slate-400">{col.Null || col.nullable}</td>
                    <td className="px-8 py-4 text-[13px] text-slate-400">{col.Key || col.key}</td>
                    <td className="px-8 py-4 text-[13px] text-slate-400">{col.Default !== null ? col.Default : '-'}</td>
                    <td className="px-8 py-4 text-[13px] text-slate-400">{col.Extra || col.extra || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Relationships Section */}
            <div className="mt-8 px-8 pb-8">
              <h3 className="text-[16px] font-bold text-white tracking-tight mb-4">Table Relationships</h3>
              <div className="flex items-center gap-4 bg-[#0a0a1a] border border-white/[0.05] p-4 rounded-xl w-fit">
                <span className="text-[13px] font-mono text-slate-300">users.subscription_id</span>
                <HiChevronRight size={16} className="text-slate-500" />
                <span className="text-[13px] font-mono text-slate-300">subscriptions.plan_id</span>
                <HiChevronRight size={16} className="text-slate-500" />
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold rounded">Many-to-One</span>
              </div>
            </div>
          </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
              <HiCircleStack size={64} className="text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Table Selected</h3>
              <p className="text-sm text-slate-400">Select a table from the sidebar to view its schema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaExplorer;
