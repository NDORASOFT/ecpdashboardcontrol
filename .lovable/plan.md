## Fixes & Refactor Plan

### 1. Bug: PO# creates a sidebar tab per letter typed
**Root cause** (`Notepad.tsx`): the `poNumber` field is written into `tnotes` on every keystroke. The `poGroups` memo derives groups directly from `tnotes`, so each intermediate string ("V", "VE", "VER"…) becomes a sidebar pill.

**Fix**: keep PO# input as local component state while editing, and only commit it to the t-note (and update `activePO`) on `blur` or `Enter`. The sidebar will then only show finalized PO#s.

### 2. T-Notes sizing & scroll
- Reduce T-Note card width ~20% (`w-[18rem]` → `w-[14.5rem]`) and font/padding accordingly.
- T-Note container becomes vertically scrollable (`overflow-y-auto`, fixed `max-h`) so it doesn't push the page.
- Whole `Notepad` column gets a tall fixed height (~`h-[640px]`) matching the FormViewer.
- Any horizontally-overflowing field gets `overflow-x-auto` (no wrapping pushing layout wider).

### 3. Embed Analyzer inside T-Notes
- Move `Analyzer` panel out of the bottom row.
- Add a collapsible "Analyzer" disclosure inside the PO# Notes card header (toggle button next to "Analyze"). When open, shows the full analyzer UI inline above the t-notes list.
- Delete the bottom Analyzer column from `Index.tsx`.

### 4. Remove Podium and Stats (temporary)
- Remove `<Podium />` from `Index.tsx`.
- Remove the "Stats" tab from `GoalHistoryToggle.tsx` (toggle becomes Goal/Log only).
- Files left in repo for later, just unmounted.

### 5. Daily Goal — mini history + editable goal
- `GoalGauge` gets:
  - Editable goal: click the goal number to inline-edit; persisted to `ecp.goal` (default 70).
  - Below the gauge, a compact list of the **last 5 submissions** (PO#, type pill, amount) read from `ecp.submissions`.
- Goal logic: count toward goal = every submission **except** `type === "76 Screen"`. Update the daily counter so 76-screen entries still increment `otherCount` but **not** the goal-tracked `count`. Adjust `Index.tsx` `confirmType` accordingly (split totals: `count` = goal-relevant, separate `otherCount` for 76).

### 6. Layout — business-card sizing
Reference: business card ≈ 3.5in × 2in (~22rem × 12rem horizontal, or 12rem × 22rem vertical).

```
┌──────────────┬──────────┬───────────────┬──────────┐
│ PO# Notes    │ Calc     │ Form Viewer   │ Goal     │
│ (vertical    │ Cart     │ (BC + 20%     │ (vert    │
│  cards,      │ Vendor   │  wide, tall)  │  BC)     │
│  scroll)     │ Vault    │               │ +mini    │
│              │ (stacked │               │ history  │
│              │  BC      │               │          │
│              │  width)  │               │          │
└──────────────┴──────────┴───────────────┴──────────┘
```

Concrete column widths in `Index.tsx`:
- Col 1 (PO# Notes): `w-[14rem]` (vertical BC), tall `h-[640px]`.
- Col 2 (Calc / Cart / VendorVault stacked): `w-[22rem]` (horizontal BC width); each card ~`h-[12rem]` to `h-[14rem]`.
- Col 3 (FormViewer w/ merged counter): `w-[26rem]` (BC + 20%), tall `h-[640px]`.
- Col 4 (Goal): `w-[14rem]` (vertical BC), tall.

All inner content gets `overflow-auto` (scroll) so a card never expands beyond its box. `items-start` retained so columns don't stretch.

### 7. Cart size
Cart (`SplitOrderCalc`) widened to the new col-2 width (`w-[22rem]`), with internal `overflow-y-auto` if content grows.

---

### Files to modify
- `src/components/dashboard/Notepad.tsx` — local PO# input state with blur-commit; smaller cards; embedded Analyzer disclosure; internal scroll.
- `src/components/dashboard/GoalGauge.tsx` — editable goal + last-5 history list.
- `src/components/dashboard/GoalHistoryToggle.tsx` — remove Stats tab; pass goal setter.
- `src/pages/Index.tsx` — new column structure; remove Podium + bottom Analyzer; move VendorVault under Cart; persist editable `ecp.goal`; adjust `confirmType` so 76-screen doesn't increment goal `count`.
- `src/components/dashboard/SplitOrderCalc.tsx` — width adjust + internal scroll only.

### Files unmounted (kept on disk)
- `src/components/dashboard/Podium.tsx`
- `src/components/dashboard/StatsView.tsx`
- `src/components/dashboard/Analyzer.tsx` (now mounted inside Notepad instead of standalone)

No new dependencies. Pure layout + state refactor.
