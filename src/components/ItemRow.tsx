import React, { useState } from 'react';
import { UserCheck, UserPlus, X, Edit2, Check, Trash2, Split } from 'lucide-react';
import { Person, ReceiptItem } from '../types/bill';
import { formatCurrency } from '../utils/calculator';

interface ItemRowProps {
  item: ReceiptItem;
  currency: string;
  people: Person[];
  onAssignPerson: (itemId: string, personId: string) => void;
  onUnassignPerson: (itemId: string, personId: string) => void;
  onAssignAllPeople: (itemId: string) => void;
  onClearAssignments: (itemId: string) => void;
  onUpdateItem: (itemId: string, updates: Partial<ReceiptItem>) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  currency,
  people,
  onAssignPerson,
  onUnassignPerson,
  onAssignAllPeople,
  onClearAssignments,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editPrice, setEditPrice] = useState(item.totalPrice.toString());
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  const assignedPeople = (item.assignedPersonIds || [])
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as Person[];

  const isAssigned = assignedPeople.length > 0;
  const isFullySplitAll = people.length > 0 && assignedPeople.length === people.length;

  const handleSaveEdit = () => {
    const numPrice = parseFloat(editPrice);
    if (!isNaN(numPrice) && editName.trim()) {
      onUpdateItem(item.id, {
        name: editName.trim(),
        totalPrice: numPrice,
        unitPrice: item.quantity > 0 ? numPrice / item.quantity : numPrice,
      });
    }
    setIsEditing(false);
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'drinks':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'appetizer':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'dessert':
        return 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-900';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div
      className={`group relative p-3 rounded-xl border transition-all duration-150 ${
        isAssigned
          ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Item details */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 text-sm font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-20 text-sm font-semibold px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <button
                onClick={handleSaveEdit}
                className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {item.quantity > 1 && (
                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {item.quantity}×
                  </span>
                )}
                <span className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-snug">
                  {item.name}
                </span>
                {item.category && (
                  <span
                    className={`text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded border ${getCategoryColor(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                )}
              </div>

              {/* Assigned chips */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {assignedPeople.map((p) => {
                  const weight = item.shares?.[p.id] ?? 1;
                  const totalWeights = assignedPeople.reduce(
                    (sum, person) => sum + (item.shares?.[person.id] ?? 1),
                    0
                  );
                  const fraction =
                    assignedPeople.length > 1
                      ? weight === 1 && totalWeights === assignedPeople.length
                        ? `1/${assignedPeople.length}`
                        : `${Math.round((weight / totalWeights) * 100)}%`
                      : null;

                  return (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${p.accentBg}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      <span>{p.name}</span>
                      {fraction && (
                        <span className="opacity-75 text-[10px]">({fraction})</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassignPerson(item.id, p.id);
                        }}
                        className="hover:opacity-100 opacity-60 ml-0.5"
                        title={`Remove ${p.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}

                {!isAssigned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Unassigned
                  </span>
                )}

                {/* Quick assign button */}
                <div className="relative">
                  <button
                    onClick={() => setShowAssignMenu(!showAssignMenu)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Assign</span>
                  </button>

                  {/* Dropdown list of people */}
                  {showAssignMenu && (
                    <div
                      className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/60">
                        Assign to...
                      </div>

                      {people.length > 0 && (
                        <button
                          onClick={() => {
                            onAssignAllPeople(item.id);
                            setShowAssignMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <Split className="w-3.5 h-3.5 text-emerald-500" />
                            Split Everyone ({people.length})
                          </span>
                          {isFullySplitAll && (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </button>
                      )}

                      {people.map((p) => {
                        const isAlreadyAssigned = (item.assignedPersonIds || []).includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (isAlreadyAssigned) {
                                onUnassignPerson(item.id, p.id);
                              } else {
                                onAssignPerson(item.id, p.id);
                              }
                            }}
                            className="w-full text-left px-2.5 py-1.5 flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <span className="flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              <span>{p.name}</span>
                            </span>
                            {isAlreadyAssigned && (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </button>
                        );
                      })}

                      {isAssigned && (
                        <div className="border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1">
                          <button
                            onClick={() => {
                              onClearAssignments(item.id);
                              setShowAssignMenu(false);
                            }}
                            className="w-full text-left px-2.5 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px]"
                          >
                            Clear All
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price & item actions */}
        <div className="flex items-center gap-2 text-right">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {formatCurrency(item.totalPrice, currency)}
            {item.quantity > 1 && (
              <div className="text-[10px] font-normal text-slate-400">
                {formatCurrency(item.unitPrice, currency)} each
              </div>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              onClick={() => {
                setEditName(item.name);
                setEditPrice(item.totalPrice.toString());
                setIsEditing(true);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
              title="Edit item"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteItem(item.id)}
              className="p-1 text-slate-400 hover:text-red-500 rounded"
              title="Delete item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
