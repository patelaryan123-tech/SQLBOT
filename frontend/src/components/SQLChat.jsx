import React, { useState, useEffect, useRef } from 'react';
import { HiOutlineSun, HiCheckCircle, HiDocumentDuplicate, HiPaperAirplane, HiArrowPath, HiPaperClip } from 'react-icons/hi2';
import { sendMessage, getChatHistory, clearChatHistory, uploadFile } from '../services/api';

const SQLChat = ({
  messages,
  setMessages,
  inputText,
  setInputText,
  loading,
  setLoading,
  onNewChat
}) => {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const { data } = await uploadFile(formData);
      if (data.success) {
        setInputText(prev => prev + `\n\n[Uploaded Document: ${file.name}]\n${data.text}\n`);
      }
    } catch (err) {
      console.error('Upload error', err);
      setMessages(prev => [...prev, { role: 'assistant', response: 'Failed to upload and parse the document. Ensure backend route is configured properly.', error: true }]);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = { role: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const { data } = await sendMessage(inputText);
      if (data && data.response) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          response: data.response.message || data.response.explanation || data.response.response || '',
          sqlQuery: data.response.sql || data.response.sqlQuery || '',
          queryResult: data.response.queryResult || null
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', response: 'Sorry, I encountered an error communicating with the server.', error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (onNewChat) {
      onNewChat();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1200px] mx-auto px-6 md:px-8 pt-16 pb-6 md:pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Data Intelligence Chat</h1>
          <p className="text-[15px] text-slate-400 mt-1">Interact with your commerce database using natural language.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleClear} className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white font-bold rounded-xl transition-colors text-[13px] whitespace-nowrap">
            + New Chat
          </button>
          <button className="w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center bg-white/[0.06] border border-white/[0.1] rounded-xl text-slate-400 hover:text-white transition-colors">
            <HiOutlineSun size={18} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pb-32">
        {messages.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-16 h-16 rounded-full bg-[#12122a] border border-purple-500/30 flex items-center justify-center mb-4">
              <HiOutlineSun size={32} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">How can I help you?</h3>
            <p className="text-sm text-slate-400">Ask a question about your database to get started.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          msg.role === 'user' ? (
            /* User Message */
            <div key={index} className="flex justify-end w-full animate-slide-up">
              <div className="max-w-[80%] bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl rounded-tr-sm p-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                <p className="text-white text-[15px] font-medium leading-relaxed">
                  {msg.content}
                </p>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <span className="text-[11px] text-purple-200 font-medium">Just now</span>
                  <HiCheckCircle size={14} className="text-purple-300" />
                </div>
              </div>
            </div>
          ) : (
            /* AI Message */
            <div key={index} className="flex justify-start w-full animate-slide-up">
              <div className="flex gap-4 max-w-[90%] lg:max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-[#12122a] border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-purple-400">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4h-2zm0 6h2v2h-2z" fill="currentColor"/>
                  </svg>
                </div>
                
                <div className={`flex-1 bg-[#0a0a1a] border border-white/[0.05] rounded-2xl rounded-tl-sm p-5 shadow-xl ${msg.error ? 'border-rose-500/50' : ''}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[13px] font-bold text-white">QueryMind AI</span>
                  </div>
                  <p className="text-slate-300 text-[14px] leading-relaxed mb-4 whitespace-pre-wrap">
                    {msg.response}
                  </p>
                  
                  {/* Code Block */}
                  {msg.sqlQuery && (
                    <div className="relative bg-[#050510] border border-white/[0.05] rounded-xl overflow-hidden mb-5 group">
                      <button className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100" onClick={() => navigator.clipboard.writeText(msg.sqlQuery)}>
                        <HiDocumentDuplicate size={16} />
                      </button>
                      <div className="p-4 font-mono text-[13px] text-purple-300 leading-relaxed overflow-x-auto whitespace-pre">
                        {msg.sqlQuery}
                      </div>
                    </div>
                  )}

                  {/* Execution Success */}
                  {msg.queryResult && msg.queryResult.success && (
                    <div className="flex items-center gap-2 mb-4">
                      <HiCheckCircle size={16} className="text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                      <span className="text-[12px] font-semibold text-slate-300">
                        Query executed successfully ({msg.queryResult.rowCount || (msg.queryResult.data ? msg.queryResult.data.length : 0)} rows returned)
                      </span>
                    </div>
                  )}

                  {/* Data Table */}
                  {msg.queryResult && msg.queryResult.success && msg.queryResult.data && msg.queryResult.data.length > 0 && (
                    <div className="border border-white/[0.05] rounded-xl overflow-hidden overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[13px] min-w-[500px]">
                        <thead className="bg-[#050510] border-b border-white/[0.05]">
                          <tr>
                            {msg.queryResult.fields ? msg.queryResult.fields.map(f => (
                              <th key={f.name} className="px-4 py-3 font-semibold text-slate-400">{f.name}</th>
                            )) : Object.keys(msg.queryResult.data[0]).map(k => (
                              <th key={k} className="px-4 py-3 font-semibold text-slate-400">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02] bg-[#0a0a1a]">
                          {msg.queryResult.data.map((row, rowIdx) => (
                            <tr key={rowIdx} className="hover:bg-white/[0.02]">
                              {(msg.queryResult.fields ? msg.queryResult.fields.map(f => f.name) : Object.keys(row)).map(k => (
                                <td key={k} className="px-4 py-2.5 text-slate-300">{String(row[k])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ))}

        {loading && (
          <div className="flex justify-start w-full animate-slide-up">
            <div className="flex gap-4 max-w-[90%]">
              <div className="w-10 h-10 rounded-full bg-[#12122a] border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                <HiArrowPath className="text-purple-400 animate-spin" size={18} />
              </div>
              <div className="bg-[#0a0a1a] border border-white/[0.05] rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-6 left-6 right-6 md:left-[18rem] md:right-8 z-20">
        <form onSubmit={handleSend} className="flex items-center gap-4 bg-[#0a0a1a]/95 backdrop-blur-xl border border-white/[0.1] rounded-[2rem] p-2 pl-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:border-purple-500/50 transition-colors">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.csv,image/*"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
            title="Attach Document or Image"
          >
            <HiPaperClip size={20} />
          </button>
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about your commerce data..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-slate-500 disabled:opacity-50"
          />
          <button type="submit" disabled={loading || !inputText.trim()} className="w-12 h-12 flex items-center justify-center bg-purple-600 hover:bg-purple-500 text-white rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <HiPaperAirplane size={18} className="transform -rotate-45 ml-1 mb-1" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SQLChat;
