
# Plan: PO#-Centric Workflow Refactor (credit-efficient)

Goal: fix the bugs you mentioned and reorganize the dashboard around **PO# = the order**, while reusing existing components to keep the diff small.

---

## Phase 1 — Bug fixes (small, surgical)

These are 1-file edits each, ~5 lines per fix.

**A. T-Note empty row bug** (`Notepad.tsx`)
- Current `useEffect` only runs once on mount. After adding a record, no new empty appears OR a duplicate is prepended on reload.
- Fix: change to a derived check on every render — if `tnotes.length === 0` OR top is not empty, prepend one empty. Run inside the same effect but with `[tnotes]` deps, guarded so it never loops (only act when top has data AND no other empty exists).

**B. Default N/A for fees** (`Notepad.tsx`)
- In `emptyTNote()`: set `minDsFee: "N/A"` and `returnableRestockableFee: "N/A"`.
- Analyzer overrides them only when a real value is parsed (already the case).

**C. Uppercase on space + blur** (`Notepad.tsx`)
- Add `onKeyUp` handler: if `e.key === " "`, uppercase the field value live. (Blur already does it.)

**D. Cart "subtotal decreased" alert → silent confirm** (`SplitOrderCalc.tsx`)
- Remove the warning banner for subtotal mismatch.
- Keep ONLY: green "Totals Match" if `splitA + splitB == mainTotal` (±$0.01), else red line listing exactly which field diverged (Tax / Freight / Subtotal) with `+$x.xx` or `-$x.xx`.

**E. Form auto-detect timing** (`FormViewer.tsx`)
- Trigger ONLY on the 3rd `onLoad` (the "submit another response" page). Confirmed Google Forms behavior:
  1. Initial load
  2. Submit click reloads to confirmation
  3. (only if "Send another response" link clicked → 3rd load)
- Switch to: count loads, fire on load #2 (the confirmation page) instead of #3, since that's the actual post-submit. Add a 500 ms debounce so transient redirects don't re-trigger.

---

## Phase 2 — PO# as the organizing unit (Notepad sidebar)

**T-Notes grouped by PO#** (`Notepad.tsx`)
- Add a left vertical sidebar inside the PO# Notes card:
  - Lists each unique `poNumber` as a tab (or "NEW" if blank).
  - Click a PO# → filters the right side to show only T-Notes for that PO#.
  - "+ New PO#" button at top of sidebar creates a new PO group with one empty T-Note.
- A T-Note belongs to a PO# via its `poNumber` field. Multiple T-Notes per PO# = multiple line items / vendors.
- Active PO# is stored in `useLocalStorage("ecp.activePO", "")` so the analyzer + tracker know "which order are we on right now".

**Duplicate quote detection**
- When analyzer parses a paste and finds `mscItem` already present in any T-Note from the last 7 days for the same vendor, show a toast: `"PO# vigente — reuse quote from PO#XXXX?"` with an "Apply" action that copies fields from the old T-Note into the active one.

---

## Phase 3 — Layout reorganization

New grid (left → right):

```text
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ PO# Notes    │ Calculator   │ PO Tracker   │ Goal /       │
│ (sidebar +   │ (collapsible)│ (Form +      │ Podium       │
│  tnotes)     │              │  Counter +   │              │
│              │ Cart (Split) │  History     │ Tips         │
│              │              │  toggle)     │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Col 1: **Notepad/PO# Notes** (was col 2).
- Col 2: **Calculator** + **SplitOrderCalc** stacked. Calc auto-collapses to result-bar when Cart's "Split" button is clicked (event `ecp:cart-split-open`).
- Col 3: **PO Tracker** = merged FormViewer + OrderCounter + History toggle (see Phase 4).
- Col 4: **Goal/Podium** with tips.

Bottom row stays: `VendorVault` + `Analyzer` (replaces Dialer — see Phase 5).

Daily Goal sizing fix: wrap GoalGauge in a `max-h-[280px]` container, remove `flex-1` stretch — this kills the empty space.

---

## Phase 4 — PO Tracker (merge: Counter + FormViewer + History)

New component `PoTracker.tsx` containing:
- **Top row**: small Submit button (above the iframe, not below), counter pills (PO / 76 / Total), reset.
- **Middle**: FormViewer iframe (Google Form).
- **Bottom toggle**: `[Daily Goal] [History] [Mini Dashboard]`
  - Daily Goal moves OUT of col 4 into here as a toggle option.
  - Mini Dashboard = new view (Phase 4b).
- Col 4 then shows only the **Podium / Tips** widget.

**4b. Mini Dashboard view** (new `MiniDashboard.tsx`)
- Carousel of weeks: `< Week of MM/DD >`
- Per week shows: total orders, daily breakdown bars, avg time between submits, 76-Screen returns, distance to weekly bonus goal.
- Data source: existing `ecp.submissions` and `ecp.history` localStorage. No backend.
- Auto-saves: every confirmed order in the entry modal is already pushed to `submissions`. Add a `weekKey` (ISO week) field on write so the carousel can group.

---

## Phase 5 — Analyzer module (replaces Dialer)

New component `Analyzer.tsx`:
- Big paste textarea ("paste AS400 header / email quote / cart here").
- "Analyze" button runs `analyzePaste()` (already exists in `src/lib/pasteAnalyzer.ts`) and **routes** results:
  - `poNumber`, `custPo`, `custNumber`, `contact`, `address` → set as **active PO#** + create PO group in Notepad.
  - `netPrice`, `leadTime`, `shipFrom`, `dsFee`, `minFee`, `restockFee`, `vendorItem` → patched into the **currently focused T-Note** under the active PO#.
  - `cartLines` (subtotal/tax/freight/total) → dispatch event `ecp:cart-fill` consumed by SplitOrderCalc.
  - `orderAmount` → fills the PO Tracker "amount" field automatically (no re-typing).
- Show a small preview chip per detected field with target ("→ T-Note", "→ Cart", "→ Tracker") so the user sees where each piece went.
- Extend `pasteAnalyzer.ts` with regexes for: `Cust #`, `Cust PO`, `Contact`, `Ship To`, `Mail To`, line-count, `B/O`, `B|O`, `DS`.

