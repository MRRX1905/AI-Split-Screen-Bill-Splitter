import { ReceiptData } from '../types/bill';

export interface SampleReceipt {
  id: string;
  name: string;
  tagline: string;
  data: ReceiptData;
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'trattoria-sample',
    name: 'Trattoria Il Giardino',
    tagline: 'Italian dinner: Pizzas, pasta, wine, and dessert',
    data: {
      restaurantName: 'Trattoria Il Giardino',
      date: 'Oct 28, 2026 - 8:15 PM',
      currency: '$',
      items: [
        { id: 'item-1', name: 'Margherita Pizza DOC', quantity: 1, unitPrice: 18.50, totalPrice: 18.50, category: 'Food', assignedPersonIds: [] },
        { id: 'item-2', name: 'Truffle Tagliolini Pasta', quantity: 1, unitPrice: 24.00, totalPrice: 24.00, category: 'Food', assignedPersonIds: [] },
        { id: 'item-3', name: 'Crispy Calamari & Aioli', quantity: 1, unitPrice: 16.00, totalPrice: 16.00, category: 'Appetizer', assignedPersonIds: [] },
        { id: 'item-4', name: 'Chianti Classico (Bottle)', quantity: 1, unitPrice: 42.00, totalPrice: 42.00, category: 'Drinks', assignedPersonIds: [] },
        { id: 'item-5', name: 'Sparkling San Pellegrino', quantity: 2, unitPrice: 4.50, totalPrice: 9.00, category: 'Drinks', assignedPersonIds: [] },
        { id: 'item-6', name: 'Classic Tiramisu', quantity: 1, unitPrice: 11.50, totalPrice: 11.50, category: 'Dessert', assignedPersonIds: [] }
      ],
      subtotal: 121.00,
      tax: 10.89, // 9%
      taxPercent: 9,
      tip: 24.20, // 20%
      tipPercent: 20,
      total: 156.09,
      notes: 'Table 14 • Server: Matteo'
    }
  },
  {
    id: 'taqueria-sample',
    name: 'El Fuego Cantina & Taqueria',
    tagline: 'Tacos, loaded nachos, guacamole, and craft margaritas',
    data: {
      restaurantName: 'El Fuego Cantina & Taqueria',
      date: 'Oct 27, 2026 - 7:30 PM',
      currency: '$',
      items: [
        { id: 'tq-1', name: 'Ultimate Loaded Nachos (Grande)', quantity: 1, unitPrice: 17.50, totalPrice: 17.50, category: 'Appetizer', assignedPersonIds: [] },
        { id: 'tq-2', name: 'Birria Quesatacos (3 pcs)', quantity: 2, unitPrice: 16.00, totalPrice: 32.00, category: 'Food', assignedPersonIds: [] },
        { id: 'tq-3', name: 'Fresh Guacamole & Warm Chips', quantity: 1, unitPrice: 12.00, totalPrice: 12.00, category: 'Appetizer', assignedPersonIds: [] },
        { id: 'tq-4', name: 'Smoky Mezcalita Cocktails', quantity: 3, unitPrice: 14.00, totalPrice: 42.00, category: 'Drinks', assignedPersonIds: [] },
        { id: 'tq-5', name: 'Modelo Especial Draft', quantity: 2, unitPrice: 7.00, totalPrice: 14.00, category: 'Drinks', assignedPersonIds: [] },
        { id: 'tq-6', name: 'Cinnamon Churros & Cajeta', quantity: 1, unitPrice: 9.50, totalPrice: 9.50, category: 'Dessert', assignedPersonIds: [] }
      ],
      subtotal: 127.00,
      tax: 11.43,
      taxPercent: 9,
      tip: 25.40,
      tipPercent: 20,
      total: 163.83,
      notes: 'Patio Table 6 • Server: Sofia'
    }
  },
  {
    id: 'sushi-sample',
    name: 'Nami Omakase & Izakaya',
    tagline: 'Sushi rolls, sashimi platter, edamame, and warm sake',
    data: {
      restaurantName: 'Nami Omakase & Izakaya',
      date: 'Oct 26, 2026 - 6:45 PM',
      currency: '$',
      items: [
        { id: 'su-1', name: 'Truffle Salmon Nigiri Set', quantity: 2, unitPrice: 19.00, totalPrice: 38.00, category: 'Sushi', assignedPersonIds: [] },
        { id: 'su-2', name: 'Spicy Bluefin Tuna Crunch Roll', quantity: 2, unitPrice: 16.50, totalPrice: 33.00, category: 'Sushi', assignedPersonIds: [] },
        { id: 'su-3', name: 'Steamed Edamame with Sea Salt', quantity: 1, unitPrice: 7.00, totalPrice: 7.00, category: 'Appetizer', assignedPersonIds: [] },
        { id: 'su-4', name: 'Gyoza Dumplings (Pork)', quantity: 1, unitPrice: 10.50, totalPrice: 10.50, category: 'Appetizer', assignedPersonIds: [] },
        { id: 'su-5', name: 'Junmai Daiginjo Sake Carafe', quantity: 1, unitPrice: 28.00, totalPrice: 28.00, category: 'Drinks', assignedPersonIds: [] },
        { id: 'su-6', name: 'Matcha Green Tea Crepe Cake', quantity: 2, unitPrice: 9.00, totalPrice: 18.00, category: 'Dessert', assignedPersonIds: [] }
      ],
      subtotal: 134.50,
      tax: 12.10,
      taxPercent: 9,
      tip: 26.90,
      tipPercent: 20,
      total: 173.50,
      notes: 'Counter 3 • Chef: Kenji'
    }
  }
];
