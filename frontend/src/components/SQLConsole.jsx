import React, { useState, useEffect, useRef } from 'react';
import { HiPlay, HiDocumentText, HiArrowDownTray, HiArrowPath, HiChevronDown, HiCircleStack, HiCheck } from 'react-icons/hi2';
import { executeSQL, getDatabases, switchDatabase } from '../services/api';

const SQLConsole = () => {
  const [activeTab, setActiveTab] = useState('Results');
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const [query, setQuery] = useState(`SELECT * FROM employees LIMIT 10;`);

  // --- Database Selector State ---
  const [databases, setDatabases] = useState([]);
  const [currentDb, setCurrentDb] = useState('');
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [switchingDb, setSwitchingDb] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch databases on mount
  useEffect(() => {
    const fetchDatabases = async () => {
      setLoadingDbs(true);
      try {
        const { data } = await getDatabases();
        setDatabases(data.databases || []);
        setCurrentDb(data.currentDatabase || '');
      } catch (err) {
        console.error('Failed to fetch databases:', err);
      } finally {
        setLoadingDbs(false);
      }
    };
    fetchDatabases();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDbDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchDatabase = async (dbName) => {
    if (dbName === currentDb || switchingDb) return;
    setSwitchingDb(true);
    setDbDropdownOpen(false);
    try {
      await switchDatabase(dbName);
      setCurrentDb(dbName);
      setExecutionResult(null);
    } catch (err) {
      console.error('Failed to switch database:', err);
    } finally {
      setSwitchingDb(false);
    }
  };

  const handleExecute = async () => {
    if (!query.trim()) return;
    setExecuting(true);
    setActiveTab('Results');
    try {
      const { data } = await executeSQL(query);
      setExecutionResult({
        success: true,
        data: data.data || [],
        fields: data.fields || [],
        duration: data.duration || '0 ms',
        rowCount: data.rowCount || 0
      });
    } catch (err) {
      setExecutionResult({
        success: false,
        error: err.response?.data?.error || err.message || 'Execution failed'
      });
    } finally {
      setExecuting(false);
    }
  };

  // Export results to CSV
  const handleExportCSV = () => {
    if (!executionResult?.success || !executionResult.data?.length) return;
    const fields = executionResult.fields.map(f => f.name);
    const header = fields.join(',');
    const rows = executionResult.data.map(row =>
      fields.map(f => {
        const val = row[f] === null || row[f] === undefined ? '' : String(row[f]);
        // Wrap in quotes if contains comma, newline or quote
        return val.includes(',') || val.includes('\n') || val.includes('"')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${new Date().toISOString().slice(0,19).replace(/[T:]/g,'-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format SQL — proper beautifier: uppercase keywords + structured line breaks
  const handleFormat = () => {
    if (!query.trim()) return;

    // Step 1: Uppercase all SQL keywords
    const keywords = [
      'SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN',
      'FULL JOIN','CROSS JOIN','ON','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET',
      'INSERT INTO','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE TABLE',
      'CREATE','TABLE','ALTER TABLE','ALTER','DROP TABLE','DROP','INDEX','DISTINCT',
      'AS','AND','OR','NOT','IN','IS','NULL','IS NOT NULL','IS NULL','LIKE','BETWEEN',
      'EXISTS','UNION ALL','UNION','ALL','COUNT','SUM','AVG','MIN','MAX',
      'CASE','WHEN','THEN','ELSE','END','ASC','DESC','WITH','RETURNING'
    ];

    // Sort by length (longest first) to avoid partial replacement
    const sortedKw = [...keywords].sort((a, b) => b.length - a.length);
    let sql = query;
    sortedKw.forEach(kw => {
      const re = new RegExp(`\\b${kw.replace(/ /g, '\\s+')}\\b`, 'gi');
      sql = sql.replace(re, kw);
    });

    // Step 2: Normalize whitespace
    sql = sql.replace(/\s+/g, ' ').trim();

    // Step 3: Break before major clauses onto new lines
    const clauseBreaks = [
      'SELECT','FROM','WHERE','LEFT JOIN','RIGHT JOIN','INNER JOIN','FULL JOIN',
      'CROSS JOIN','OUTER JOIN','JOIN','ON','GROUP BY','ORDER BY','HAVING',
      'LIMIT','OFFSET','UNION ALL','UNION','INSERT INTO','VALUES','UPDATE','SET','DELETE'
    ];
    clauseBreaks.forEach(kw => {
      const re = new RegExp(`\\s*\\b${kw.replace(/ /g, '\\s+')}\\b\\s*`, 'g');
      sql = sql.replace(re, `\n${kw} `);
    });

    // Step 4: Indent columns in SELECT (split by comma at top level)
    sql = sql.replace(/\nSELECT (.+?)(?=\nFROM|\n|$)/s, (match, cols) => {
      // Split cols by commas NOT inside parentheses
      const parts = [];
      let depth = 0, current = '';
      for (const ch of cols) {
        if (ch === '(') { depth++; current += ch; }
        else if (ch === ')') { depth--; current += ch; }
        else if (ch === ',' && depth === 0) {
          parts.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      if (current.trim()) parts.push(current.trim());
      return parts.length > 1
        ? `\nSELECT\n  ${parts.join(',\n  ')}`
        : `\nSELECT ${parts[0] || ''}`;
    });

    // Step 5: Indent AND/OR in WHERE
    sql = sql.replace(/\n(WHERE .+)/gs, (match) =>
      match.replace(/\s+(AND|OR)\s+/g, '\n  $1 ')
    );

    // Step 6: Clean up leading newline and extra spaces
    sql = sql.replace(/^\n+/, '').replace(/  +/g, ' ').trimEnd();

    setQuery(sql);
  };


  // Clear editor & results
  const handleClear = () => {
    setQuery('');
    setExecutionResult(null);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1400px] mx-auto p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">SQL Console</h1>
          <p className="text-[15px] text-slate-400 mt-1">Write, run and analyze your SQL queries.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* --- Functional DB Selector --- */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="db-selector-btn"
              onClick={() => setDbDropdownOpen(prev => !prev)}
              disabled={loadingDbs || switchingDb}
              className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a1a] border border-white/[0.1] rounded-xl w-56 cursor-pointer hover:bg-white/[0.05] transition-colors disabled:opacity-60"
            >
              <div className="flex items-center gap-2 min-w-0">
                {switchingDb ? (
                  <HiArrowPath className="animate-spin text-purple-400 flex-shrink-0" size={14} />
                ) : (
                  <HiCircleStack className="text-purple-400 flex-shrink-0" size={14} />
                )}
                <span className="text-[13px] font-semibold text-slate-200 truncate">
                  {loadingDbs ? 'Loading...' : currentDb || 'Select DB'}
                </span>
              </div>
              <HiChevronDown
                className={`text-slate-500 flex-shrink-0 transition-transform ${dbDropdownOpen ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>

            {/* Dropdown Menu */}
            {dbDropdownOpen && !loadingDbs && (
              <div className="absolute right-0 mt-2 w-64 z-50 bg-[#0d0d20] border border-white/[0.08] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in">
                <div className="px-4 py-2.5 border-b border-white/[0.05]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Switch Database</span>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar py-1.5">
                  {databases.length === 0 ? (
                    <div className="px-4 py-3 text-[13px] text-slate-500">No databases found</div>
                  ) : (
                    databases.map((db) => (
                      <button
                        key={db}
                        onClick={() => handleSwitchDatabase(db)}
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 text-[13px] transition-colors cursor-pointer ${
                          db === currentDb
                            ? 'text-purple-400 bg-purple-600/10'
                            : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <HiCircleStack size={13} className={db === currentDb ? 'text-purple-400' : 'text-slate-500'} />
                          <span className="truncate font-medium">{db}</span>
                        </div>
                        {db === currentDb && <HiCheck size={14} className="text-purple-400 flex-shrink-0" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={async () => {
              setLoadingDbs(true);
              try {
                const { data } = await getDatabases();
                setDatabases(data.databases || []);
                setCurrentDb(data.currentDatabase || currentDb);
              } catch (e) {
                console.error(e);
              } finally {
                setLoadingDbs(false);
              }
            }}
            className="w-[42px] h-[42px] flex items-center justify-center bg-[#0a0a1a] border border-white/[0.1] rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Refresh database list"
          >
            <HiArrowPath size={18} className={loadingDbs ? 'animate-spin text-purple-400' : ''} />
          </button>
          <button onClick={handleExecute} disabled={executing} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center gap-2">
            {executing ? <HiArrowPath className="animate-spin" /> : <HiPlay />}
            Run Query
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        
        {/* Editor Box */}
        <div className="flex-shrink-0 bg-[#070712] border border-white/[0.05] rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex min-h-[220px] bg-[#0a0a1a] font-mono text-[14px]">
            <div className="flex flex-col text-slate-600 py-4 px-4 text-right select-none border-r border-white/[0.05] space-y-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <div key={num}>{num}</div>)}
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-purple-200 p-4 outline-none resize-none leading-relaxed focus:bg-white/[0.01] transition-colors"
              spellCheck="false"
            />
          </div>
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.05] bg-[#050510]">
            <div className="flex items-center gap-3">
              <button onClick={handleExecute} disabled={executing} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-[13px] font-bold hover:bg-purple-600/30 transition-colors">
                <HiPlay size={16} /> Run Query
              </button>
              <button onClick={handleFormat} className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] text-slate-300 border border-white/[0.1] rounded-lg text-[13px] font-bold hover:bg-white/[0.1] transition-colors">
                <HiDocumentText size={16} /> Format
              </button>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleClear} className="text-slate-400 hover:text-white text-[13px] font-bold transition-colors">Clear</button>
              <button className="text-slate-400 hover:text-white text-[13px] font-bold transition-colors">Save</button>
            </div>
          </div>
        </div>

        {/* Results Box */}
        <div className="flex-1 bg-[#070712] border border-white/[0.05] rounded-3xl shadow-2xl flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-8 px-6 pt-4 border-b border-white/[0.05] bg-[#0a0a1a]">
            {['Results', 'Query History'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-[13px] font-bold tracking-wide relative transition-colors ${
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

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {executionResult ? (
              executionResult.success ? (
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-[#050510] border-b border-white/[0.05] sticky top-0 z-10">
                    <tr>
                      {executionResult.fields?.map(f => (
                        <th key={f.name} className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{f.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {executionResult.data?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        {executionResult.fields?.map(f => (
                          <td key={f.name} className="px-6 py-3.5 text-[13px] text-slate-200">{String(row[f.name])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center h-full text-rose-400">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 w-full max-w-2xl">
                    <p className="font-bold mb-2">Error executing query:</p>
                    <p className="text-sm font-mono whitespace-pre-wrap">{executionResult.error}</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                Execute a query to see results here.
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-3 bg-[#050510] border-t border-white/[0.05]">
            <div className="flex items-center gap-2">
              {executionResult?.success ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[12px] font-medium text-emerald-400">Query executed successfully in {executionResult.duration}</span>
                </>
              ) : executionResult?.error ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                  <span className="text-[12px] font-medium text-rose-400">Query failed</span>
                </>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              {executionResult?.success && (
                <span className="text-[12px] font-medium text-slate-400">{executionResult.rowCount} rows returned</span>
              )}
              <button
                onClick={handleExportCSV}
                disabled={!executionResult?.success || !executionResult.data?.length}
                title="Export results as CSV"
                className="text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <HiArrowDownTray size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SQLConsole;
