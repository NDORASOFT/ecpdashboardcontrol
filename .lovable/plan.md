
# PO#-Centric Dashboard Refactor

## Phase 1: PO#-centric notes + uppercase normalization

**Notepad.tsx changes:**
- Rename "T-Notes" to "PO#" throughout UI (toggle label, headers, card titles).
- Each note's tab/title displays the PO# value (from `mscItem` or a new `poNumber` field).
- Add `onBlur` handler to all text inputs that calls `.toUpperCase()` on the value.
- Change date display to MM/DD/YY format; store raw values as MMDDYY (no slashes). Update `formatESD` in `leadTime.ts` accordingly.
- Remove the "Tab to paste" hint button in Net Price if the paste analyzer icon already covers it (Phase 2 will add the analyzer).
- Monetary fields (`netPrice`, `minDsFee`, fees) display with `$` prefix in read mode.

## Phase 2: Paste analyzer per module

Create a shared utility `src/lib/pasteAnalyzer.ts`:
- `analyzePaste(text: string)` returns structured data: `{ poNumber?, netPrice?, leadTime?, shipFrom?, dsFee?, minFee?, restockFee?, vendorItem?, senderName?, senderEmail?, rawLines[] }`.
- Regex-based extraction for PO# patterns (e.g., `PO\s*#?\s*\d+`), dollar amounts next to keywords, lead time patterns, email addresses, "From:" name parsing.

Add a small clipboard/analyze icon button to these components:
- **Notepad (PO# notes):** Paste text -> parse -> auto-fill fields. If PO# found, create or focus that PO# tab. If same vendor+item+PO# exists, show warning toast: "PO# vigente, use existing quote?"
- **SplitOrderCalc (Cart):** Already has paste; enhance `parseCart` to also detect PO# and `TOT`/`tot` more aggressively (fix the existing regex).
- **Calculator:** Add a paste icon that reads a dollar amount from clipboard and sets it as the price in discount mode.
- **OrderCounter / submit modal:** Paste icon that reads PO# and amount from clipboard text.

Email quote parsing logic (in `pasteAnalyzer.ts`):
- Extract sender first name from "From: FirstName LastName" or similar patterns.
- Extract email from angle brackets or standalone email pattern.
- Store sender info in the `sw` field.
- Map quote fields (Net Price, vendor item, lead time, DS fee, min, restocking) to the corresponding PO# note fields.

## Phase 3: Layout reorganization

**Index.tsx grid restructure:**

```text
Desktop (md+):
┌─────────┬──────────────┬──────────────┬──────────┐
│ Counter │              │              │ Goal     │
│ (compact│  PO# Notes   │  Form Viewer │ (small)  │
│  +calc) │  (tall)      │  (tall)      │          │
│         │              │              │ History  │
│ Cart    │              │              │ (below)  │
└─────────┴──────────────┴──────────────┴──────────┘
│ Vendor Vault           │ Dialer                   │
└────────────────────────┴──────────────────────────┘
```

- Left column: OrderCounter (compact), Calculator (collapsible - add a collapse toggle that hides the keypad and shows only the result bar), then SplitOrderCalc below.
- Second column: Notepad/PO# notes (tall, row-span-2, preserving readable width).
- Third column: FormViewer (tall, row-span-2).
- Right column: GoalGauge (compact, smaller ring `size=90`) stacked with HistoryTable below (no full-height stretch).

Calculator collapsible: Add a state `collapsed` that when true shows only the result display (1 line) and the discount toggle, hiding the keypad grid.

## Phase 4: Split validation + history dashboard

**SplitOrderCalc.tsx:**
- Replace the current diff display with a clear confirmation system:
  - If all diffs are < $0.01: show a green "Totals Match" banner with checkmark.
  - If mismatch: show each line item (Subtotal, Tax, Freight, Total) with red/green indicator and explicit label like "Tax increased by +$1.23" or "Freight match".

**HistoryTable.tsx / GoalHistoryToggle.tsx - add mini dashboard tab:**
- Add a third tab "Stats" alongside Daily/Submissions.
- Stats view shows:
  - Weekly goal progress (sum of last 7 days vs goal*7).
  - Average orders/day (from history).
  - Average time between submits (computed from submission timestamps).
  - Return count to 76 Screen (sum of `otherCount` from history).
  - Top 3 podium placeholder (shows current user's stats; team data would need backend, so show a placeholder or single-user leaderboard).
- All computed from existing localStorage data.

## Phase 5: Modal cleanup + responsive polish

**Index.tsx AlertDialog (order entry modal):**
- Make the modal more compact:
  - Reduce padding and vertical spacing.
  - Put PO#, Amount, and Cart in a single row or tight 3-column grid.
  - Move type buttons to a horizontal row of small pills instead of 2x2 grid.
  - Place "No contar" as a small text link, not a full button.
- Keep all current fields (PO#, amount, cart, type).

**Responsive polish:**
- Test grid at various widths; ensure columns collapse gracefully at `sm`, `md`, `lg`.
- PO# notes column maintains min-width for readability.
- Goal widget never stretches to fill excessive vertical space.

## Files to create
- `src/lib/pasteAnalyzer.ts` — shared paste parsing utility

## Files to modify
- `src/components/dashboard/Notepad.tsx` — rename to PO#, add analyzer, uppercase, monetary display
- `src/components/dashboard/Calculator.tsx` — add collapsible mode, paste icon
- `src/components/dashboard/SplitOrderCalc.tsx` — enhanced validation UI
- `src/components/dashboard/OrderCounter.tsx` — compact layout adjustments
- `src/components/dashboard/GoalGauge.tsx` — smaller ring, compact layout
- `src/components/dashboard/GoalHistoryToggle.tsx` — add Stats tab
- `src/components/dashboard/HistoryTable.tsx` — add Stats view with weekly/avg metrics
- `src/lib/leadTime.ts` — MM/DD/YY format
- `src/pages/Index.tsx` — new grid layout, compact modal
