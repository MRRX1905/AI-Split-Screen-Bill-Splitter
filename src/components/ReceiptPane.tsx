import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  Sparkles,
  ChevronDown,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Coffee,
  Pizza,
  Utensils
} from 'lucide-react';
import { Person, ReceiptData, ReceiptItem } from '../types/bill';
import { ItemRow } from './ItemRow';
import { formatCurrency } from '../utils/calculator';
import { SAMPLE_RECEIPTS } from '../data/sampleReceipts';

interface ReceiptPaneProps {
  receipt: ReceiptData;
  people: Person[];
  onUpdateReceipt: (updates: Partial<ReceiptData>) => void;
  onAssignPerson: (itemId: string, personId: string) => void;
  onUnassignPerson: (itemId: string, personId: string) => void;
  onAssignAllPeople: (itemId: string) => void;
  onClearItemAssignments: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<ReceiptItem>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddItem: (item: Partial<ReceiptItem>) => void;
  onLoadSample: (sampleId: string) => void;
  onOpenUpload: () => void;
}

export const ReceiptPane: React.FC<ReceiptPaneProps> = ({
  receipt,
  people,
  onUpdateReceipt,
  onAssignPerson,
  onUnassignPerson,
  onAssignAllPeople,
  onClearItemAssignments,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onLoadSample,
  onOpenUpload,
}) => {
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemCategory, setNewItemCategory] = useState('Food');
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const items = receipt.items || [];
  const totalItems = items.length;
  const assignedItemsCount = items.filter(
    (it) => (it.assignedPersonIds || []).length > 0
  ).length;
  const percentAssigned = totalItems > 0 ? Math.round((assignedItemsCount / totalItems) * 100) : 0;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newItemPrice);
    const qty = parseInt(newItemQty, 10) || 1;
    if (newItemName.trim() && !isNaN(price)) {
      onAddItem({
        name: newItemName.trim(),
        quantity: qty,
        unitPrice: price / qty,
        totalPrice: price,
        category: newItemCategory,
        assignedPersonIds: [],
        shares: {},
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQty('1');
      setShowAddItem(false);
    }
  };

  const setTipPercent = (percent: number) => {
    const tipAmount = Math.round(receipt.subtotal * (percent / 100) * 100) / 100;
    onUpdateReceipt({
      tipPercent: percent,
      tip: tipAmount,
      total: receipt.subtotal + receipt.tax + tipAmount,
    });
  };

  const setTaxPercent = (percent: number) => {
    const taxAmount = Math.round(receipt.subtotal * (percent / 100) * 100) / 100;
    onUpdateReceipt({
      taxPercent: percent,
      tax: taxAmount,
      total: receipt.subtotal + taxAmount + receipt.tip,
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Top Banner / Merchant info */}
      <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                <Receipt className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                {receipt.restaurantName || 'Receipt'}
              </h2>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {receipt.date || 'Today'}
              </span>
              {receipt.notes && (
                <span className="truncate border-l border-slate-200 dark:border-slate-700 pl-3">
                  {receipt.notes}
                </span>
              )}
            </div>
          </div>

          {/* Quick switcher for sample receipts & upload */}
          <div className="relative flex items-center gap-1.5">
            <button
              onClick={() => setShowSampleMenu(!showSampleMenu)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="Select a sample receipt"
            >
              <span>Samples</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showSampleMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Load Pre-Built Receipts
                </div>
                {SAMPLE_RECEIPTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onLoadSample(s.id);
                      setShowSampleMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                  >
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{s.tagline}</div>
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowSampleMenu(false);
                      onOpenUpload();
                    }}
                    className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Upload your own photo...</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
              {percentAssigned === 100 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    All items assigned!
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {assignedItemsCount} of {totalItems} items assigned
                  </span>
                </>
              )}
            </span>
            <span className="text-slate-500 font-semibold">{percentAssigned}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                percentAssigned === 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 to-emerald-500'
              }`}
              style={{ width: `${percentAssigned}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scrollable Receipt Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          <span>Items & Prices</span>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Add item inline form */}
        {showAddItem && (
          <form
            onSubmit={handleAddItem}
            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-sm space-y-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Item name (e.g., Garlic Fries)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                autoFocus
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-20 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="Food">Food</option>
                <option value="Drinks">Drinks</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Dessert">Dessert</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddItem(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
              >
                Add Item
              </button>
            </div>
          </form>
        )}

        {/* Item Rows */}
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            currency={receipt.currency}
            people={people}
            onAssignPerson={onAssignPerson}
            onUnassignPerson={onUnassignPerson}
            onAssignAllPeople={onAssignAllPeople}
            onClearAssignments={onClearItemAssignments}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
          />
        ))}

        {items.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No items in this receipt
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Scan a receipt image with Gemini or pick a sample receipt to test!
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
              >
                Upload Photo
              </button>
              <button
                onClick={() => onLoadSample(SAMPLE_RECEIPTS[0].id)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200"
              >
                Load Sample
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Financial Totals (Tax, Tip, Subtotal) */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg shrink-0">
        <div className="space-y-2 text-xs">
          {/* Subtotal */}
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span>Items Subtotal</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCurrency(receipt.subtotal, receipt.currency)}
            </span>
          </div>

          {/* Tax row with interactive percentage */}
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Sales Tax</span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {receipt.taxPercent}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(receipt.tax, receipt.currency)}
              </span>
            </div>
          </div>

          {/* Tip row with interactive quick pills */}
          <div className="pt-1">
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 mb-1.5">
              <div className="flex items-center gap-1">
                <span>Tip / Gratuity</span>
                <span className="text-[10px] text-slate-400">
                  (Split proportionally)
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(receipt.tip, receipt.currency)}
              </span>
            </div>

            {/* Quick tip buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {[0, 15, 18, 20, 25].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setTipPercent(pct)}
                  className={`py-1 rounded-md text-[11px] font-semibold transition ${
                    receipt.tipPercent === pct
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pct === 0 ? 'No Tip' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
            <div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Grand Total
              </span>
              <span className="text-[10px] text-slate-400 ml-1.5">
                (Subtotal + Tax + Tip)
              </span>
            </div>
            <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
              {formatCurrency(receipt.total, receipt.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
