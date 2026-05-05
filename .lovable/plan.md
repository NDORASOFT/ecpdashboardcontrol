## Goal

Merge **OrderCounter** + **FormViewer** into a single module called **Tracker** that auto-counts each Google Form submission by detecting iframe navigation stages, and relocate the PO# / PO total counters into the totals area.

---

## New component: `src/components/dashboard/Tracker.tsx`

Single card that replaces both `OrderCounter` and `FormViewer`. Layout:

```text
┌────────────────────────────────────────────────┐
│ [#] Tracker         Hoy        [⚡] [⟳] [✏][🗑]│
├────────────────────────────────────────────────┤
│   [ – ]      0  PO#TOTAL       [ + ]           │
│           ─────────────────                    │
│      [–] 0 PO  [+]   [–] 0 OTROS [+]           │
├────────────────────────────────────────────────┤
│  URL input (only when empty / editing)         │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │     <iframe Google Form>                 │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│  Stage: viewform | submitting | new entry      │
└────────────────────────────────────────────────┘
```

- The big number (was "TOTAL") is renamed **PO#TOTAL** — same `count` value.
- The PO / Otros sub-counters stay below in the same two-pill layout.
- Below them: URL input + iframe + a small status line showing the detected stage.

---

## Auto-tracking logic (the core change)

Cross-origin iframes block URL reading, but the iframe's `load` event still fires on every navigation. The Google Form lifecycle reliably produces these stages:

```text
viewform        →  load #1  (initial)
formResponse    →  load #2  (user clicked Submit)
formResponse    →  load #3  (user clicked "Submit another response" → back to viewform)
                            (in practice: viewform reload counts as load #3)
```

Heuristic implementation in `Tracker.tsx`:

1. Track `loadCount` via `iframe.onload`.
2. Track `lastLoadAt` timestamp.
3. Ignore the very first load (initial mount / reload button).
4. On each subsequent load:
   - If time since previous load is between **1.5s and 5min** AND the iframe was focused at some point in that window → treat as a **submission stage transition**.
   - Maintain a small state machine: `idle → submitting → counted`.
     - First qualifying load after `idle` ⇒ go to `submitting` (Submit was pressed).
     - Next qualifying load while in `submitting` ⇒ this is the "new entry" reload ⇒ **auto-increment counter** and open the type prompt (PO / Otro), then go back to `idle`.
5. Manual reload (clicking the ⟳ button) resets the state machine and is excluded from the count.
6. Keep the existing **⚡ auto-detect toggle** as a master on/off. When OFF, only manual +/- works.
7. Keep the existing PO/Otro confirm dialog from `Index.tsx` (triggered via `onSubmitDetected`).

This avoids any cross-origin reads — only the `load` event count + timing is used.

---

## Layout changes in `src/pages/Index.tsx`

Replace the current "Counter + FormViewer" stacked column with a single `<Tracker />` that occupies the full `col-span-4 row-span-2` slot.

Remove imports of `OrderCounter` and `FormViewer` from `Index.tsx`. Pass through:
- `count, setCount, poCount, setPoCount, otherCount, setOtherCount, onReset`
- `onSubmitDetected` (still opens the existing AlertDialog for PO / Otro)

`OrderCounter.tsx` and `FormViewer.tsx` files are deleted (logic moves into `Tracker.tsx`).

---

## Files

**Create**
- `src/components/dashboard/Tracker.tsx` — merged component with stage detection, big PO#TOTAL, PO/Otro pills, URL input, iframe.

**Edit**
- `src/pages/Index.tsx` — swap the two stacked components for one `<Tracker />`.

**Delete**
- `src/components/dashboard/OrderCounter.tsx`
- `src/components/dashboard/FormViewer.tsx`

---

## Notes / limitations

- Browser security forbids reading the iframe's URL across origins, so we cannot literally see `viewform` vs `formResponse`. The 2-load cycle within a focused window is the most reliable proxy and matches the exact stages you described.
- ⚡ stays as the manual override; if a stage is missed (e.g. user abandons), the +/- buttons are always there.
