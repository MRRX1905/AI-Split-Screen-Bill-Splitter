import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Edit2, Check, UserPlus } from 'lucide-react';
import { Person } from '../types/bill';
import { PERSON_COLORS } from '../utils/calculator';

interface PersonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onAddPerson: (name: string) => void;
  onRemovePerson: (personId: string) => void;
  onUpdatePerson: (personId: string, name: string) => void;
}

const QUICK_SUGGESTIONS = ['Dhruv', 'Sarah', 'Sue', 'Alex', 'Maya', 'Jordan', 'Chris', 'Taylor'];

export const PersonManagerModal: React.FC<PersonManagerModalProps> = ({
  isOpen,
  onClose,
  people,
  onAddPerson,
  onRemovePerson,
  onUpdatePerson,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      onAddPerson(newName.trim());
      setNewName('');
    }
  };

  const handleStartEdit = (p: Person) => {
    setEditingId(p.id);
    setEditingName(p.name);
  };

  const handleSaveEdit = (personId: string) => {
    if (editingName.trim()) {
      onUpdatePerson(personId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Dining Party ({people.length})
              </h3>
              <p className="text-xs text-slate-500">
                Manage members sharing the bill
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Add form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Add friend's name (e.g. Dhruv)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 disabled:opacity-40 flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Quick suggestions */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Quick Suggestions:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_SUGGESTIONS.filter(
                (name) => !people.some((p) => p.name.toLowerCase() === name.toLowerCase())
              ).map((name) => (
                <button
                  key={name}
                  onClick={() => onAddPerson(name)}
                  className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* List of current members */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Members:
            </div>
            {people.map((person) => {
              const isEditing = editingId === person.id;
              return (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(person.id)}
                        className="p-1 rounded bg-emerald-600 text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: person.color }}
                      />
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {person.name}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(person)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemovePerson(person.id)}
                      className="p-1 text-slate-400 hover:text-red-500"
                      title="Remove person"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {people.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 italic">
                No members in the party yet.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
