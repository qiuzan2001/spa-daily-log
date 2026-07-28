// ============================================================
// NextBar data model — therapist daily work log
// ============================================================

// ---------------------------------------------------------------------------
// Core types for the new therapist work-log
// ---------------------------------------------------------------------------

export type EntryItemType = "massage" | "facial" | "oil" | "project";

export interface EntryItem {
  id: string;
  type: EntryItemType;
  label: string;
  shorthand: string;
  amount: number;
  durationMinutes: number; // each item contributes to total duration
}

export type PaymentMethod = "cash" | "card" | "giftcard";

export type PaymentEntryType = "service" | "tip" | "refund" | "adjustment";

export interface PaymentEntry {
  id: string;
  type: PaymentEntryType;
  method: PaymentMethod;
  amount: number;
  recordedAt: string;
  cardTime?: string;
  giftCardNumber?: string;
  giftCardImage?: string; // base64 data URL from camera/photo
  note?: string;
}

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overpaid" | "refunded" | "in-service" | "service-paid" | "complete";

export type WorkEntryStatus = "draft" | "completed";

export type OrderStatus = "in-service" | "unpaid" | "partial" | "service-paid" | "complete";

export interface WorkEntry {
  id: string;
  therapistId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  finishEarlyFiveMinutes: boolean;
  calculatedEndTime: string;
  items: EntryItem[];
  originalLog: string;
  serviceTotal: number;
  paymentEntries: PaymentEntry[];
  paymentStatus: PaymentStatus;
  tipResolved: boolean; // true = tip given or explicitly marked no tip
  status: WorkEntryStatus;
  updatedAt: string;
}

export interface Therapist {
  id: string;
  name: string;
}

export const THERAPISTS: Therapist[] = [
  { id: "linda", name: "Linda" },
  { id: "amy", name: "Amy" },
  { id: "susan", name: "Susan" },
];

// Duration options
export const DURATION_OPTIONS = [30, 45, 60, 75, 90, 120];

// Mode tabs
export type ServiceMode = "按摩" | "美容" | "油" | "项目";
export const SERVICE_MODES: ServiceMode[] = ["按摩", "美容", "油", "项目"];

// ============================================================
// Legacy types — kept for parser, service-codes, and test files
// ============================================================

export type UserRole = "therapist" | "front_desk" | "owner";
export type WorksheetStatus = "draft" | "pending_review" | "submitted" | "locked";
export type EntryStatus = "unreviewed" | "has_errors" | "reviewed";

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface ParsedItem {
  code: string;
  name: string;
  amount: number;
  category: "massage" | "facial" | "card_tip" | "cash_tip";
  originalToken: string;
  confidence: number;
}

export interface ParsedNotation {
  rawText: string;
  massageBase: number;
  items: ParsedItem[];
  cardTip: number;
  cashTip: number;
  massageTotal: number;
  facialTotal: number;
  serviceTotal: number;
  totalWithTips: number;
  unknownTokens: string[];
  warnings: string[];
}

export interface FormattedItem {
  code: string;
  amount: number;
}

export interface OCRProvider {
  name: string;
  recognize(imageDataUrl: string): Promise<OCRResult>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  raw?: string;
}

export interface ServiceCodeDef {
  name: string;
  chineseName: string;
  aliases: string[];
  defaultAmount?: number;
  commonAmounts: number[];
  category: "massage" | "facial" | "card_tip" | "cash_tip";
  minAmount?: number;
  maxAmount?: number;
  active: boolean;
}

export interface WorksheetRow {
  id: string;
  time: string;
  room: string;
  rawNotation: string;
  massageCash: string;
  massageCard: string;
  cardTip: string;
  facialCash: string;
  facialCard: string;
}

export interface PaymentValidation {
  massageCash: number;
  massageCard: number;
  facialCash: number;
  facialCard: number;
  cardTip: number;
  cashTip: number;
  adjustment?: {
    type: string;
    amount: number;
    reason: string;
  };
}