import { BillSplitCalculation, Person, PersonSummary, ReceiptData, ReceiptItem } from '../types/bill';

export const PERSON_COLORS: Array<{ color: string; accentBg: string; accentText: string }> = [
  { color: '#3B82F6', accentBg: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', accentText: 'text-blue-600 dark:text-blue-400' },
  { color: '#10B981', accentBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', accentText: 'text-emerald-600 dark:text-emerald-400' },
  { color: '#8B5CF6', accentBg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', accentText: 'text-purple-600 dark:text-purple-400' },
  { color: '#F59E0B', accentBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', accentText: 'text-amber-600 dark:text-amber-400' },
  { color: '#EC4899', accentBg: 'bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800', accentText: 'text-pink-600 dark:text-pink-400' },
  { color: '#06B6D4', accentBg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', accentText: 'text-cyan-600 dark:text-cyan-400' },
  { color: '#F97316', accentBg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800', accentText: 'text-orange-600 dark:text-orange-400' },
  { color: '#6366F1', accentBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800', accentText: 'text-indigo-600 dark:text-indigo-400' },
];

export function getPersonColor(index: number) {
  return PERSON_COLORS[index % PERSON_COLORS.length];
}

export function calculateBillSplit(
  receipt: ReceiptData,
  people: Person[]
): BillSplitCalculation {
  const peopleMap = new Map<string, Person>();
  people.forEach((p) => peopleMap.set(p.id, p));

  const items = receipt.items || [];
  const receiptSubtotal = receipt.subtotal > 0 
    ? receipt.subtotal 
    : items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  const taxTotal = receipt.tax || 0;
  const tipTotal = receipt.tip || 0;
  const grandTotal = receiptSubtotal + taxTotal + tipTotal;

  // Track each person's item details
  const personItemsMap = new Map<string, Array<{
    itemId: string;
    itemName: string;
    unitPrice: number;
    quantity: number;
    itemTotalPrice: number;
    weight: number;
    fraction: number;
    amount: number;
  }>>();

  people.forEach((p) => personItemsMap.set(p.id, []));

  const unassignedItems: ReceiptItem[] = [];
  let totalAssignedSubtotal = 0;

  for (const item of items) {
    const assignedIds = item.assignedPersonIds || [];
    if (assignedIds.length === 0) {
      unassignedItems.push(item);
      continue;
    }

    // Filter to known people
    const validAssigned = assignedIds.filter((id) => peopleMap.has(id));
    if (validAssigned.length === 0) {
      unassignedItems.push(item);
      continue;
    }

    // Compute total weights for this item
    let sumWeight = 0;
    const weights: Record<string, number> = {};
    for (const pid of validAssigned) {
      const w = item.shares?.[pid] ?? 1;
      weights[pid] = w;
      sumWeight += w;
    }

    if (sumWeight === 0) sumWeight = 1;

    for (const pid of validAssigned) {
      const w = weights[pid];
      const fraction = w / sumWeight;
      const shareCost = (item.totalPrice || 0) * fraction;

      const list = personItemsMap.get(pid) || [];
      list.push({
        itemId: item.id,
        itemName: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        itemTotalPrice: item.totalPrice,
        weight: w,
        fraction,
        amount: shareCost,
      });
      personItemsMap.set(pid, list);
      totalAssignedSubtotal += shareCost;
    }
  }

  const unassignedSubtotal = items
    .filter((it) => (it.assignedPersonIds || []).length === 0)
    .reduce((acc, it) => acc + (it.totalPrice || 0), 0);

  // Proportional Tax and Tip Distribution:
  // Each person's fraction of the total bill subtotal (or of assigned subtotal if only part is split)
  // If total bill subtotal > 0, we can proportion tax and tip relative to receiptSubtotal,
  // so each person pays: (their subtotal / receiptSubtotal) * tax and tip.
  // This guarantees that if person A spent $30 of a $100 bill, they pay 30% of tax and 30% of tip!
  const baseForRatio = receiptSubtotal > 0 ? receiptSubtotal : (totalAssignedSubtotal || 1);

  const peopleSummaries: PersonSummary[] = people.map((person) => {
    const assigned = personItemsMap.get(person.id) || [];
    const itemsSubtotal = assigned.reduce((acc, curr) => acc + curr.amount, 0);

    const ratio = baseForRatio > 0 ? (itemsSubtotal / baseForRatio) : 0;
    const proportionalTax = taxTotal * ratio;
    const proportionalTip = tipTotal * ratio;
    const totalOwed = itemsSubtotal + proportionalTax + proportionalTip;
    const percentageOfBill = grandTotal > 0 ? (totalOwed / grandTotal) * 100 : 0;

    return {
      person,
      items: assigned,
      itemsSubtotal,
      proportionalTax,
      proportionalTip,
      totalOwed,
      percentageOfBill,
    };
  });

  const distributedTax = peopleSummaries.reduce((sum, p) => sum + p.proportionalTax, 0);
  const distributedTip = peopleSummaries.reduce((sum, p) => sum + p.proportionalTip, 0);
  const distributedGrandTotal = peopleSummaries.reduce((sum, p) => sum + p.totalOwed, 0);

  return {
    peopleSummaries,
    totalAssignedSubtotal,
    unassignedSubtotal,
    unassignedItems,
    receiptSubtotal,
    taxTotal,
    tipTotal,
    grandTotal,
    distributedTax,
    distributedTip,
    distributedGrandTotal,
    isFullyAssigned: unassignedItems.length === 0 && items.length > 0,
  };
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
}
