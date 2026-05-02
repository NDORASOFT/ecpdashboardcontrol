// Shared paste/text analyzer for routing pasted content to correct fields.

export type ParsedPaste = {
  poNumber?: string;
  custNumber?: string;
  custPo?: string;
  contact?: string;
  shipTo?: string;
  mailTo?: string;
  lineCount?: number;
  netPrice?: number;
  leadTime?: string;
  shipFrom?: string;
  dsFee?: number;
  minFee?: number;
  restockFee?: number;
  vendorItem?: string;
  senderName?: string;
  senderEmail?: string;
  orderAmount?: number;
  cart?: { subtotal?: number; tax?: number; freight?: number; total?: number };
  hasBO?: boolean;
  hasDS?: boolean;
  rawLines: string[];
};

const money = (s: string): number | undefined => {
  const m = s.replace(/[,\s]/g, "").match(/\$?\s*(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : undefined;
};

export const analyzePaste = (text: string): ParsedPaste => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: ParsedPaste = { rawLines: lines };

  const full = text;

  // PO# detection
  const poMatch = full.match(/\bPO\s*#?\s*:?\s*([A-Z0-9-]{3,20})/i);
  if (poMatch) result.poNumber = poMatch[1].toUpperCase();

  // Cust # / Cust PO
  const custNo = full.match(/cust(?:omer)?\s*#?\s*:?\s*([A-Z0-9-]{3,20})/i);
  if (custNo) result.custNumber = custNo[1].toUpperCase();
  const custPo = full.match(/cust(?:omer)?\s*PO\s*#?\s*:?\s*([A-Z0-9-]{3,30})/i);
  if (custPo) result.custPo = custPo[1].toUpperCase();

  // Email sender
  const fromMatch = full.match(/From:\s*([^\n<]+?)(?:\s*<([^>]+)>)?$/im);
  if (fromMatch) {
    const namePart = fromMatch[1].trim();
    result.senderName = namePart.split(/\s+/)[0];
    if (fromMatch[2]) result.senderEmail = fromMatch[2].trim();
  }
  if (!result.senderEmail) {
    const emailMatch = full.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) result.senderEmail = emailMatch[0];
  }

  // BO / DS detection (also B|O variants)
  result.hasBO = /\bB[\/|]?O\b|\bbs\b/i.test(full);
  result.hasDS = /\bDS\b/.test(full);

  // Line count
  const lc = full.match(/(\d+)\s*lines?/i);
  if (lc) result.lineCount = parseInt(lc[1], 10);

  // Cart parsing (subtotal/tax/freight/total)
  const cart: ParsedPaste["cart"] = {};
  for (const line of lines) {
    const l = line.toLowerCase();
    if (/\b(sub\s*t(o(t(a(l)?)?)?)?|subtotal)\b/.test(l) && cart.subtotal == null) {
      cart.subtotal = money(line);
    } else if (/\b(tax|tx|impuesto|iva)\b/.test(l) && cart.tax == null) {
      cart.tax = money(line);
    } else if (/\b(freight|frt|frgh|shipping|ship|env[ií]o|flete)\b/.test(l) && cart.freight == null) {
      cart.freight = money(line);
    } else if (/\b(tot(al)?|grand\s*total|order\s*total)\b/i.test(l) && cart.total == null) {
      cart.total = money(line);
    }

    // Net price
    if (/net\s*price|unit\s*price|price\s*each/i.test(l) && !result.netPrice) {
      result.netPrice = money(line);
    }
    // Lead time
    if (/lead\s*time|delivery|ship\s*date|eta/i.test(l) && !result.leadTime) {
      const val = line.replace(/^.*?:\s*/i, "").trim();
      if (val) result.leadTime = val;
    }
    // Ship from
    if (/ship\s*from|warehouse|location|origin/i.test(l) && !result.shipFrom) {
      const val = line.replace(/^.*?:\s*/i, "").trim();
      if (val) result.shipFrom = val;
    }
    // Ship to
    if (/ship\s*to/i.test(l) && !result.shipTo) {
      result.shipTo = line.replace(/^.*?:\s*/i, "").trim();
    }
    // Mail to
    if (/mail\s*to|bill\s*to/i.test(l) && !result.mailTo) {
      result.mailTo = line.replace(/^.*?:\s*/i, "").trim();
    }
    // Contact
    if (/contact|attn/i.test(l) && !result.contact) {
      result.contact = line.replace(/^.*?:\s*/i, "").trim();
    }
    // DS fee
    if (/d\.?s\.?\s*fee|drop\s*ship\s*fee/i.test(l) && result.dsFee == null) {
      result.dsFee = money(line);
    }
    // Min fee
    if (/\bmin(imum)?\s*(order)?\s*fee\b|\bmin\b.*\$/i.test(l) && result.minFee == null) {
      result.minFee = money(line);
    }
    // Restock fee
    if (/restock|restockable|return(able)?\s*fee/i.test(l) && result.restockFee == null) {
      result.restockFee = money(line);
    }
    // Vendor item
    if (/vendor\s*item|mfg\s*part|item\s*#|part\s*#|catalog\s*#/i.test(l) && !result.vendorItem) {
      const val = line.replace(/^.*?[:#]\s*/i, "").trim();
      if (val) result.vendorItem = val.toUpperCase();
    }
    // Order amount
    if (/order\s*amount|order\s*total|total\s*amount/i.test(l) && result.orderAmount == null) {
      result.orderAmount = money(line);
    }
  }

  if (Object.keys(cart).length > 0) result.cart = cart;
  if (result.orderAmount == null && cart.total != null) result.orderAmount = cart.total;

  // Fallback: single dollar amount = netPrice
  if (result.netPrice == null && result.orderAmount == null) {
    const allMoney = full.match(/\$\s*\d+(?:,\d{3})*(?:\.\d+)?/g);
    if (allMoney?.length === 1) {
      result.netPrice = money(allMoney[0]);
    }
  }

  return result;
};

export const formatMoney = (n: number | string | undefined): string => {
  if (n == null || n === "") return "";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return String(n);
  return `$${v.toFixed(2)}`;
};
