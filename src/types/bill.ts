export interface Person {
  id: string;
  name: string;
  color: string; // Tailwind color or hex
  accentBg: string;
  accentText: string;
  avatarSeed?: string;
}

export interface ItemShare {
  personId: string;
  weight: number; // default 1 (e.g. 1 share each, or 2 vs 1 for quantities)
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  assignedPersonIds: string[]; // List of person IDs sharing this item
  shares?: Record<string, number>; // optional custom weights/shares
}

export interface ReceiptData {
  restaurantName: string;
  date: string;
  currency: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  taxPercent: number;
  tip: number;
  tipPercent: number;
  total: number;
  rawImageUrl?: string;
  notes?: string;
}

export interface PersonItemShareDetail {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  itemTotalPrice: number;
  weight: number;
  fraction: number; // e.g. 0.5 for 50%
  amount: number; // Dollar amount owed for this item
}

export interface PersonSummary {
  person: Person;
  items: PersonItemShareDetail[];
  itemsSubtotal: number;
  proportionalTax: number;
  proportionalTip: number;
  totalOwed: number;
  percentageOfBill: number;
}

export interface BillSplitCalculation {
  peopleSummaries: PersonSummary[];
  totalAssignedSubtotal: number;
  unassignedSubtotal: number;
  unassignedItems: ReceiptItem[];
  receiptSubtotal: number;
  taxTotal: number;
  tipTotal: number;
  grandTotal: number;
  distributedTax: number;
  distributedTip: number;
  distributedGrandTotal: number;
  isFullyAssigned: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  appliedActions?: string[];
  modelUsed?: string;
  quickReplies?: string[];
}
