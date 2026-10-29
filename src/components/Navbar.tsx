import React from 'react';
import { Receipt, Sparkles, RefreshCw, Upload, Users, HelpCircle, FileText } from 'lucide-react';
import { Person, ReceiptData } from '../types/bill';

interface NavbarProps {
  receipt: ReceiptData | null;
  people: Person[];
  activeModel: string;
  onOpenUpload: () => void;
  onReset: () => void;
  onOpenPeopleModal: () => void;
  onLoadSample: (sampleId: string) => void;
  mobileView: 'split' | 'receipt' | 'chat';
  setMobileView: (view: 'split' | 'receipt' | 'chat') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  receipt,
  people,
  activeModel,
  onOpenUpload,
  onReset,
  onOpenPeopleModal,
  onLoadSample,
  mobileView,
  setMobileView,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                SplitRight
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Split-Screen Receipt Parser & Smart Chat Assistant
            </p>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setMobileView('receipt')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mobileView === 'receipt'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Receipt
          </button>
          <button
            onClick={() => setMobileView('chat')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              mobileView === 'chat'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Chat & Split
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Active Model Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              {activeModel.replace('gemini-', '')}
            </span>
          </div>

          {/* People Count button */}
          <button
            onClick={onOpenPeopleModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
            title="Manage People"
          >
            <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{people.length} People</span>
          </button>

          {/* Upload receipt button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-600/20 active:scale-95 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Receipt</span>
            <span className="sm:hidden">Scan</span>
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset bill and assignments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
