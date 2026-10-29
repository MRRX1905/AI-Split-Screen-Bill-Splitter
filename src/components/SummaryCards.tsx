import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Receipt,
  Share2,
  DollarSign,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BillSplitCalculation, Person, ReceiptData } from '../types/bill';
import { formatCurrency } from '../utils/calculator';

interface SummaryCardsProps {
  calculation: BillSplitCalculation;
  receipt: ReceiptData;
  people: Person[];
  onOpenPeopleModal: () => void;
  onSplitRemainingEqually: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  calculation,
  receipt,
  people,
  onOpenPeopleModal,
  onSplitRemainingEqually,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

  const {
    peopleSummaries,
    unassignedSubtotal,
    unassignedItems,
    isFullyAssigned,
    receiptSubtotal,
    taxTotal,
    tipTotal,
    grandTotal,
  } = calculation;

  const triggerCelebration = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCopyBreakdown = () => {
    let text = `🧾 Bill Breakdown: ${receipt.restaurantName || 'Dining Out'}\n`;
    text += `Subtotal: ${formatCurrency(receiptSubtotal, receipt.currency)} | Tax: ${formatCurrency(taxTotal, receipt.currency)} | Tip: ${formatCurrency(tipTotal, receipt.currency)}\n`;
    text += `Total: ${formatCurrency(grandTotal, receipt.currency)}\n\n`;
    text += `👥 Who Owes What (Tax & Tip Proportional):\n`;

    peopleSummaries.forEach((s) => {
      text += `\n• ${s.person.name}: ${formatCurrency(s.totalOwed, receipt.currency)}\n`;
      text += `  Items: ${formatCurrency(s.itemsSubtotal, receipt.currency)} + Tax: ${formatCurrency(s.proportionalTax, receipt.currency)} + Tip: ${formatCurrency(s.proportionalTip, receipt.currency)}\n`;
      s.items.forEach((it) => {
        const frac = it.fraction < 1 ? ` (${Math.round(it.fraction * 100)}%)` : '';
        text += `  - ${it.itemName}${frac}: ${formatCurrency(it.amount, receipt.currency)}\n`;
      });
    });

    if (unassignedSubtotal > 0) {
      text += `\n⚠️ Unassigned Items (${formatCurrency(unassignedSubtotal, receipt.currency)}):\n`;
      unassignedItems.forEach((it) => {
        text += `  - ${it.name}: ${formatCurrency(it.totalPrice, receipt.currency)}\n`;
      });
    }

    text += `\nSplit with SplitRight AI ⚡`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    triggerCelebration();
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <Users className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Who Owes What</span>
              {isFullyAssigned && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                  Fully Split
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tax ({receipt.taxPercent}%) & Tip ({receipt.tipPercent}%) split proportionally by spend
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyBreakdown}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-sm"
            title="Copy breakdown formatted for WhatsApp or iMessage"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unassigned Warning Banner */}
      {!isFullyAssigned && unassignedSubtotal > 0 && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-semibold">{formatCurrency(unassignedSubtotal, receipt.currency)}</strong> in unassigned items ({unassignedItems.length} items remaining).
            </span>
          </div>
          {people.length > 0 && (
            <button
              onClick={onSplitRemainingEqually}
              className="px-2 py-0.5 rounded-md bg-amber-600 text-white font-medium text-[11px] hover:bg-amber-500 whitespace-nowrap shadow-xs"
            >
              Split Remainder Equally
            </button>
          )}
        </div>
      )}

      {/* People Summary Cards Grid */}
      {peopleSummaries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {peopleSummaries.map((s) => {
            const isExpanded = expandedPersonId === s.person.id;
            return (
              <div
                key={s.person.id}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition cursor-pointer"
                onClick={() => setExpandedPersonId(isExpanded ? null : s.person.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: s.person.color }}
                    />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">
                      {s.person.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {formatCurrency(s.totalOwed, receipt.currency)}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Sub-breakdown bar */}
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Items: {formatCurrency(s.itemsSubtotal, receipt.currency)}
                  </span>
                  <span>
                    Tax: {formatCurrency(s.proportionalTax, receipt.currency)} • Tip: {formatCurrency(s.proportionalTip, receipt.currency)}
                  </span>
                </div>

                {/* Expanded Item list for this person */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 text-[11px] space-y-1">
                    <div className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Itemized Share:
                    </div>
                    {s.items.length > 0 ? (
                      s.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span className="truncate pr-2">
                            {it.itemName} {it.fraction < 1 && `(${Math.round(it.fraction * 100)}%)`}
                          </span>
                          <span className="font-medium whitespace-nowrap">
                            {formatCurrency(it.amount, receipt.currency)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 italic">No items assigned yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">
            No people added yet. Type commands like <em>"Dhruv had the nachos"</em> or click below!
          </p>
          <button
            onClick={onOpenPeopleModal}
            className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            + Add People to Party
          </button>
        </div>
      )}
    </div>
  );
};
