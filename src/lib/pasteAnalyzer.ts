// Shared paste/text analyzer for routing pasted content to correct fields.

export type ParsedPaste = {
  poNumber?: string;
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
  const lower = full.toLowerCase();

  // PO# detection
  const poMatch = full.match(/\bPO\s*#?\s*:?\s*([A-Z0-9-]{3,20})/i);
  if (poMatch) result.poNumber = poMatch[1].toUpperCase();

  // Email sender
  const fromMatch = full.match(/From:\s*([^\n<]+?)(?:\s*<([^>]+)>)?$/im);
  if (fromMatch) {
    const namePart = fromMatch[1].trim();
    result.senderName = namePart.split(/\s+/)[0];
    if (fromMatch[2]) result.senderEmail = fromMatch[2].trim();
  }
  // Standalone email
  if (!result.senderEmail) {
    const emailMatch = full.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
    if (emailMatch) result.senderEmail = emailMatch[0];
  }

  for (const line of lines) {
    const l = line.toLowerCase();

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
    // DS fee / drop ship fee
    if (/d\.?s\.?\s*fee|drop\s*ship\s*fee/i.test(l) && result.dsFee == null) {
      result.dsFee = money(line);
    }
    // Min fee / minimum
    if (/\bmin(imum)?\s*(order)?\s*fee\b|\bmin\b.*\$/i.test(l) && result.minFee == null) {
      result.minFee = money(line);
    }
    // Restock fee
    if (/restock|restockable|return(able)?\s*fee/i.test(l) && result.restockFee == null) {
      result.restockFee = money(line);
    }
    // Vendor item / MFG part / item #
    if (/vendor\s*item|mfg\s*part|item\s*#|part\s*#|catalog\s*#/i.test(l) && !result.vendorItem) {
      const val = line.replace(/^.*?[:#]\s*/i, "").trim();
      if (val) result.vendorItem = val.toUpperCase();
    }
    // Order amount / total
    if (/order\s*amount|order\s*total|total\s*amount/i.test(l) && result.orderAmount == null) {
      result.orderAmount = money(line);
    }
  }

  // Fallback: if only one dollar value in entire text and no netPrice yet
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
