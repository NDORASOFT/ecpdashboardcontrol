# Match Reference Design + Fill Empty Space

Redesign the dashboard cards to mimic the reference (soft rounded cards, pastel tinted "feature" tiles with an icon chip top-left, a `••` menu top-right, big title bottom-left and a small meta line). Fill the empty area below Col 4 with a wide footer "summary" pill card matching the reference's "You created 8 scenes / See All" row.

## 1. New shared visual primitives (`src/components/dashboard/ui/SceneCard.tsx`)
- `SceneCard` wrapper: `rounded-3xl`, soft shadow, padded, supports `tone` prop (`sky` pastel-blue, `cream` white, `mint`, `coral`, `sun`).
- Top row: circular icon chip (40px, tinted bg) + `••` menu dot affordance.
- Bottom block: large display title + tiny muted meta line.
- `SummaryPill`: wide rounded card with `(+)` chip, two-line label on left, dark pill button on right ("See All" / action).

Add a tone palette in `index.css`:
- `--tile-sky: 215 90% 88%`, `--tile-cream: 40 30% 99%`, `--tile-mint: 150 55% 86%`, `--tile-coral: 14 90% 88%`, `--tile-sun: 48 100% 86%`.

## 2. Apply tile aesthetic to existing modules
Wrap (don't rewrite logic) the headers of these in the new `SceneCard` look:
- `Calculator.tsx` → tone `sky`, icon Calculator.
- `SplitOrderCalc.tsx` → tone `cream`, icon ShoppingCart.
- `VendorVault.tsx` → tone `mint`, icon Store.
- `FormViewer.tsx` → tone `cream`, icon ClipboardList.
- `Notepad.tsx` → tone `sun`, icon StickyNote.
- `GoalGauge.tsx` → tone `coral`, icon Target.

The functional bodies (inputs, gauges, iframes, lists) stay; only the card chrome + header changes for visual consistency.

## 3. Fill the empty space (Col 4 below Goal)
`Index.tsx` Col 4 currently leaves a tall gap because `GoalHistoryToggle` doesn't stretch. Add below it:
- `DailySummaryCard` (`SceneCard` tone `cream`, vertical) showing: today's total count, PO count, Other count, % to goal — mirrors the "8 scenes / 24 devices in use" stat density of the reference.
- A `SummaryPill` spanning the bottom of `<main>` (full width under all 4 columns) with `(+)` chip, "You logged N orders today · M toward goal" label, and a dark "Reset day" pill button (wires to existing `resetAll`).

## 4. Layout polish in `Index.tsx`
- Wrap `<main>` children in a vertical flex so the 4 columns row sits above the new full-width `SummaryPill`.
- Make Col 4 a `flex flex-col gap-3 h-[640px]`: `GoalHistoryToggle` `flex-1`, `DailySummaryCard` fixed ~`h-[16rem]`. No more dead space.
- Use consistent `rounded-3xl`, `shadow-soft`, `p-4` across cards via the new primitive.

## Technical notes
- No data model changes; `DailySummaryCard` reads existing `count`, `poCount`, `otherCount`, `GOAL` props passed from `Index`.
- `SummaryPill` `onAction` prop wires to `resetAll`.
- All tints use HSL tokens so dark mode still works (dark mode mutes the tint to ~20% saturation via `.dark` overrides).
- Keeps AS400 black/yellow data fields inside Notepad/Cart untouched per existing memory rule.

## Files
- add: `src/components/dashboard/ui/SceneCard.tsx`, `src/components/dashboard/DailySummaryCard.tsx`
- edit: `src/index.css` (tile tokens), `src/pages/Index.tsx` (layout + summary pill), and the 6 module headers listed above.