---

## Phase 6 — Order entry modal (smaller, pre-filled)

`Index.tsx` AlertDialog:
- Drop the Cart text input — Cart is already in SplitOrderCalc.
- Pre-fill `PO#` from active PO#, `Amount` from last analyzer `orderAmount` (or selected split A/B if a split was made).
- Single row: `[PO#] [Amount] [Type pills]` then `[Submit] [Skip]`.
- Type pills: `PO` `76` `UNA-S` `UNA-D` `UNC` `Cancel` `Fraud` `Machinery`.
- If `Fraud` selected → expand inline (no second modal) with: reason dropdown, "went to credit?" yes/no, notes. Submit when complete.
- All fields auto-saved to `ecp.submissions` with `weekKey`, `salesAssociate`, timestamp.

---

## Phase 7 — Sales Associate identity + Team podium

**Header** (`Index.tsx`)
- Add a 3-letter Sales Associate input (saved `ecp.sa`, default empty).
- Header shows: `Hola! {SA} · ECP Data Entry Dashboard · {EST date} · {EST time}` (small digital clock, polled every 30 s, formatted via `Intl.DateTimeFormat` with `timeZone: "America/New_York"`).
- Footer keeps: `Created by W38 Michael Ponce™`.

**Podium widget** (new `Podium.tsx`, in col 4)
- Toggle: `[Daily] [Weekly]`.
- Team selector: dropdown of 10 teams (`Team + Sup first name`, hardcoded list, editable in localStorage `ecp.teams`).
- Shows top 3 within selected team. Source = localStorage **only** (single-user reality), so:
  - For now, podium reads `ecp.peers` — a manually editable list of `{sa, team, count}` entries the user types in (or pastes) so they can mock teammates' counts. Honest UX: a "share my count" button copies a JSON snippet they can paste into a teammate's dashboard.
  - Note this clearly in the UI: "Local-only — paste teammates' numbers to compare." (No backend = no real shared podium without Lovable Cloud; mention but don't add unless requested.)

**Tips widget** (replaces motivational quotes in GoalGauge)
- Rotate every 8 s through:
  - "No olvides tu M-Note en los BO"
  - "Saca tus órdenes antes del Cut Out Time"
  - `Estás a {goal-count} órdenes de tu meta diaria`
  - `Faltan {weekGoal-weekCount} órdenes para tu bono`
  - "Split tus órdenes antes del Cut Out"
- Daily/weekly variants picked based on time of day.

---

## Phase 8 — Vendor Vault enhancement

- Each vendor row already has a `portal` URL field. Add a "Copy link" button next to it (since dashboard is on physical machine, AS400 work happens in VM — paste-friendly).
- Add password reveal toggle (eye icon, masked by default).

---

## Files

**Modify (8):**
- `src/components/dashboard/Notepad.tsx` — sidebar, N/A defaults, empty-row fix, space-uppercase
- `src/components/dashboard/SplitOrderCalc.tsx` — silent confirm logic
- `src/components/dashboard/FormViewer.tsx` — load-count timing fix
- `src/components/dashboard/GoalGauge.tsx` — sizing, tips replace quotes
- `src/components/dashboard/VendorVault.tsx` — copy link, password reveal
- `src/lib/pasteAnalyzer.ts` — header fields, cart lines, BO/DS detection
- `src/pages/Index.tsx` — new grid, SA input, header clock, smaller modal, fraud inline
- `src/components/dashboard/GoalHistoryToggle.tsx` — repurposed inside PoTracker

**Create (4):**
- `src/components/dashboard/PoTracker.tsx` — merged Counter + Form + History + Daily toggle
- `src/components/dashboard/MiniDashboard.tsx` — week carousel
- `src/components/dashboard/Analyzer.tsx` — paste + route module (replaces Dialer)
- `src/components/dashboard/Podium.tsx` — team podium + tips

**Delete (1):**
- `src/components/dashboard/Dialer.tsx` — replaced by Analyzer

---

## Credit-efficiency notes

- All work is incremental on existing files; no rewrites of ui/* or hooks.
- Reuses existing localStorage keys where possible (`ecp.tnotes.v3`, `ecp.submissions`, `ecp.history`).
- Analyzer regexes are added to the existing `pasteAnalyzer.ts` — no new util files.
- Podium uses localStorage instead of backend → zero infra change.
- Phases 1+2 alone fix 80% of the user-reported bugs and can ship first if you want to break it up.

---

## Suggested execution order (if splitting builds)

1. Phase 1 (bug fixes only) — ship and validate.
2. Phases 2 + 3 + 6 (PO# sidebar + layout + smaller modal) — biggest UX win.
3. Phases 4 + 5 (PO Tracker merge + Analyzer module) — the workflow refactor.
4. Phases 7 + 8 (podium, tips, vendor polish) — nice-to-haves.

Approve all 8 to do it in one shot, or tell me which phases to keep.
