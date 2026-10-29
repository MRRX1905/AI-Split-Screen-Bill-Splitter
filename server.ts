import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to sanitize JSON response from Gemini
function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * POST /api/receipt/parse
 * Image parsing endpoint.
 * Requirement: MUST use gemini-4-argon for image understanding,
 * with fallback to gemini-3.8-flash if needed.
 */
app.post('/api/receipt/parse', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    // Extract raw base64 data if data URL is passed
    const base64Data = imageBase64.includes(';base64,')
      ? imageBase64.split(';base64,')[1]
      : imageBase64;

    const promptText = `
You are a receipt scanning specialist. Analyze this receipt image with extreme accuracy.
Extract:
1. restaurantName: Merchant or restaurant name (e.g. "Bella Italia", "Blue Bottle Coffee", etc.)
2. date: Date and time if visible (e.g. "Oct 28, 2026 - 7:45 PM")
3. currency: Currency symbol (default "$")
4. items: Array of line items. For each item:
   - id: unique string (e.g. "item-1", "item-2")
   - name: readable item name without confusing abbreviations
   - quantity: integer (e.g. 1, 2)
   - unitPrice: number (price per unit)
   - totalPrice: number (total price for this line item)
   - category: one of ["Food", "Drinks", "Appetizer", "Dessert", "Other"]
5. subtotal: numerical sum of all items before taxes and tips
6. tax: numerical sales tax / VAT
7. tip: numerical tip or gratuity if already printed or written, otherwise 0
8. total: grand total (subtotal + tax + tip)
9. notes: table number, server name, or receipt footer message if visible

Only return valid JSON conforming to this schema without extra commentary.
`;

    let response;
    let modelUsed = 'gemini-4-argon';

    try {
      response = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              restaurantName: { type: Type.STRING },
              date: { type: Type.STRING },
              currency: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    unitPrice: { type: Type.NUMBER },
                    totalPrice: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                  },
                  required: ['id', 'name', 'quantity', 'unitPrice', 'totalPrice'],
                },
              },
              subtotal: { type: Type.NUMBER },
              tax: { type: Type.NUMBER },
              tip: { type: Type.NUMBER },
              total: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['restaurantName', 'items', 'subtotal', 'tax', 'total'],
          },
        },
      });
    } catch (err: any) {
      console.warn('gemini-4-argon failed or unavailable, falling back to gemini-3.8-flash:', err.message);
      modelUsed = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const text = response.text || '{}';
    const parsed = JSON.parse(cleanJsonText(text));

    // Ensure items have assignedPersonIds: []
    if (Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((it: any, idx: number) => ({
        id: it.id || `item-${idx + 1}`,
        name: it.name || `Item ${idx + 1}`,
        quantity: typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1,
        unitPrice: typeof it.unitPrice === 'number' ? it.unitPrice : (it.totalPrice || 0),
        totalPrice: typeof it.totalPrice === 'number' ? it.totalPrice : (it.unitPrice || 0),
        category: it.category || 'Food',
        assignedPersonIds: [],
        shares: {},
      }));
    }

    // Calculate tax percent and tip percent if not given
    const subtotal = parsed.subtotal || 0;
    const tax = parsed.tax || 0;
    const tip = parsed.tip || 0;
    parsed.taxPercent = subtotal > 0 ? Math.round((tax / subtotal) * 1000) / 10 : 9;
    parsed.tipPercent = subtotal > 0 && tip > 0 ? Math.round((tip / subtotal) * 1000) / 10 : 0;
    parsed.currency = parsed.currency || '$';
    parsed.modelUsed = modelUsed;

    return res.json({ success: true, data: parsed, modelUsed });
  } catch (error: any) {
    console.error('Error parsing receipt:', error);
    return res.status(500).json({
      error: 'Failed to parse receipt image: ' + (error?.message || 'Unknown error'),
    });
  }
});

