"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  WorkEntry,
  EntryItem,
  EntryItemType,
  PaymentEntry,
  PaymentEntryType,
  PaymentMethod,
  ServiceMode,
  OrderStatus,
  THERAPISTS,
} from "@/types";
import {
  addMinutes,
  getCurrentTimeString,
  getTodayDateString,
  generateId,
} from "@/lib/time";
import { ServiceDef, AddonDef } from "@/lib/service-library";

// ---------------------------------------------------------------------------
// Draft state
// ---------------------------------------------------------------------------
export interface DraftState {
  startTime: string;
  durationMinutes: number;
  finishEarlyFiveMinutes: boolean;
  endTime: string;
  selectedMode: ServiceMode;
  selectedMassageCategory: string | null;
  selectedMassageService: string | null;
  editingItemId: string | null;
  editingItemShortName: string | null;
  items: EntryItem[];
  paymentEntries: PaymentEntry[];
  showPayment: boolean;
  tipResolved: boolean;
  // Pending payment entry being composed
  pendingType: PaymentEntryType;
  pendingMethod: PaymentMethod;
  pendingAmount: number;
  pendingCardTime: string;
  pendingGiftCardNumber: string;
  pendingGiftCardImage: string;
}

// ---------------------------------------------------------------------------
// Undo history
// ---------------------------------------------------------------------------
interface UndoEntry {
  description: string;
  snapshot: DraftState;
  entriesSnapshot: WorkEntry[];
  editingId: string | null;
}

