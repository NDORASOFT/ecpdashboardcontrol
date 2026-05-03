## Fixes for PO# sidebar, infinite T-Notes, layout sizing & module merge

### 1. PO# sidebar creating a tab per keystroke (`Notepad.tsx`)
**Root cause:** `updateTNote` calls `setActivePO(newPo)` on every `onChange` of the PO# input, so each character creates/switches a PO group.

**Fix:**
- Remove the `setActivePO` side-effect from `updateTNote`.
- Only commit the PO# (uppercase + switch active group) on `onBlur` of the PO# field.
- Remove the `{groupCount}n` count badge under each sidebar pill (per request — that running number is misleading).
- Trim sidebar pill to a single line: just the PO# label.

### 2. Infinite empty T-Notes being created (`Notepad.tsx`)
**Root cause:** The "ensure one empty per group" effect depends on `tnotes` and `activePO`. Because issue #1 mutates `activePO` on every keystroke, the effect re-runs against a freshly-seen group with no empties and prepends new ones repeatedly. Fixing #1 stops the runaway, but harden the effect too:

- Guard: only insert a new empty if there is **no T-Note** at all in the active group (`groupNotes.length === 0`), not just "no empty one". When a group has any note (even partially filled), the user can press "+ Note" to add another.
- Keep the dedupe branch for safety.

### 3. Layout sizing — only PO# Notes grows; others fixed (`Index.tsx`)
Convert the main grid to **fixed-width columns** so other modules stop stretching when T-Notes grow:

```text
┌─────────────┬──────────┬──────────┬─────────┐
│ PO# Notes   │ Calc     │ Tracker  │ Goal    │
│ (grows ↕)   │ (fixed)  │ (fixed)  │ Podium  │
│   ~4in W    │ 3.35in W │ ~equal   │ (fixed) │
│             │          │ to 3 t-  │         │
│             │ Cart     │ notes W) │         │
│             │ (fixed)  │          │         │
└─────────────┴──────────┴──────────┴─────────┘
```

Concrete changes in `src/pages/Index.tsx`:
- Replace the `grid-cols-12` flex weights with explicit column widths via inline styles or a CSS grid template:
  - PO# Notes: `width: ~22rem` (~4 in / 10 cm) — `min-h-[600px]` AND allowed to grow.
  - Calculator+Cart column: `width: ~13.5rem` (~3.35 in / 8.5 cm), `h-fit` so it never stretches.
  - Tracker column (merged): `width: ~22rem` (about width of 3 T-notes), `h-fit`.
  - Goal+Podium column: `width: ~12rem`, `h-fit`.
- Remove `min-h-[600px]` from non-PO# columns; add `self-start` so they sit at the top regardless of PO# Notes height.
- Within Notepad's T-Note cards: shrink each card to roughly **3in wide × 4in tall**:
  - T-Note card: `w-[18rem]` (~3in), `min-h-[15rem]` (~4in tall content area).
  - Reduce internal padding from `p-2.5` to `p-2` and field gap from `space-y-1` to `space-y-0.5` so all 10 base fields fit in the shorter card.

### 4. Merge PO Counter into Form Viewer (one module)
Goal: a single `Order Tracker` card containing the counter at top + iframe below.

**Approach (minimum churn):**
- Modify `FormViewer.tsx` to accept counter props (`count, poCount, otherCount, setters, onReset`) and render a slim counter strip in its header row (left of `Contar`):
  - `[− PO# nn +]   [76: nn]   [Total: nn]   [Reset]   [Contar] [⚡] [↻]`
  - Counter strip uses compact pill buttons (h-7), tabular-nums.
- Delete the standalone `<OrderCounter>` block from `Index.tsx` col 3; pass the counter state/setters into `<FormViewer>` instead.
- Keep `OrderCounter.tsx` file in place but unused (can delete in a later pass — leaving it avoids touching imports across the project).
- Tracker column in the new layout becomes a single `<FormViewer>` card sized to ~3 T-notes wide × full available height, with `h-fit` so it doesn't stretch when PO# Notes grow.

### Files to modify
1. `src/components/dashboard/Notepad.tsx` — fixes 1, 2, plus T-Note card sizing.
2. `src/pages/Index.tsx` — fixed-width columns, remove `<OrderCounter>` from col 3, pass counter props to `<FormViewer>`.
3. `src/components/dashboard/FormViewer.tsx` — accept counter props, render counter strip in header.

No new files. No deletes (keep `OrderCounter.tsx` orphaned for now to save credits).

### Out of scope (not changed)
- Analyzer, VendorVault, GoalGauge, Podium logic untouched.
- Submission modal flow untouched.
- localStorage keys untouched (`ecp.count`, `ecp.count.po`, `ecp.count.other`, `ecp.tnotes.v3`, `ecp.activePO`).
