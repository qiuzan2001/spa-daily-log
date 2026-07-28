import { ServiceCodeDef } from "@/types";

// Default service codes / abbreviations dictionary
export const DEFAULT_SERVICE_CODES: ServiceCodeDef[] = [
  {
    name: "Massage",
    chineseName: "按摩",
    aliases: [],
    defaultAmount: undefined,
    commonAmounts: [],
    category: "massage",
    active: true,
  },
  {
    name: "Oil Upgrade",
    chineseName: "油",
    aliases: ["油", "O", "Oil"],
    defaultAmount: 5,
    commonAmounts: [5, 10],
    category: "massage",
    minAmount: 0,
    maxAmount: 30,
    active: true,
  },
  {
    name: "CBD Oil",
    chineseName: "CBD油",
    aliases: ["CBD"],
    defaultAmount: 20,
    commonAmounts: [20],
    category: "massage",
    minAmount: 0,
    maxAmount: 40,
    active: true,
  },
  {
    name: "Lymphatic",
    chineseName: "淋巴",
    aliases: ["淋", "L", "LY"],
    defaultAmount: 20,
    commonAmounts: [20],
    category: "massage",
    minAmount: 0,
    maxAmount: 40,
    active: true,
  },
  {
    name: "Cupping",
    chineseName: "拔罐",
    aliases: ["拔", "C", "CUP"],
    defaultAmount: 20,
    commonAmounts: [20],
    category: "massage",
    minAmount: 0,
    maxAmount: 40,
    active: true,
  },
  {
    name: "Facial",
    chineseName: "美容",
    aliases: ["美", "F", "FACIAL"],
    defaultAmount: 35,
    commonAmounts: [35],
    category: "facial",
    minAmount: 0,
    maxAmount: 100,
    active: true,
  },
  {
    name: "Gua Sha",
    chineseName: "刮痧",
    aliases: ["刮", "G", "GS"],
    defaultAmount: 10,
    commonAmounts: [10, 40],
    category: "massage",
    minAmount: 0,
    maxAmount: 60,
    active: true,
  },
  {
    name: "Muscle Gun",
    chineseName: "筋膜枪",
    aliases: ["枪", "MG"],
    defaultAmount: 15,
    commonAmounts: [15],
    category: "massage",
    minAmount: 0,
    maxAmount: 30,
    active: true,
  },
  {
    name: "Thai Stretch",
    chineseName: "泰式拉伸",
    aliases: ["拉", "TS"],
    defaultAmount: 15,
    commonAmounts: [15],
    category: "massage",
    minAmount: 0,
    maxAmount: 30,
    active: true,
  },
  {
    name: "Card Tip",
    chineseName: "刷卡小费",
    aliases: ["T", "Tip"],
    defaultAmount: undefined,
    commonAmounts: [],
    category: "card_tip",
    minAmount: 0,
    maxAmount: 500,
    active: true,
  },
  {
    name: "Cash Tip",
    chineseName: "现金小费",
    aliases: ["CT", "CashTip"],
    defaultAmount: undefined,
    commonAmounts: [],
    category: "cash_tip",
    minAmount: 0,
    maxAmount: 500,
    active: true,
  },
];

// Build a lookup map: alias -> ServiceCodeDef
export function buildAliasMap(codes: ServiceCodeDef[]): Map<string, ServiceCodeDef> {
  const map = new Map<string, ServiceCodeDef>();
  for (const code of codes) {
    // The name itself is an alias (for English names)
    map.set(code.name.toLowerCase(), code);
    map.set(code.chineseName, code);
    for (const alias of code.aliases) {
      map.set(alias.toLowerCase(), code);
    }
  }
  return map;
}