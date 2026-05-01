// Parse "Lead Time" free-text into business days, then compute ESD.
// Supports: "1 day", "2 days", "2 week(s)", "3 wk", "5 business days",
// "1 month", "ETA 4/30/2026", "by 4/30", "in stock" (=> 0), bare numbers (assume days).

export type LeadParse = {
  businessDays: number | null;
  explicitDate: Date | null;
  pretty: string; // human label of what we understood
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const addBusinessDays = (start: Date, days: number): Date => {
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
};

export const parseLeadTime = (raw: string): LeadParse => {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return { businessDays: null, explicitDate: null, pretty: "" };

  if (/(in\s*stock|in-stock|stock|same\s*day|today|asap)/.test(s))
    return { businessDays: 0, explicitDate: null, pretty: "in stock" };

  // explicit date M/D or M/D/YYYY
  const md = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (md) {
    const m = parseInt(md[1]) - 1;
    const d = parseInt(md[2]);
    let y = md[3] ? parseInt(md[3]) : new Date().getFullYear();
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    if (!isNaN(date.getTime())) {
      return { businessDays: null, explicitDate: date, pretty: `date ${m + 1}/${d}` };
    }
  }

  // "April 30", "Apr 30 2026"
  const mword = s.match(/\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\.?\s+(\d{1,2})(?:[,\s]+(\d{2,4}))?/);
  if (mword) {
    const m = MONTHS[mword[1]];
    const d = parseInt(mword[2]);
    let y = mword[3] ? parseInt(mword[3]) : new Date().getFullYear();
    if (y < 100) y += 2000;
    const date = new Date(y, m, d);
    return { businessDays: null, explicitDate: date, pretty: `date ${m + 1}/${d}` };
  }

  // ranges "2-3 weeks" -> use the upper bound
  const range = s.match(/(\d+)\s*[-–to]+\s*(\d+)\s*(day|days|d|wk|wks|week|weeks|month|months|mo)/);
  if (range) {
    const n = parseInt(range[2]);
    const unit = range[3];
    const days = unitToDays(n, unit);
    return { businessDays: days, explicitDate: null, pretty: `${range[1]}-${n} ${unit}` };
  }

  // "2 weeks", "5 days", "1 month", "10 business days"
  const m = s.match(/(\d+)\s*(business\s+days?|days?|d|wk|wks|weeks?|months?|mo)/);
  if (m) {
    const n = parseInt(m[1]);
    const unit = m[2];
    const days = unitToDays(n, unit);
    return { businessDays: days, explicitDate: null, pretty: `${n} ${unit}` };
  }

  // bare number => assume business days
  const bare = s.match(/^(\d+)$/);
  if (bare) {
    const n = parseInt(bare[1]);
    return { businessDays: n, explicitDate: null, pretty: `${n} bd` };
  }

  return { businessDays: null, explicitDate: null, pretty: "" };
};

const unitToDays = (n: number, unit: string): number => {
  if (/^(wk|wks|week|weeks)$/.test(unit)) return n * 5; // business weeks
  if (/^(month|months|mo)$/.test(unit)) return n * 22;
  return n; // days
};

export const computeESD = (raw: string): { date: Date | null; label: string } => {
  const p = parseLeadTime(raw);
  if (p.explicitDate) return { date: p.explicitDate, label: formatESD(p.explicitDate) };
  if (p.businessDays != null) {
    const d = p.businessDays === 0 ? new Date() : addBusinessDays(new Date(), p.businessDays);
    return { date: d, label: formatESD(d) };
  }
  return { date: null, label: "" };
};

const formatESD = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const wd = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][d.getDay()];
  return `${wd} ${mm}/${dd}/${yy}`;
};

/** Format date as MMDDYY (no slashes) for storage/copy */
export const formatDateStorage = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}${dd}${yy}`;
};

/** Format date as MM/DD/YY for display */
export const formatDateDisplay = (d: Date) => {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};
