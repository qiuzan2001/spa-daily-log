import { ParsedNotation, ParsedItem, ServiceCodeDef } from "@/types";
import { DEFAULT_SERVICE_CODES, buildAliasMap } from "./service-codes";

const aliasMap = buildAliasMap(DEFAULT_SERVICE_CODES);

/**
 * Normalize separators: +, ，, ,, /, \, multiple spaces, newlines → "+"
 */
function normalizeSeparators(text: string): string {
  return text
    .replace(/[，、]/g, ",")       // Chinese commas → English comma
    .replace(/[\/\\]/g, "+")       // slashes → +
    .replace(/\s*,\s*/g, "+")      // comma with spaces → +
    .replace(/\s*\+\s*/g, "+")     // normalize spaces around +
    .replace(/\s+/g, "+")          // remaining whitespace → +
    .replace(/^\+/, "")            // leading +
    .replace(/\+$/, "")            // trailing +
    .replace(/\++/g, "+");         // collapse multiple +
}

/**
 * Try to match a token against the alias map.
 * Returns the matched ServiceCodeDef or null.
 * Prefers longer aliases to avoid partial matches (e.g. "CBD" vs "C").
 */
function matchAlias(token: string): { code: ServiceCodeDef; matchedAlias: string } | null {
  const lower = token.toLowerCase();
  // Check exact match first
  const exact = aliasMap.get(lower);
  if (exact) return { code: exact, matchedAlias: token };

  // Build sorted entries: longest alias first to avoid partial matches
  const entries = Array.from(aliasMap.entries()).sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [alias, code] of entries) {
    if (lower.startsWith(alias)) {
      return { code, matchedAlias: token.slice(0, alias.length) };
    }
  }

  return null;
}

/**
 * Check if a string is purely numeric (integer or decimal)
 */
function isNumeric(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s);
}

/**
 * Parse a service notation string into structured data.
 *
 * @param rawText - The raw text from OCR or manual input
 * @returns ParsedNotation with all fields
 *
 * @example
 * parseServiceNotation("80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15")
 */
