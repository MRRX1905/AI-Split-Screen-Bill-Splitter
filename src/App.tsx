import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ReceiptPane } from './components/ReceiptPane';
import { ChatPane } from './components/ChatPane';
import { SummaryCards } from './components/SummaryCards';
import { ReceiptUploadModal } from './components/ReceiptUploadModal';
import { PersonManagerModal } from './components/PersonManagerModal';
import { Person, ReceiptData, ReceiptItem, ChatMessage } from './types/bill';
import { SAMPLE_RECEIPTS } from './data/sampleReceipts';
import { calculateBillSplit, getPersonColor } from './utils/calculator';

// Initial party members matching user query examples
const INITIAL_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: 'Dhruv',
    ...getPersonColor(0),
  },
  {
    id: 'p-2',
    name: 'Sarah',
    ...getPersonColor(1),
  },
  {
    id: 'p-3',
    name: 'Sue',
    ...getPersonColor(2),
  },
];

export default function App() {
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);
  const [receipt, setReceipt] = useState<ReceiptData>(() =>
    JSON.parse(JSON.stringify(SAMPLE_RECEIPTS[0].data))
  );
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [mobileView, setMobileView] = useState<'split' | 'receipt' | 'chat'>('split');
  const [activeModel, setActiveModel] = useState<string>('auto');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Multi-turn chat message history
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `👋 Welcome to SplitRight! I've loaded your receipt from "${SAMPLE_RECEIPTS[0].name}".\n\nYour party has Dhruv, Sarah, and Sue. You can type natural language commands or click to assign!`,
      timestamp: 'Just now',
      modelUsed: 'gemini-3.8-flash',
      quickReplies: [
        'Sarah and Sue shared the pizza',
        'Dhruv had the pasta & calamari',
        'Split the wine equally between everyone',
        'Add 20% tip',
      ],
    },
  ]);

  // Real-time bill split calculation with proportional tax and tip
  const calculation = useMemo(() => {
    return calculateBillSplit(receipt, people);
  }, [receipt, people]);

  // Load a sample receipt
  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId) || SAMPLE_RECEIPTS[0];
    setReceipt(JSON.parse(JSON.stringify(sample.data)));
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        text: `Loaded receipt for "${sample.name}" (${sample.tagline}). All items are ready for assignment!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
        quickReplies: [
          'Split everything equally',
          'Dhruv had the drinks',
          'Add 18% tip',
        ],
      },
    ]);
  };

  // When a new receipt image is parsed via Gemini
  const handleReceiptParsed = (parsed: ReceiptData) => {
    setReceipt(parsed);
    setMessages((prev) => [
      ...prev,
      {
        id: `scan-${Date.now()}`,
        sender: 'assistant',
        text: `✨ Successfully analyzed receipt from "${parsed.restaurantName}" using gemini-4-argon! Extracted ${parsed.items.length} items totaling ${parsed.currency}${parsed.total.toFixed(2)}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: parsed.notes || 'gemini-4-argon',
        quickReplies: [
          'Who had what?',
          'Split appetizers between everyone',
          'Add 20% tip',
        ],
      },
    ]);
  };

  // Reset bill assignments
  const handleReset = () => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((it) => ({
        ...it,
        assignedPersonIds: [],
        shares: {},
      })),
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: 'Cleared all item assignments. Ready for fresh splitting commands!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ]);
  };

  // People operations
  const handleAddPerson = (name: string): Person => {
    const trimmed = name.trim();
    const existing = people.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newPerson: Person = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      ...getPersonColor(people.length),
    };
    setPeople((prev) => [...prev, newPerson]);
    return newPerson;
  };

  const handleRemovePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    // Remove person from all items
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        assignedPersonIds: (item.assignedPersonIds || []).filter((id) => id !== personId),
      })),
    }));
  };

  const handleUpdatePerson = (personId: string, name: string) => {
    setPeople((prev) =>
      prev.map((p) => (p.id === personId ? { ...p, name: name.trim() } : p))
    );
  };

  // Manual item assignments
  const handleAssignPerson = (itemId: string, personId: string) => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const current = item.assignedPersonIds || [];
        if (current.includes(personId)) return item;
        return {
          ...item,
          assignedPersonIds: [...current, personId],
        };
      }),
    }));
  };

  const handleUnassignPerson = (itemId: string, personId: string) => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignedPersonIds: (item.assignedPersonIds || []).filter((id) => id !== personId),
        };
      }),
    }));
  };

  const handleAssignAllPeople = (itemId: string) => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignedPersonIds: people.map((p) => p.id),
        };
      }),
    }));
  };

  const handleClearItemAssignments = (itemId: string) => {
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          assignedPersonIds: [],
          shares: {},
        };
      }),
    }));
  };

  const handleSplitRemainingEqually = () => {
    if (people.length === 0) return;
    setReceipt((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if ((item.assignedPersonIds || []).length > 0) return item;
        return {
          ...item,
          assignedPersonIds: people.map((p) => p.id),
        };
      }),
    }));
    setMessages((prev) => [
      ...prev,
      {
        id: `split-rem-${Date.now()}`,
        sender: 'assistant',
        text: `Divided all remaining unassigned items equally among ${people.map((p) => p.name).join(', ')}!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'gemini-3.8-flash',
      },
    ]);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<ReceiptItem>) => {
    setReceipt((prev) => {
      const updatedItems = prev.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it));
      const subtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      const tax = Math.round(subtotal * (prev.taxPercent / 100) * 100) / 100;
      const tip = Math.round(subtotal * (prev.tipPercent / 100) * 100) / 100;
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        tip,
        total: subtotal + tax + tip,
      };
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setReceipt((prev) => {
      const updatedItems = prev.items.filter((it) => it.id !== itemId);
      const subtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      const tax = Math.round(subtotal * (prev.taxPercent / 100) * 100) / 100;
      const tip = Math.round(subtotal * (prev.tipPercent / 100) * 100) / 100;
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        tip,
        total: subtotal + tax + tip,
      };
    });
  };

  const handleAddItem = (item: Partial<ReceiptItem>) => {
    setReceipt((prev) => {
      const newItem: ReceiptItem = {
        id: `item-${Date.now()}`,
        name: item.name || 'New Item',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        category: item.category || 'Food',
        assignedPersonIds: [],
        shares: {},
      };
      const updatedItems = [...prev.items, newItem];
      const subtotal = updatedItems.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
      const tax = Math.round(subtotal * (prev.taxPercent / 100) * 100) / 100;
      const tip = Math.round(subtotal * (prev.tipPercent / 100) * 100) / 100;
      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        tip,
        total: subtotal + tax + tip,
      };
    });
  };

  // Natural Language Chat Command Handler
  const handleSendMessage = async (text: string, modelPref?: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          receipt,
          people,
          modelPreference: modelPref || activeModel,
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to process command.');
      }

      const { data, modelUsed } = json;
      const appliedActions: string[] = [];

      // Step 1: Add new people if mentioned
      let updatedPeople = [...people];
      if (Array.isArray(data.addPeople) && data.addPeople.length > 0) {
        for (const pName of data.addPeople) {
          const trimmed = pName.trim();
          if (
            trimmed &&
            !updatedPeople.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())
          ) {
            const newP: Person = {
              id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              name: trimmed,
              ...getPersonColor(updatedPeople.length),
            };
            updatedPeople.push(newP);
            appliedActions.push(`Added ${trimmed} to the party`);
          }
        }
        setPeople(updatedPeople);
      }

      // Step 2: Remove people if requested
      if (Array.isArray(data.removePeople) && data.removePeople.length > 0) {
        for (const pName of data.removePeople) {
          const target = updatedPeople.find(
            (p) => p.name.toLowerCase() === pName.trim().toLowerCase()
          );
          if (target) {
            updatedPeople = updatedPeople.filter((p) => p.id !== target.id);
            appliedActions.push(`Removed ${target.name}`);
          }
        }
        setPeople(updatedPeople);
      }

      // Step 3: Handle Item Assignments
      let updatedItems = [...receipt.items];

      if (Array.isArray(data.itemAssignments)) {
        for (const assign of data.itemAssignments) {
          // Find target item either by exact ID or fuzzy name match
          let targetItem = assign.itemId
            ? updatedItems.find((it) => it.id === assign.itemId)
            : null;

          if (!targetItem && assign.itemNameMatch) {
            const query = assign.itemNameMatch.toLowerCase();
            targetItem = updatedItems.find(
              (it) =>
                it.name.toLowerCase().includes(query) ||
                query.includes(it.name.toLowerCase())
            );
          }

          if (targetItem) {
            // Resolve person IDs
            const targetPersonIds: string[] = [];
            for (const pName of assign.personNames || []) {
              let person = updatedPeople.find(
                (p) => p.name.toLowerCase() === pName.trim().toLowerCase()
              );
              if (!person) {
                // Auto create person if new
                person = {
                  id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                  name: pName.trim(),
                  ...getPersonColor(updatedPeople.length),
                };
                updatedPeople.push(person);
                setPeople([...updatedPeople]);
                appliedActions.push(`Added ${person.name}`);
              }
              if (person) targetPersonIds.push(person.id);
            }

            // Assign
            const currentAssigned = targetItem.assignedPersonIds || [];
            const mergedIds =
              assign.mode === 'replace'
                ? targetPersonIds
                : Array.from(new Set([...currentAssigned, ...targetPersonIds]));

            // Build custom shares if weights are given
            const shares: Record<string, number> = {};
            if (assign.weights) {
              for (const [pName, weight] of Object.entries(assign.weights)) {
                const p = updatedPeople.find(
                  (person) => person.name.toLowerCase() === pName.toLowerCase()
                );
                if (p) shares[p.id] = Number(weight);
              }
            }

            targetItem.assignedPersonIds = mergedIds;
            if (Object.keys(shares).length > 0) {
              targetItem.shares = shares;
            }

            const namesList = targetPersonIds
              .map((id) => updatedPeople.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join(' & ');
            appliedActions.push(`Assigned "${targetItem.name}" to ${namesList}`);
          }
        }
      }

      // Step 4: Unassign Items
      if (Array.isArray(data.unassignItems)) {
        for (const unassign of data.unassignItems) {
          let targetItem = unassign.itemId
            ? updatedItems.find((it) => it.id === unassign.itemId)
            : null;
          if (!targetItem && unassign.itemNameMatch) {
            const query = unassign.itemNameMatch.toLowerCase();
            targetItem = updatedItems.find((it) =>
              it.name.toLowerCase().includes(query)
            );
          }
          if (targetItem) {
            if (unassign.personNames && unassign.personNames.length > 0) {
              const removeIds = unassign.personNames
                .map(
                  (name: string) =>
                    updatedPeople.find(
                      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
                    )?.id
                )
                .filter(Boolean);
              targetItem.assignedPersonIds = (targetItem.assignedPersonIds || []).filter(
                (id) => !removeIds.includes(id)
              );
              appliedActions.push(
                `Removed ${unassign.personNames.join(', ')} from "${targetItem.name}"`
              );
            } else {
              targetItem.assignedPersonIds = [];
              targetItem.shares = {};
              appliedActions.push(`Cleared assignments on "${targetItem.name}"`);
            }
          }
        }
      }

      // Step 5: Split All Remaining
      if (data.splitAllRemaining?.enabled) {
        const splitPeopleIds =
          data.splitAllRemaining.personNames?.length > 0
            ? data.splitAllRemaining.personNames
                .map(
                  (name: string) =>
                    updatedPeople.find(
                      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
                    )?.id
                )
                .filter(Boolean)
            : updatedPeople.map((p) => p.id);

        let count = 0;
        updatedItems = updatedItems.map((item) => {
          if ((item.assignedPersonIds || []).length === 0) {
            count++;
            return {
              ...item,
              assignedPersonIds: splitPeopleIds,
            };
          }
          return item;
        });
        if (count > 0) {
          appliedActions.push(`Split ${count} remaining items among all`);
        }
      }

      // Step 6: Split Everything
      if (data.splitEverything?.enabled) {
        const splitPeopleIds =
          data.splitEverything.personNames?.length > 0
            ? data.splitEverything.personNames
                .map(
                  (name: string) =>
                    updatedPeople.find(
                      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
                    )?.id
                )
                .filter(Boolean)
            : updatedPeople.map((p) => p.id);

        updatedItems = updatedItems.map((item) => ({
          ...item,
          assignedPersonIds: splitPeopleIds,
        }));
        appliedActions.push('Split all receipt items equally');
      }

      // Step 7: Tip / Tax adjustments
      let updatedSubtotal = updatedItems.reduce(
        (sum, it) => sum + (it.totalPrice || 0),
        0
      );
      let updatedTax = receipt.tax;
      let updatedTaxPercent = receipt.taxPercent;
      let updatedTip = receipt.tip;
      let updatedTipPercent = receipt.tipPercent;

      if (data.setTip) {
        if (typeof data.setTip.percent === 'number') {
          updatedTipPercent = data.setTip.percent;
          updatedTip = Math.round(updatedSubtotal * (updatedTipPercent / 100) * 100) / 100;
          appliedActions.push(`Updated tip to ${updatedTipPercent}%`);
        } else if (typeof data.setTip.amount === 'number') {
          updatedTip = data.setTip.amount;
          updatedTipPercent =
            updatedSubtotal > 0
              ? Math.round((updatedTip / updatedSubtotal) * 1000) / 10
              : 0;
          appliedActions.push(`Set tip to ${receipt.currency}${updatedTip.toFixed(2)}`);
        }
      }

      if (data.setTax) {
        if (typeof data.setTax.percent === 'number') {
          updatedTaxPercent = data.setTax.percent;
          updatedTax = Math.round(updatedSubtotal * (updatedTaxPercent / 100) * 100) / 100;
          appliedActions.push(`Updated tax to ${updatedTaxPercent}%`);
        } else if (typeof data.setTax.amount === 'number') {
          updatedTax = data.setTax.amount;
          updatedTaxPercent =
            updatedSubtotal > 0
              ? Math.round((updatedTax / updatedSubtotal) * 1000) / 10
              : 0;
          appliedActions.push(`Set tax to ${receipt.currency}${updatedTax.toFixed(2)}`);
        }
      }

      const updatedGrandTotal = updatedSubtotal + updatedTax + updatedTip;

      // Update receipt state
      setReceipt((prev) => ({
        ...prev,
        items: updatedItems,
        subtotal: updatedSubtotal,
        tax: updatedTax,
        taxPercent: updatedTaxPercent,
        tip: updatedTip,
        tipPercent: updatedTipPercent,
        total: updatedGrandTotal,
      }));

      // Append assistant message
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'Updated the bill splitting assignments.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        appliedActions,
        quickReplies: data.quickReplies || [
          'Split remaining items equally',
          'Add 20% tip',
          'Who owes the most?',
        ],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ I had trouble processing that command: ${err.message}. Please try phrasing it again!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: activeModel,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <Navbar
        receipt={receipt}
        people={people}
        activeModel={activeModel}
        onOpenUpload={() => setIsUploadOpen(true)}
        onReset={handleReset}
        onOpenPeopleModal={() => setIsPeopleModalOpen(true)}
        onLoadSample={handleLoadSample}
        mobileView={mobileView}
        setMobileView={setMobileView}
      />

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: AI-Parsed Structured Receipt (visible on desktop or if mobileView === 'receipt'/'split') */}
        <section
          className={`flex-1 flex flex-col min-w-0 h-full ${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ReceiptPane
            receipt={receipt}
            people={people}
            onUpdateReceipt={(updates) => setReceipt((prev) => ({ ...prev, ...updates }))}
            onAssignPerson={handleAssignPerson}
            onUnassignPerson={handleUnassignPerson}
            onAssignAllPeople={handleAssignAllPeople}
            onClearItemAssignments={handleClearItemAssignments}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            onLoadSample={handleLoadSample}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        </section>

        {/* Right Pane: Smart Chat & Real-time Proportional Summary (visible on desktop or if mobileView === 'chat') */}
        <section
          className={`flex-1 flex flex-col min-w-0 h-full border-l border-slate-200 dark:border-slate-800 ${
            mobileView === 'receipt' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Real-time Proportional Summary section at top of right pane */}
          <SummaryCards
            calculation={calculation}
            receipt={receipt}
            people={people}
            onOpenPeopleModal={() => setIsPeopleModalOpen(true)}
            onSplitRemainingEqually={handleSplitRemainingEqually}
          />

          {/* Multi-turn Chat Assistant */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPane
              messages={messages}
              isLoading={isChatLoading}
              activeModel={activeModel}
              onSendMessage={handleSendMessage}
              people={people}
              onOpenPeopleModal={() => setIsPeopleModalOpen(true)}
              onSelectModel={setActiveModel}
            />
          </div>
        </section>
      </main>

      {/* Modals */}
      <ReceiptUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onReceiptParsed={handleReceiptParsed}
        onLoadSample={handleLoadSample}
      />

      <PersonManagerModal
        isOpen={isPeopleModalOpen}
        onClose={() => setIsPeopleModalOpen(false)}
        people={people}
        onAddPerson={handleAddPerson}
        onRemovePerson={handleRemovePerson}
        onUpdatePerson={handleUpdatePerson}
      />
    </div>
  );
}