/**
 * POST /api/chat
 * Multi-turn chat assistant endpoint with role instruction and natural language bill assignment actions.
 * Models:
 * - gemini-4-argon for complex calculations / weighted splits
 * - gemini-3.8-flash for general multi-turn tasks
 * - gemini-3.1-flash-lite for fast commands
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      message,
      history = [],
      receipt,
      people = [],
      modelPreference = 'gemini-3.8-flash',
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Determine target model based on complexity or explicit request
    let selectedModel = modelPreference;
    const lowerMsg = message.toLowerCase();
    const isComplex =
      lowerMsg.includes('fraction') ||
      lowerMsg.includes('ratio') ||
      lowerMsg.includes('percent') ||
      lowerMsg.includes('except for') ||
      lowerMsg.includes('unequally') ||
      lowerMsg.includes('shares') ||
      message.length > 140;

    if (!modelPreference || modelPreference === 'auto') {
      if (isComplex) {
        selectedModel = 'gemini-4-argon';
      } else if (
        lowerMsg.startsWith('add ') ||
        lowerMsg.startsWith('remove ') ||
        lowerMsg.includes('tip') ||
        lowerMsg.length < 25
      ) {
        selectedModel = 'gemini-3.1-flash-lite';
      } else {
        selectedModel = 'gemini-3.8-flash';
      }
    }

    const systemInstruction = `
You are SplitRight's intelligent dining bill assistant.
You maintain conversation history, interpret natural language splitting commands, and output structured actions to modify bill assignments.

CURRENT RECEIPT ITEMS:
${JSON.stringify(
  (receipt?.items || []).map((it: any) => ({
    id: it.id,
    name: it.name,
    totalPrice: it.totalPrice,
    quantity: it.quantity,
    assignedPersonIds: it.assignedPersonIds || [],
  })),
  null,
  2
)}

CURRENT PEOPLE IN THE PARTY:
${JSON.stringify(
  people.map((p: any) => ({ id: p.id, name: p.name })),
  null,
  2
)}

CURRENT TAX & TIP:
Subtotal: ${receipt?.currency || '$'}${receipt?.subtotal || 0}
Tax: ${receipt?.currency || '$'}${receipt?.tax || 0} (${receipt?.taxPercent || 0}%)
Tip: ${receipt?.currency || '$'}${receipt?.tip || 0} (${receipt?.tipPercent || 0}%)

YOUR JOB:
1. Parse the user's input (e.g. "Dhruv had the nachos", "Sarah and Sue shared the pizza", "Add 20% tip", "Split the wine between everyone", "Alex had 2 beers and John had 1", "Add Mike to the group", "Remove Sarah from the fries").
2. Match item names fuzzy/intelligently (e.g. "nachos" matches "Ultimate Loaded Nachos (Grande)", "pizza" matches "Margherita Pizza DOC", "wine" matches "Chianti Classico (Bottle)").
3. If new people are mentioned who are not yet in the party, add them in "addPeople" list.
4. If an item is assigned to multiple people equally, list all their names. If custom weights are specified (e.g. 2 beers vs 1 beer, or 60/40), provide "weights" where keys are person names and values are numeric proportions.
5. In your "reply", provide a warm, concise, conversational confirmation (1-2 sentences).
6. Provide 2-3 helpful "quickReplies" for what the user might want to do next.

Return ONLY a JSON object with this format:
{
  "reply": "string confirmation to display in chat",
  "addPeople": ["string names of new people to add to party"],
  "removePeople": ["string names of people to remove"],
  "itemAssignments": [
    {
      "itemId": "optional id if known or empty",
      "itemNameMatch": "name or substring of item",
      "personNames": ["Person Name 1", "Person Name 2"],
      "mode": "assign" | "unassign" | "replace",
      "weights": { "Person Name 1": 1, "Person Name 2": 1 }
    }
  ],
  "unassignItems": [
    {
      "itemId": "optional id",
      "itemNameMatch": "string",
      "personNames": ["optional list of people to remove from this item; if empty, removes all"]
    }
  ],
  "splitAllRemaining": {
    "enabled": boolean,
    "personNames": ["list of people who split remaining items, or empty for all people"]
  },
  "splitEverything": {
    "enabled": boolean,
    "personNames": ["list of people"]
  },
  "setTip": {
    "percent": number or null,
    "amount": number or null
  },
  "setTax": {
    "percent": number or null,
    "amount": number or null
  },
  "quickReplies": ["Quick suggestion 1", "Quick suggestion 2", "Quick suggestion 3"]
}
`;

    // Build chat contents from history + current message
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let response;
    let actualModel = selectedModel;

    try {
      response = await ai.models.generateContent({
        model: actualModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    } catch (modelErr: any) {
      console.warn(`Model ${actualModel} failed (${modelErr.message}), falling back to gemini-3.8-flash`);
      actualModel = 'gemini-3.8-flash';
      response = await ai.models.generateContent({
        model: actualModel,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });
    }

    const rawText = response.text || '{}';
    const parsedData = JSON.parse(cleanJsonText(rawText));

    return res.json({
      success: true,
      data: parsedData,
      modelUsed: actualModel,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: 'Failed to process chat command: ' + (error?.message || 'Unknown error'),
    });
  }
});

// Serve frontend in production or mount Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SplitRight server listening on port ${PORT}`);
  });
}

startServer();