export function parseServiceNotation(rawText: string): ParsedNotation {
  const warnings: string[] = [];
  const unknownTokens: string[] = [];
  const items: ParsedItem[] = [];
  let massageBase = 0;
  let cardTip = 0;
  let cashTip = 0;

  // Step 1: Normalize
  const normalized = normalizeSeparators(rawText.trim());

  if (!normalized) {
    return {
      rawText,
      massageBase: 0,
      items: [],
      cardTip: 0,
      cashTip: 0,
      massageTotal: 0,
      facialTotal: 0,
      serviceTotal: 0,
      totalWithTips: 0,
      unknownTokens: [],
      warnings: ["原始记账内容为空"],
    };
  }

  // Step 2: Split by +
  const tokens = normalized.split("+").filter((t) => t.length > 0);

  let foundMassageBase = false;

  for (const token of tokens) {
    const trimmed = token.trim();

    // Try to match as alias + amount (e.g. "油5", "美35.5", "T15")
    const match = trimmed.match(/^([a-zA-Z\u4e00-\u9fff]+)(\d+(?:\.\d+)?)$/);
    if (match) {
      const [, alias, amountStr] = match;
      const amount = parseFloat(amountStr);

      // Check if it's a tip
      const tipMatch = matchAlias(alias);
      if (tipMatch && tipMatch.code.category === "card_tip") {
        cardTip += amount;
        items.push({
          code: tipMatch.code.chineseName,
          name: tipMatch.code.name,
          amount,
          category: "card_tip",
          originalToken: trimmed,
          confidence: 1.0,
        });
        continue;
      }
      if (tipMatch && tipMatch.code.category === "cash_tip") {
        cashTip += amount;
        items.push({
          code: tipMatch.code.chineseName,
          name: tipMatch.code.name,
          amount,
          category: "cash_tip",
          originalToken: trimmed,
          confidence: 1.0,
        });
        continue;
      }

      // Regular service item
      if (tipMatch) {
        items.push({
          code: tipMatch.code.chineseName,
          name: tipMatch.code.name,
          amount,
          category: tipMatch.code.category as "massage" | "facial",
          originalToken: trimmed,
          confidence: 1.0,
        });

        // Check amount warnings
        if (tipMatch.code.maxAmount !== undefined && amount > tipMatch.code.maxAmount) {
          warnings.push(`${tipMatch.code.name}金额为 $${amount}，可能异常（上限 $${tipMatch.code.maxAmount}）`);
        }
        if (tipMatch.code.minAmount !== undefined && amount < tipMatch.code.minAmount) {
          warnings.push(`${tipMatch.code.name}金额为 $${amount}，可能异常（下限 $${tipMatch.code.minAmount}）`);
        }
      } else {
        unknownTokens.push(trimmed);
        warnings.push(`不认识的项目缩写: ${alias}`);
      }
      continue;
    }

    // Try to match as a number first (massage base)
    if (isNumeric(trimmed) && !foundMassageBase) {
      massageBase = parseFloat(trimmed);
      foundMassageBase = true;
      continue;
    }

    // Try to match as alias only (no amount, use default)
    if (/^[a-zA-Z\u4e00-\u9fff]+$/.test(trimmed)) {
      const tipMatch = matchAlias(trimmed);
      if (tipMatch) {
        const defaultAmount = tipMatch.code.defaultAmount || 0;
        if (tipMatch.code.category === "card_tip") {
          cardTip += defaultAmount;
        } else if (tipMatch.code.category === "cash_tip") {
          cashTip += defaultAmount;
        } else {
          items.push({
            code: tipMatch.code.chineseName,
            name: tipMatch.code.name,
            amount: defaultAmount,
            category: tipMatch.code.category as "massage" | "facial",
            originalToken: trimmed,
            confidence: 1.0,
          });
        }
        continue;
      }
    }

    // If we already found a base amount and this is a number, it's suspicious
    if (isNumeric(trimmed) && foundMassageBase) {
      unknownTokens.push(trimmed);
      warnings.push(`发现第二个数字 ${trimmed}，可能缺少项目缩写`);
      continue;
    }

    // Unknown token
    unknownTokens.push(trimmed);
    warnings.push(`无法识别: ${trimmed}`);
  }

  // Check for missing massage base
  if (!foundMassageBase && massageBase === 0) {
    warnings.push("未找到按摩基础金额");
  }

  // Calculate totals
  const massageTotal = massageBase + items
    .filter((i) => i.category === "massage")
    .reduce((sum, i) => sum + i.amount, 0);

  const facialTotal = items
    .filter((i) => i.category === "facial")
    .reduce((sum, i) => sum + i.amount, 0);

  const serviceTotal = massageTotal + facialTotal;
  const totalWithTips = serviceTotal + cardTip + cashTip;

  // Check for duplicate items
  const itemCodes = items.map((i) => i.code);
  const seen = new Set<string>();
  for (const code of itemCodes) {
    if (seen.has(code)) {
      warnings.push(`项目 ${code} 可能重复`);
    }
    seen.add(code);
  }

  // Check tip warnings
  if (cardTip > serviceTotal) {
    warnings.push("小费高于服务金额");
  }

  return {
    rawText,
    massageBase,
    items,
    cardTip,
    cashTip,
    massageTotal,
    facialTotal,
    serviceTotal,
    totalWithTips,
    unknownTokens,
    warnings,
  };
}

/**
 * Format structured data back into standard notation string.
 *
 * @example
 * formatServiceNotation({ massageBase: 80, items: [...], cardTip: 15, cashTip: 0 })
 * // => "80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15"
 */
export function formatServiceNotation(data: {
  massageBase: number;
  items: { code: string; amount: number; category: string }[];
  cardTip: number;
  cashTip: number;
}): string {
  const parts: string[] = [];

  if (data.massageBase > 0) {
    parts.push(String(data.massageBase));
  }

  for (const item of data.items) {
    if (item.category === "card_tip" || item.category === "cash_tip") continue;
    // Find the code definition and use the shortest alias (the abbreviation)
    const codeDef = DEFAULT_SERVICE_CODES.find(
      (c) => c.name === item.code || c.chineseName === item.code
    );
    // Use the first alias (short code) or chineseName as the display code
    const code = codeDef ? (codeDef.aliases[0] || codeDef.chineseName) : item.code;
    parts.push(`${code}${item.amount}`);
  }

  if (data.cardTip > 0) {
    parts.push(`T${data.cardTip}`);
  }

  if (data.cashTip > 0) {
    parts.push(`CT${data.cashTip}`);
  }

  return parts.join(" + ");
}