// ---------------------------------------------------------------------------
// Default draft
// ---------------------------------------------------------------------------
function createDefaultDraft(): DraftState {
  const now = getCurrentTimeString();
  return {
    startTime: now,
    durationMinutes: 60,
    finishEarlyFiveMinutes: false,
    endTime: addMinutes(now, 60),
    selectedMode: "按摩",
    selectedMassageCategory: null,
    selectedMassageService: null,
    editingItemId: null,
    editingItemShortName: null,
    items: [],
    paymentEntries: [],
    showPayment: false,
    tipResolved: false,
    pendingType: "service",
    pendingMethod: "cash",
    pendingAmount: 0,
    pendingCardTime: now,
    pendingGiftCardNumber: "",
    pendingGiftCardImage: "",
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcEndTime(start: string, dur: number, early5: boolean): string {
  const offset = early5 ? dur - 5 : dur;
  return addMinutes(start, offset);
}

function calcServiceTotal(items: EntryItem[]): number {
  return items.reduce((sum, it) => sum + it.amount, 0);
}

function calcTotalDuration(items: EntryItem[]): number {
  return items.reduce((sum, it) => sum + it.durationMinutes, 0);
}

function buildOriginalLog(items: EntryItem[]): string {
  return items
    .map((it) => it.shorthand)
    .join("＋");
}

/** Total service amount collected across all service-type entries */
function calcServiceCollected(entries: PaymentEntry[]): number {
  return entries
    .filter((e) => e.type === "service")
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Total tips collected */
function calcTotalTips(entries: PaymentEntry[]): number {
  return entries
    .filter((e) => e.type === "tip")
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Total refunds */
function calcTotalRefunds(entries: PaymentEntry[]): number {
  return entries
    .filter((e) => e.type === "refund")
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Total adjustments (discounts, corrections, markdowns) */
function calcTotalAdjustments(entries: PaymentEntry[]): number {
  return entries
    .filter((e) => e.type === "adjustment")
    .reduce((sum, e) => sum + e.amount, 0);
}

/** Effective service total: serviceTotal + adjustments */
function calcEffectiveServiceTotal(serviceTotal: number, entries: PaymentEntry[]): number {
  return serviceTotal + calcTotalAdjustments(entries);
}

/** Total collected (service + tips) */
function calcTotalCollected(entries: PaymentEntry[]): number {
  return calcServiceCollected(entries) + calcTotalTips(entries);
}

/** Remaining balance: effectiveServiceTotal - serviceCollected + refunds */
function calcRemainingBalance(serviceTotal: number, entries: PaymentEntry[]): number {
  const effectiveTotal = calcEffectiveServiceTotal(serviceTotal, entries);
  return effectiveTotal - calcServiceCollected(entries) + calcTotalRefunds(entries);
}

/** Order status — from order lifecycle perspective */
function calcOrderStatus(
  serviceTotal: number,
  entries: PaymentEntry[],
  tipResolved: boolean,
  isEditing: boolean
): OrderStatus {
  if (isEditing) return "in-service";

  const effectiveTotal = calcEffectiveServiceTotal(serviceTotal, entries);
  const collected = calcServiceCollected(entries);
  const refunds = calcTotalRefunds(entries);
  const netService = collected - refunds;
  const hasTip = calcTotalTips(entries) > 0;
  const tipDone = hasTip || tipResolved;

  if (netService <= 0) return "unpaid";
  if (netService < effectiveTotal) return "partial";
  if (netService >= effectiveTotal) {
    if (!tipDone) return "service-paid";
    return "complete";
  }
  return "unpaid";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useWorkLog() {
  const [selectedTherapist, setSelectedTherapist] = useState<string>("linda");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [draft, setDraft] = useState<DraftState>(createDefaultDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- undo stack --------------------------------------------------------
  const [canUndo, setCanUndo] = useState(false);
  const undoStackRef = useRef<UndoEntry[]>([]);
  const MAX_UNDO = 20;

  const pushUndo = useCallback(
    (description: string) => {
      undoStackRef.current.push({
        description,
        snapshot: JSON.parse(JSON.stringify(draft)),
        entriesSnapshot: JSON.parse(JSON.stringify(entries)),
        editingId,
      });
      if (undoStackRef.current.length > MAX_UNDO) {
        undoStackRef.current.shift();
      }
      setCanUndo(true);
    },
    [draft, entries, editingId]
  );

  const undo = useCallback(() => {
    const entry = undoStackRef.current.pop();
    if (!entry) return;
    setDraft(entry.snapshot);
    setEntries(entry.entriesSnapshot);
    setEditingId(entry.editingId);
    setCanUndo(undoStackRef.current.length > 0);
  }, []);

  // ---- auto-save ---------------------------------------------------------
  const triggerAutoSave = useCallback(() => {
    setAutoSaveStatus("saving");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 300);
  }, []);

  // ---- draft helpers -----------------------------------------------------

  const recalcEndTimeFromItems = useCallback(
    (d: DraftState): DraftState => {
      const totalDur = calcTotalDuration(d.items);
      const effectiveDur = totalDur > 0 ? totalDur : d.durationMinutes;
      return {
        ...d,
        durationMinutes: effectiveDur,
        endTime: calcEndTime(d.startTime, effectiveDur, d.finishEarlyFiveMinutes),
      };
    },
    []
  );

  const updateDraft = useCallback(
    (patch: Partial<DraftState>) => {
      setDraft((prev) => {
        let next = { ...prev, ...patch };
        if ("startTime" in patch || "finishEarlyFiveMinutes" in patch) {
          next = recalcEndTimeFromItems(next);
        }
        return next;
      });
      triggerAutoSave();
    },
    [triggerAutoSave, recalcEndTimeFromItems]
  );

  // ---- service items -----------------------------------------------------

  const selectService = useCallback(
    (svc: ServiceDef) => {
      pushUndo(`添加 ${svc.shortName}`);
      let type: EntryItemType;
      if (svc.category === "massage") type = "massage";
      else if (svc.category === "facial") type = "facial";
      else if (svc.category === "oil") type = "oil";
      else type = "project";

      const item: EntryItem = {
        id: generateId(), type, label: svc.name,
        shorthand: svc.shortName, amount: svc.price, durationMinutes: svc.durationMinutes,
      };
      setDraft((prev) => {
        const next = { ...prev };
        if (prev.editingItemId) {
          next.items = prev.items.map((it) => it.id === prev.editingItemId ? item : it);
          next.editingItemId = null; next.editingItemShortName = null;
        } else {
          next.items = [...prev.items, item];
          next.editingItemId = null; next.editingItemShortName = null;
        }
        const totalDur = calcTotalDuration(next.items);
        next.durationMinutes = totalDur;
        next.endTime = calcEndTime(next.startTime, totalDur, next.finishEarlyFiveMinutes);
        return next;
      });
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave]
  );

  const selectMassageService = useCallback(
    (serviceId: string, minutes: number, price: number, shortName: string, label: string) => {
      pushUndo(`添加 ${shortName}`);
      const item: EntryItem = {
        id: generateId(), type: "massage", label, shorthand: shortName,
        amount: price, durationMinutes: minutes,
      };
      setDraft((prev) => {
        const next = { ...prev };
        if (prev.editingItemId) {
          next.items = prev.items.map((it) => it.id === prev.editingItemId ? item : it);
          next.editingItemId = null; next.editingItemShortName = null;
        } else {
          next.items = [...prev.items, item];
          next.editingItemId = null; next.editingItemShortName = null;
        }
        const totalDur = calcTotalDuration(next.items);
        next.durationMinutes = totalDur;
        next.endTime = calcEndTime(next.startTime, totalDur, next.finishEarlyFiveMinutes);
        return next;
      });
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave]
  );

  const selectAddon = useCallback(
    (addon: AddonDef) => {
      pushUndo(`添加 ${addon.shortName}`);
      const item: EntryItem = {
        id: generateId(), type: "project", label: addon.name,
        shorthand: addon.shortName, amount: addon.price, durationMinutes: addon.durationMinutes,
      };
      setDraft((prev) => {
        const next = { ...prev };
        if (prev.editingItemId) {
          next.items = prev.items.map((it) => it.id === prev.editingItemId ? item : it);
          next.editingItemId = null; next.editingItemShortName = null;
        } else {
          next.items = [...prev.items, item];
          next.editingItemId = null; next.editingItemShortName = null;
        }
        const totalDur = calcTotalDuration(next.items);
        next.durationMinutes = totalDur;
        next.endTime = calcEndTime(next.startTime, totalDur, next.finishEarlyFiveMinutes);
        return next;
      });
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave]
  );

  const addCustomService = useCallback(
    (price: number, durationHours: number, durationMinutes: number) => {
      const totalMin = durationHours * 60 + durationMinutes;
      pushUndo(`自定义 $${price}`);
      let type: EntryItemType;
      if (draft.selectedMode === "按摩") type = "massage";
      else if (draft.selectedMode === "美容") type = "facial";
      else if (draft.selectedMode === "油") type = "oil";
      else type = "project";
      const shorthand = draft.selectedMode === "按摩" ? `${price}按` :
        draft.selectedMode === "美容" ? `${price}美` :
        draft.selectedMode === "油" ? `油${price}` : `自${price}`;
      const item: EntryItem = {
        id: generateId(), type, label: "Custom", shorthand,
        amount: price, durationMinutes: totalMin,
      };
      setDraft((prev) => {
        const next = { ...prev };
        if (prev.editingItemId) {
          next.items = prev.items.map((it) => it.id === prev.editingItemId ? item : it);
          next.editingItemId = null; next.editingItemShortName = null;
        } else {
          next.items = [...prev.items, item];
          next.editingItemId = null; next.editingItemShortName = null;
        }
        const totalDur = calcTotalDuration(next.items);
        next.durationMinutes = totalDur;
        next.endTime = calcEndTime(next.startTime, totalDur, next.finishEarlyFiveMinutes);
        return next;
      });
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave, draft.selectedMode]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      pushUndo("移除项目");
      setDraft((prev) => {
        const next = { ...prev, items: prev.items.filter((it) => it.id !== itemId) };
        const totalDur = calcTotalDuration(next.items);
        next.durationMinutes = totalDur;
        next.endTime = calcEndTime(next.startTime, totalDur, next.finishEarlyFiveMinutes);
        return next;
      });
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave]
  );

  const startEditItem = useCallback((itemId: string) => {
    setDraft((prev) => {
      const item = prev.items.find((it) => it.id === itemId);
      if (!item) return prev;
      let mode: ServiceMode = "按摩";
      if (item.type === "facial") mode = "美容";
      else if (item.type === "oil") mode = "油";
      else if (item.type === "project") mode = "项目";
      return { ...prev, editingItemId: itemId, editingItemShortName: item.shorthand, selectedMode: mode };
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setDraft((prev) => ({ ...prev, editingItemId: null, editingItemShortName: null }));
  }, []);

  // ---- payment (ledger) --------------------------------------------------

  const openPayment = useCallback(() => {
    pushUndo("打开收款");
    setDraft((prev) => {
      const remaining = calcRemainingBalance(calcServiceTotal(prev.items), prev.paymentEntries);
      return {
        ...prev,
        showPayment: true,
        pendingType: "service",
        pendingMethod: "cash",
        pendingAmount: remaining > 0 ? remaining : 0,
        pendingCardTime: getCurrentTimeString(),
        pendingGiftCardNumber: "",
        pendingGiftCardImage: "",
      };
    });
  }, [pushUndo]);

  const closePayment = useCallback(() => {
    setDraft((prev) => ({ ...prev, showPayment: false }));
  }, []);

  const addPaymentEntry = useCallback(() => {
    pushUndo("添加付款");
    setDraft((prev) => {
      if (prev.pendingAmount <= 0) return prev;

      const entry: PaymentEntry = {
        id: generateId(),
        type: prev.pendingType,
        method: prev.pendingMethod,
        amount: prev.pendingAmount,
        recordedAt: getCurrentTimeString(),
        cardTime: prev.pendingMethod === "card" ? prev.pendingCardTime : undefined,
        giftCardNumber: prev.pendingMethod === "giftcard" ? prev.pendingGiftCardNumber : undefined,
        giftCardImage: prev.pendingMethod === "giftcard" ? prev.pendingGiftCardImage : undefined,
      };

      const newEntries = [...prev.paymentEntries, entry];
      const remaining = calcRemainingBalance(calcServiceTotal(prev.items), newEntries);

      // P0: Adding a tip entry resets tipResolved (customer may have returned to tip)
      const newTipResolved = prev.pendingType === "tip" ? false : prev.tipResolved;

      return {
        ...prev,
        paymentEntries: newEntries,
        tipResolved: newTipResolved,
        pendingType: "service",
        pendingMethod: "cash",
        pendingAmount: remaining > 0 ? remaining : 0,
        pendingCardTime: getCurrentTimeString(),
        pendingGiftCardNumber: "",
        pendingGiftCardImage: "",
      };
    });
    triggerAutoSave();
  }, [pushUndo, triggerAutoSave]);

  const removePaymentEntry = useCallback(
    (entryId: string) => {
      pushUndo("移除付款");
      setDraft((prev) => ({
        ...prev,
        paymentEntries: prev.paymentEntries.filter((e) => e.id !== entryId),
      }));
      triggerAutoSave();
    },
    [pushUndo, triggerAutoSave]
  );

  // ---- save / complete / delete ------------------------------------------

  const persistDraftToEntries = useCallback(
    (d: DraftState, editId: string | null): string | null => {
      if (!d.startTime) return "请输入开始时间";
      if (d.items.length === 0) return "请至少添加一项服务";

      // Validate: card entries need card time
      for (const entry of d.paymentEntries) {
        if (entry.method === "card" && !entry.cardTime) {
          return "请填写刷卡时间";
        }
      }

      const serviceTotal = calcServiceTotal(d.items);
      const now = getCurrentTimeString();

      const entry: WorkEntry = {
        id: editId || generateId(),
        therapistId: selectedTherapist,
        date: selectedDate,
        startTime: d.startTime,
        durationMinutes: d.durationMinutes,
        finishEarlyFiveMinutes: d.finishEarlyFiveMinutes,
        calculatedEndTime: d.endTime,
        items: d.items,
        originalLog: buildOriginalLog(d.items),
        serviceTotal,
        paymentEntries: d.paymentEntries,
        paymentStatus: calcOrderStatus(serviceTotal, d.paymentEntries, d.tipResolved, false),
        tipResolved: d.tipResolved,
        status: "completed",
        updatedAt: now,
      };

      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === editId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = entry;
          return next;
        }
        return [...prev, entry];
      });

      return null;
    },
    [selectedTherapist, selectedDate]
  );

  const completeEntry = useCallback((): string | null => {
    pushUndo("完成本工");
    const error = persistDraftToEntries(draft, editingId);
    if (error) return error;
    setDraft(createDefaultDraft());
    setEditingId(null);
    undoStackRef.current = [];
    triggerAutoSave();
    return null;
  }, [draft, editingId, persistDraftToEntries, pushUndo, triggerAutoSave]);

  const deleteEntry = useCallback(() => {
    if (!editingId) return;
    pushUndo("删除记录");
    setEntries((prev) => prev.filter((e) => e.id !== editingId));
    setDraft(createDefaultDraft());
    setEditingId(null);
    undoStackRef.current = [];
  }, [editingId, pushUndo]);

  const newEntry = useCallback(() => {
    if (editingId) return;
    pushUndo("新增一工");
    setDraft(createDefaultDraft());
    setEditingId(null);
    undoStackRef.current = [];
  }, [editingId, pushUndo]);

  const selectEntry = useCallback((entry: WorkEntry) => {
    pushUndo("选择编辑");
    setEditingId(entry.id);
    const now = getCurrentTimeString();
    const remaining = calcRemainingBalance(entry.serviceTotal, entry.paymentEntries);
    setDraft({
      startTime: entry.startTime,
      durationMinutes: entry.durationMinutes,
      finishEarlyFiveMinutes: entry.finishEarlyFiveMinutes,
      endTime: entry.calculatedEndTime,
      selectedMode: "按摩",
      selectedMassageCategory: null,
      selectedMassageService: null,
      editingItemId: null,
      editingItemShortName: null,
      items: JSON.parse(JSON.stringify(entry.items)),
      paymentEntries: JSON.parse(JSON.stringify(entry.paymentEntries)),
      showPayment: false,
      tipResolved: entry.tipResolved,
      pendingType: "service",
      pendingMethod: "cash",
      pendingAmount: remaining > 0 ? remaining : 0,
      pendingCardTime: now,
      pendingGiftCardNumber: "",
      pendingGiftCardImage: "",
    });
  }, [pushUndo]);

  const cancelEditing = useCallback(() => {
    if (editingId) {
      const original = entries.find((e) => e.id === editingId);
      if (original) {
        setDraft(createDefaultDraft());
        setEditingId(null);
        undoStackRef.current = [];
        return;
      }
    }
    setDraft(createDefaultDraft());
    setEditingId(null);
    undoStackRef.current = [];
  }, [editingId, entries]);

  // ---- computed ----------------------------------------------------------

  const filteredEntries = useMemo(
    () => entries.filter((e) => e.therapistId === selectedTherapist && e.date === selectedDate),
    [entries, selectedTherapist, selectedDate]
  );

  const totals = useMemo(() => {
    let cashService = 0, cashTip = 0, cardService = 0, cardTip = 0, giftCardService = 0, totalMinutes = 0;
    for (const e of filteredEntries) {
      for (const pe of e.paymentEntries) {
        if (pe.type === "refund") {
          // Refunds subtract
          if (pe.method === "cash") cashService -= pe.amount;
          else if (pe.method === "card") cardService -= pe.amount;
          else giftCardService -= pe.amount;
        } else if (pe.type === "service") {
          if (pe.method === "cash") cashService += pe.amount;
          else if (pe.method === "card") cardService += pe.amount;
          else giftCardService += pe.amount;
        } else if (pe.type === "tip") {
          if (pe.method === "cash") cashTip += pe.amount;
          else if (pe.method === "card") cardTip += pe.amount;
        }
      }
      totalMinutes += e.durationMinutes;
    }
    return { count: filteredEntries.length, totalMinutes, cashService, cashTip, cardService, cardTip, giftCardService };
  }, [filteredEntries]);

  const serviceTotal = useMemo(() => calcServiceTotal(draft.items), [draft.items]);
  const totalDuration = useMemo(() => calcTotalDuration(draft.items), [draft.items]);
  const serviceCollected = useMemo(() => calcServiceCollected(draft.paymentEntries), [draft.paymentEntries]);
  const totalTips = useMemo(() => calcTotalTips(draft.paymentEntries), [draft.paymentEntries]);
  const totalRefunds = useMemo(() => calcTotalRefunds(draft.paymentEntries), [draft.paymentEntries]);
  const remainingBalance = useMemo(
    () => calcRemainingBalance(serviceTotal, draft.paymentEntries),
    [serviceTotal, draft.paymentEntries]
  );
  const totalCollected = useMemo(() => calcTotalCollected(draft.paymentEntries), [draft.paymentEntries]);
  const orderStatus = useMemo(
    () => calcOrderStatus(serviceTotal, draft.paymentEntries, draft.tipResolved, editingId !== null),
    [serviceTotal, draft.paymentEntries, draft.tipResolved, editingId]
  );

  const markNoTip = useCallback(() => {
    pushUndo("标记无小费");
    updateDraft({ tipResolved: true });
  }, [pushUndo, updateDraft]);

  const therapists = THERAPISTS;

  // ---- return ------------------------------------------------------------

  return {
    selectedTherapist, selectedDate, entries, draft, editingId,
    filteredEntries, totals, therapists,
    autoSaveStatus, canUndo,
    serviceTotal, totalDuration, serviceCollected, totalTips, totalRefunds,
    remainingBalance, totalCollected, orderStatus,
    setSelectedTherapist, setSelectedDate, updateDraft,
    newEntry, selectEntry, completeEntry, deleteEntry, cancelEditing, undo,
    selectService, selectMassageService, selectAddon, addCustomService,
    removeItem, startEditItem, cancelEdit,
    openPayment, closePayment, addPaymentEntry, removePaymentEntry, markNoTip,
  };
}