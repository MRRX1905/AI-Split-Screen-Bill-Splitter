# SplitRight 🧾⚡

**SplitRight** is an AI-powered, split-screen bill splitting web application. It pairs an AI-parsed receipt display on the left pane with an intelligent conversational chat interface on the right pane. Users can assign costs effortlessly using natural language commands like *"Dhruv had the nachos"* or *"Sarah and Sue shared the pizza"*, while tax and tip are automatically calculated and distributed proportionally based on each person's spend.

---

## ✨ Features

### 1. Split-Screen Workspace
- **Left Pane (Receipt View)**:
  - Displays structured receipt line items, quantities, unit prices, totals, and categories.
  - Interactive status badges: colorful assignee chips for claimed items and alert badges for unassigned items.
  - Direct inline manual controls: click to assign/unassign people, edit prices, add manual items, or adjust tax/tip percentages.
  - Skeuomorphic receipt styling with live progress bar showing assigned percentage.
- **Right Pane (Smart Chat & Real-Time Proportional Summary)**:
  - **"Who Owes What" Cards**: Live breakdown of exactly what each person owes, itemizing their food/drink subtotal, proportional sales tax, and proportional tip.
  - Warning banner when items remain unassigned with a 1-click *"Split Remainder Equally"* action.
  - Multi-turn scrollable chat thread maintaining conversation context.
  - Action tags on assistant messages showing what assignments or party changes were executed.
  - Suggested quick-reply chips for fast one-tap commands.

### 2. Conversational Bill Assignment with Gemini
Type natural language commands into the chat:
- *"Dhruv had the nachos"*
- *"Sarah and Sue shared the pizza 50/50"*
- *"Alex had 2 beers and Mark had 1"*
- *"Split the wine between everyone"*
- *"Add a 20% tip"*
- *"Remove Sarah from the fries"*
- *"Who owes the most?"*

### 3. Model Routing
- **`gemini-4-argon`**: Complex assignments, fractional splits, unequal weights, and receipt image visual understanding.
- **`gemini-3.8-flash`**: General multi-turn conversational interactions and natural language intent parsing.
- **`gemini-3.1-flash-lite`**: Fast single assignments and quick adjustments.

### 4. Receipt Photo Scanning
- Upload receipt photos (JPG, PNG, WEBP) or capture with mobile camera (`capture="environment"`).
- Analyzed via Gemini vision to extract line items, prices, subtotals, tax, and totals.
- Instant pre-loaded sample receipts (*Trattoria Il Giardino*, *El Fuego Cantina*, and *Nami Omakase*) to test without a photo.

### 5. Fair Proportional Tax & Tip Math
Tax and tip are distributed strictly proportional to each individual's food and beverage spend rather than an arbitrary flat split:
$$\text{Share Ratio}_p = \frac{\text{Subtotal}_p}{\text{Total Subtotal}}$$
$$\text{Tax}_p = \text{Total Tax} \times \text{Share Ratio}_p$$
$$\text{Tip}_p = \text{Total Tip} \times \text{Share Ratio}_p$$
$$\text{Total Owed}_p = \text{Subtotal}_p + \text{Tax}_p + \text{Tip}_p$$

### 6. One-Click Group Sharing
- Click **"Share Summary"** to copy a formatted text breakdown with emojis ready to paste directly into WhatsApp, iMessage, Venmo, or email.
- Confetti celebration when all receipt items are 100% assigned!

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion, Lucide React, Canvas Confetti
- **Backend**: Node.js, Express (`express.json` with 25MB limits for image analysis)
- **AI Integration**: `@google/genai` TypeScript SDK (server-side only)
- **Tooling**: Vite, TSX

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- A Gemini API Key (set via `GEMINI_API_KEY` environment variable)

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Add your key in `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   PORT=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

5. Build for production:
   ```bash
   npm run build
   npm start
   ```

---

## 📡 API Endpoints

- `POST /api/receipt/parse`:
  - Accepts `{ imageBase64: string, mimeType?: string }`.
  - Analyzes the image using `gemini-4-argon` (with automatic fallback to `gemini-3.8-flash`) and returns structured JSON with merchant name, items, prices, subtotal, tax, and tip.
- `POST /api/chat`:
  - Accepts `{ message: string, history: Array<{ role: string, text: string }>, receipt: ReceiptData, people: Person[], modelPreference?: string }`.
  - Interprets natural language commands and returns conversational replies along with structured mutation actions (`itemAssignments`, `addPeople`, `removePeople`, `setTip`, `setTax`, etc.).

---

## 📄 License
Apache-2.0
