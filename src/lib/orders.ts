// Local-first orders store. Each order is keyed by PO# and tied to a date.
// Cuts: 1st cut = day 10, 2nd cut = day 25 (each month).

export type OrderCart = {
  label: "main" | "a" | "b" | "sum";
  subtotal: number;
  tax: number;
  freight: number;
  total: number;
};

export type Order = {
  po: string;
  ps: string; // packing slip
  amount: number; // primary amount used in dashboard (cart total)
  cart?: OrderCart; // last cart copied
  splitCarts?: { a?: OrderCart; b?: OrderCart; sum?: OrderCart };
  notes?: string; // formatted T-note text snapshot (optional)
  is76: boolean; // doesn't count toward goal
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
};

const KEY = "ecp.orders.v1";

export const loadOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
};

export const saveOrders = (orders: Order[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent("ecp:orders:changed"));
  } catch {
    /* noop */
  }
};

export const upsertOrder = (po: string, patch: Partial<Order>) => {
  const trimmed = (po || "").trim().toUpperCase();
  if (!trimmed) return;
  const orders = loadOrders();
  const idx = orders.findIndex((o) => o.po === trimmed);
  const now = new Date().toISOString();
  if (idx >= 0) {
    orders[idx] = { ...orders[idx], ...patch, po: trimmed, updatedAt: now };
  } else {
    orders.unshift({
      po: trimmed,
      ps: "",
      amount: 0,
      is76: detectIs76(trimmed),
      createdAt: now,
      updatedAt: now,
      ...patch,
    } as Order);
  }
  saveOrders(orders);
};

export const removeOrder = (po: string) => {
  const trimmed = (po || "").trim().toUpperCase();
  saveOrders(loadOrders().filter((o) => o.po !== trimmed));
};

export const detectIs76 = (po: string) => /^76/i.test((po || "").trim());

// Cut helpers
export type Cut = { label: string; start: Date; end: Date };

export const cutsForMonth = (year: number, month: number): Cut[] => {
  // month: 0-11
  const c1Start = new Date(year, month - 1, 26); // 26 prev month → 10 of this month
  const c1End = new Date(year, month, 10, 23, 59, 59);
  const c2Start = new Date(year, month, 11);
  const c2End = new Date(year, month, 25, 23, 59, 59);
  const c3Start = new Date(year, month, 26);
  const c3End = new Date(year, month + 1, 10, 23, 59, 59);
  return [
    { label: `Cut 1 (${fmtMD(c1Start)}–${fmtMD(c1End)})`, start: c1Start, end: c1End },
    { label: `Cut 2 (${fmtMD(c2Start)}–${fmtMD(c2End)})`, start: c2Start, end: c2End },
    { label: `Cut 3 (${fmtMD(c3Start)}–${fmtMD(c3End)})`, start: c3Start, end: c3End },
  ];
};

const fmtMD = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

export const inRange = (iso: string, start: Date, end: Date) => {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
};

// Week helpers (Mon-Sun)
export const weekRange = (date: Date) => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Mon
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
