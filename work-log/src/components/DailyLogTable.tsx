"use client";

import React from "react";
import { WorkEntry } from "@/types";

interface DailyLogTableProps {
  entries: WorkEntry[];
  editingId: string | null;
  onSelectEntry: (entry: WorkEntry) => void;
  totals: {
    count: number;
    totalMinutes: number;
    cashService: number;
    cashTip: number;
    cardService: number;
    cardTip: number;
    giftCardService: number;
  };
}

/** Compute order status for a work entry */
function getBusinessStatus(entry: WorkEntry, isEditing: boolean): {
  label: string;
  detail: string | null;
  color: string;
  bg: string;
  dot: string;
} {
  // In Service — currently being edited
  if (isEditing) {
    return { label: "In Service", detail: null, color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500" };
  }

  const collected = entry.paymentEntries
    .filter((e) => e.type === "service")
    .reduce((s, e) => s + e.amount, 0);
  const refunds = entry.paymentEntries
    .filter((e) => e.type === "refund")
    .reduce((s, e) => s + e.amount, 0);
  const adjustments = entry.paymentEntries
    .filter((e) => e.type === "adjustment")
    .reduce((s, e) => s + e.amount, 0);
  const effectiveTotal = entry.serviceTotal + adjustments;
  const netCollected = collected - refunds;
  const hasTip = entry.paymentEntries
    .filter((e) => e.type === "tip")
    .reduce((s, e) => s + e.amount, 0) > 0;
  const tipDone = hasTip || entry.tipResolved;

  if (netCollected <= 0) {
    return { label: "Unpaid", detail: null, color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" };
  }

  if (netCollected < effectiveTotal) {
    const due = effectiveTotal - netCollected;
    return { label: `$${due} Due`, detail: null, color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-400" };
  }

  // Service fee fully paid
  if (netCollected >= effectiveTotal) {
    if (!tipDone) {
      return { label: "Tip Pending", detail: null, color: "text-yellow-700", bg: "bg-yellow-50", dot: "bg-yellow-400" };
    }
    return { label: "Complete", detail: null, color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500" };
  }

  return { label: "Unpaid", detail: null, color: "text-red-700", bg: "bg-red-50", dot: "bg-red-500" };
}

export default function DailyLogTable({
  entries,
  editingId,
  onSelectEntry,
  totals,
}: DailyLogTableProps) {
  const formatMinutes = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h${min > 0 ? `${min}min` : ""}` : `${min}min`;
  };

  /** Compute cash display for a single entry */
  const cashDisplay = (entry: WorkEntry): { service: number; tip: number } => {
    let service = 0;
    let tip = 0;
    for (const pe of entry.paymentEntries) {
      if (pe.method === "cash") {
        if (pe.type === "service") service += pe.amount;
        else if (pe.type === "tip") tip += pe.amount;
        else if (pe.type === "refund") service -= pe.amount;
      }
    }
    return { service, tip };
  };

  /** Compute card service total for a single entry */
  const cardServiceTotal = (entry: WorkEntry): number => {
    let total = 0;
    for (const pe of entry.paymentEntries) {
      if (pe.method === "card" && (pe.type === "service" || pe.type === "refund")) {
        total += pe.type === "service" ? pe.amount : -pe.amount;
      }
    }
    return total;
  };

  /** Compute card tip total for a single entry */
  const cardTipTotal = (entry: WorkEntry): number => {
    let total = 0;
    for (const pe of entry.paymentEntries) {
      if (pe.method === "card" && pe.type === "tip") {
        total += pe.amount;
      }
    }
    return total;
  };

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 w-10">序号</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">状态</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">开始时间</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">结束时间</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">原始记账</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">现金(服务费/小费)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">刷卡服务费</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">刷卡小费</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 w-14">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-sm text-zinc-300"
                >
                  暂无记录，请点击&ldquo;新增一工&rdquo;开始
                </td>
              </tr>
            )}
            {entries.map((entry, idx) => {
              const cash = cashDisplay(entry);
              const cService = cardServiceTotal(entry);
              const cTip = cardTipTotal(entry);
              const status = getBusinessStatus(entry, editingId === entry.id);
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors ${
                    editingId === entry.id ? "bg-blue-50/50" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-xs text-zinc-400">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color} ${status.bg}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-700">{entry.startTime}</td>
                  <td className="px-3 py-2 text-xs text-zinc-700">{entry.calculatedEndTime}</td>
                  <td className="px-3 py-2 text-xs text-zinc-700 max-w-[160px] truncate">
                    {entry.originalLog}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {cash.service > 0 ? (
                      <span className="text-green-600">
                        ${cash.service}
                        {cash.tip > 0 ? ` / $${cash.tip}` : " / $0"}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {cService > 0 ? (
                      <span className="text-zinc-700">${cService}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {cTip > 0 ? (
                      <span className="text-purple-600">${cTip}</span>
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry)}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Totals row */}
          {entries.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50 font-medium">
                <td colSpan={5} className="px-3 py-2 text-xs text-zinc-500">
                  合计
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="text-green-600">
                    ${totals.cashService}
                    {totals.cashTip > 0 ? ` / $${totals.cashTip}` : " / $0"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-zinc-700">
                  ${totals.cardService}
                </td>
                <td className="px-3 py-2 text-xs text-purple-600">
                  ${totals.cardTip}
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Daily summary */}
      {entries.length > 0 && (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-zinc-500">
              工数：<span className="font-medium text-zinc-800">{totals.count}</span>
            </span>
            <span className="text-zinc-500">
              服务总时间：<span className="font-medium text-zinc-800">{formatMinutes(totals.totalMinutes)}</span>
            </span>
            <span className="text-zinc-500">
              现金收入：<span className="font-medium text-green-600">${totals.cashService + totals.cashTip}</span>
            </span>
            <span className="text-zinc-500">
              刷卡服务费：<span className="font-medium text-zinc-800">${totals.cardService}</span>
            </span>
            <span className="text-zinc-500">
              刷卡小费：<span className="font-medium text-purple-600">${totals.cardTip}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}