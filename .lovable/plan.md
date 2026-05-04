
Plan: rebalancear el layout del dashboard.

**Cambios en `src/pages/Index.tsx` (grid layout)**

Reorganizar la cuadrícula de 12 columnas para:

1. **Calculadora**: más corta (no row-span-2). Una sola altura, ~min-h-[340px].
2. **To-Do + OrderCounter merged**: nueva columna grande que ocupa ~1/3 del ancho y se extiende verticalmente (row-span-2), uniendo la lista de tareas arriba y el contador de órdenes abajo dentro de la misma card-area.
3. **FormViewer**: se mantiene grande (col-span-4, row-span-2).
4. **GoalGauge** + **MoodChip**: se mantienen a la derecha apilados.
5. **Notepad**: agrandar (col-span-5 o 6, min-h ~360px).
6. **QuoteBucket**: achicar (col-span-3, min-h ~280px).
7. **HistoryTable**: ocupa el ancho restante abajo.

Nuevo esquema aproximado:

```text
Row1: [Calc 3] [TodoList 3 rs2] [FormViewer 4 rs2] [GoalGauge 2]
Row2: [Notepad 3 (debajo de Calc)]               [MoodChip 2]
Row3: [OrderCounter 3 (debajo Todo? o merge)] [QuoteBucket 3] [History 6]
```

Mejor opción: crear un wrapper "TodoList + OrderCounter" como una columna stack:

```text
Row1: [Calc 3]      [Todo+Counter 3 rs2] [FormViewer 4 rs2] [Goal 2]
Row2: [Notepad 5]   [(continúa)]         [(continúa)]       [Mood 2]
Row3: [Notepad cont? no] [Quote 3] [History 6] ...
```

Layout final propuesto (12 cols):

- Fila 1: Calc(3) | TodoCounter(3, row-span-2) | FormViewer(4, row-span-2) | Goal(2)
- Fila 2: Notepad(3) | — | — | Mood(2)
- Fila 3: Notepad cont... no. Mejor:
  - Calc(3) h≈340
  - Notepad(3) h≈340 debajo
  - Columna media TodoCounter(3) h≈700 (todo arriba, contador abajo dentro de la misma card o dos cards stacked)
  - FormViewer(4) h≈700
  - Goal(2) + Mood(2) apilados a la derecha h≈340 c/u
- Fila 3 (full): Quote(4) + History(8)

**Merge Todo + Counter**: crear nuevo componente `TodoCounterColumn.tsx` que envuelva ambos en una sola columna con dos cards (Todo arriba flex-1, Counter abajo compacto). Alternativa más simple: en `Index.tsx` usar un `<div className="flex flex-col gap-4 h-full">` con `<TodoList />` y `<OrderCounter />` dentro de un col-span-3 row-span-2.

Voy por la alternativa simple (sin componente nuevo).

**Cambios tipográficos en cards**

Bajar un nivel los títulos de cada card. Actualmente usan `text-sm font-semibold`. Cambiar a `text-xs font-semibold` en los headers de:
- Calculator.tsx
- Notepad.tsx
- TodoList.tsx
- QuoteBucket.tsx
- FormViewer.tsx
- OrderCounter.tsx
- GoalGauge.tsx
- HistoryTable.tsx

Y los subtítulos de `text-[10px]` → `text-[9px]` (mantener legibilidad pero un step menor).

**Quitar estado "empezando" del MoodChip / GoalGauge**

Revisar `GoalGauge.tsx` para encontrar el estado inicial llamado "empezando" (3 estados: bajo, medio, meta). Eliminar el label/face de "empezando" — cuando count es 0 o muy bajo, no mostrar nada (o mostrar vacío) hasta que cruce el umbral del estado "bajo". Necesito leer el archivo para saber el wording exacto.

**Archivos a modificar**

1. `src/pages/Index.tsx` — reestructurar grid, mergear Todo+Counter en una columna.
2. `src/components/dashboard/Calculator.tsx` — bajar título.
3. `src/components/dashboard/Notepad.tsx` — bajar título.
4. `src/components/dashboard/TodoList.tsx` — bajar título.
5. `src/components/dashboard/QuoteBucket.tsx` — bajar título.
6. `src/components/dashboard/FormViewer.tsx` — bajar título.
7. `src/components/dashboard/OrderCounter.tsx` — bajar título.
8. `src/components/dashboard/GoalGauge.tsx` — bajar título + remover estado "empezando".
9. `src/components/dashboard/HistoryTable.tsx` — bajar título.

**Resultado visual esperado**

- Calculadora compacta (no domina la altura).
- To-Do alto + contador de órdenes pegado abajo, juntos ocupando ~1/3 vertical.
- Notepad notablemente más grande.
- Quote Requests más pequeño.
- Form viewer y goal/mood igual.
- Tipografía un punto más fina y sin la cara/label inicial "empezando".
