import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Zap,
  CheckCircle,
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Cpu
} from 'lucide-react';
import { ChatMessage, Person, ReceiptData } from '../types/bill';

interface ChatPaneProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeModel: string;
  onSendMessage: (text: string, modelPref?: string) => void;
  people: Person[];
  onOpenPeopleModal: () => void;
  onSelectModel: (model: string) => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  isLoading,
  activeModel,
  onSendMessage,
  people,
  onOpenPeopleModal,
  onSelectModel,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText.trim(), activeModel);
      setInputText('');
    }
  };

  const handleQuickPromptClick = (prompt: string) => {
    if (!isLoading) {
      onSendMessage(prompt, activeModel);
    }
  };

  const insertPersonMention = (name: string) => {
    setInputText((prev) => (prev ? `${prev} ${name}` : `${name} had `));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Chat Sub-Header with Model Selector */}
      <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              SplitRight Assistant
            </span>
            <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">
              Multi-turn natural language bill splitter
            </span>
          </div>
        </div>

        {/* Model preference selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
          <span className="px-1.5 text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-500" />
            Model:
          </span>
          <select
            value={activeModel}
            onChange={(e) => onSelectModel(e.target.value)}
            className="bg-transparent border-0 font-medium text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer text-xs"
          >
            <option value="auto">Auto (Smart Routing)</option>
            <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
            <option value="gemini-4-argon">gemini-4-argon (Complex Splits)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
          </select>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 max-w-2xl ${
                isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs ${
                  isUser
                    ? 'bg-slate-800 dark:bg-slate-700 text-white'
                    : 'bg-emerald-600 text-white shadow-emerald-500/20'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Assistant Model Badge */}
                {!isUser && msg.modelUsed && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{msg.modelUsed}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Applied action chips */}
                {!isUser && msg.appliedActions && msg.appliedActions.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {msg.appliedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick replies provided with assistant message */}
                {!isUser && msg.quickReplies && msg.quickReplies.length > 0 && (
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                    {msg.quickReplies.map((qr, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPromptClick(qr)}
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition active:scale-95"
                      >
                        {qr}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1 ${
                    isUser ? 'text-emerald-100 text-right' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 max-w-md mr-auto">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              <span>Gemini is calculating proportional shares...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* People Quick-Chips Bar */}
      <div className="px-4 py-1.5 bg-white/70 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
          Party:
        </span>
        {people.map((p) => (
          <button
            key={p.id}
            onClick={() => insertPersonMention(p.name)}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            title={`Click to mention ${p.name}`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.name}</span>
          </button>
        ))}
        <button
          onClick={onOpenPeopleModal}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800"
        >
          <PlusCircle className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder='Try "Dhruv had the nachos" or "Sarah & Sue shared the pizza"...'
            disabled={isLoading}
            className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition shadow-sm shadow-emerald-600/20"
            title="Send command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
          <span>Natural language bill assignments powered by Gemini</span>
          <span className="hidden sm:inline">Press Enter ↵</span>
        </div>
      </div>
    </div>
  );
};
