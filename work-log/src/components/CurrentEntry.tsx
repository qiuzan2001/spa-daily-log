"use client";

import React, { useState } from "react";
import { DraftState } from "@/hooks/useWorkLog";

interface CurrentEntryProps {
  draft: DraftState;
  serviceTotal: number;
  totalDuration: number;
  remainingBalance: number;
  paymentStatus: string;
  autoSaveStatus: "idle" | "saving" | "saved";
  editingId: string | null;
  onRemoveItem: (itemId: string) => void;
  onStartEditItem: (itemId: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  onStartTimeChange: (val: string) => void;
  onEarlyFiveToggle: (val: boolean) => void;
}

export default function CurrentEntry({
  draft,
  serviceTotal,
  totalDuration,
  remainingBalance,
  paymentStatus,
  autoSaveStatus,
  onRemoveItem,
  onStartEditItem,
  onUndo,
  canUndo,
  onStartTimeChange,
  onEarlyFiveToggle,
}: CurrentEntryProps) {
  const [editingTime, setEditingTime] = useState(false);
  const [timeInput, setTimeInput] = useState(draft.startTime);

  const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return `${h}h${m > 0 ? `${m}min` : ""}`;
    return `${m}min`;
  };

  const handleStartTimeClick = () => {
    setTimeInput(draft.startTime);
    setEditingTime(true);
  };

  const handleTimeSave = () => {
    if (timeInput.trim()) {
      onStartTimeChange(timeInput.trim());
    }
    setEditingTime(false);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-700">本工记录</h3>
        <div className="flex items-center gap-2">
          {autoSaveStatus === "saving" && (
            <span className="text-xs text-zinc-400">保存中…</span>
          )}
          {autoSaveStatus === "saved" && (
            <span className="text-xs text-green-500">已自动保存</span>
          )}
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="text-xs text-zinc-400 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            撤销
          </button>
        </div>
      </div>

      {/* Editable item chips */}
      <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 mb-3 min-h-[3rem]">
        {draft.items.length === 0 ? (
          <p className="text-sm text-zinc-300">请添加服务项目</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {draft.items.map((item) => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs cursor-pointer transition-colors ${
                  draft.editingItemId === item.id
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
                onClick={() => onStartEditItem(item.id)}
              >
                {item.shorthand}
                {item.durationMinutes > 0 && (
                  <span className="text-zinc-400 ml-0.5">+{item.durationMinutes}min</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  className="ml-0.5 text-zinc-300 hover:text-red-500 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Service total + Duration */}
      {draft.items.length > 0 && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">服务合计</span>
            <span className="text-sm font-semibold text-zinc-800">
              ${serviceTotal}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <span>总时长</span>
            <span className="font-medium text-zinc-600">{formatDuration(totalDuration)}</span>
          </div>
        </div>
      )}

      {/* Payment summary chips */}
      {draft.paymentEntries.length > 0 && (
        <div className="mb-2 space-y-1">
          {draft.paymentEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between text-xs text-zinc-500"
            >
              <span>
                {entry.type === "refund" ? "退款" : entry.type === "service" ? "服务费" : "小费"}
                {" "}
                {entry.method === "cash" ? "现金" : entry.method === "card" ? "刷卡" : "礼品卡"}
                {" "}
                <span className="font-medium text-zinc-800">${entry.amount}</span>
                {entry.giftCardNumber && (
                  <span className="text-zinc-400 ml-1">#{entry.giftCardNumber}</span>
                )}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              已收 ${serviceTotal - remainingBalance} / 应收 ${serviceTotal}
            </span>
            <span
              className={`font-medium ${
                paymentStatus === "paid"
                  ? "text-green-600"
                  : paymentStatus === "partial"
                  ? "text-amber-600"
                  : paymentStatus === "overpaid" || paymentStatus === "refunded"
                  ? "text-red-500"
                  : "text-zinc-400"
              }`}
            >
              {paymentStatus === "complete" ? "已完结" :
               paymentStatus === "service-paid" ? "Tip Pending" :
               paymentStatus === "paid" ? "已付" :
               paymentStatus === "partial" ? "部分付款" :
               paymentStatus === "overpaid" ? "超额" :
               paymentStatus === "refunded" ? "已退款" :
               "未付"}
            </span>
          </div>
        </div>
      )}

      {/* Compact time row */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
        {/* Start time — clickable to edit */}
        {editingTime ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
              className="w-24 rounded border border-blue-300 px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="hh:mm AM/PM"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTimeSave();
                if (e.key === "Escape") setEditingTime(false);
              }}
            />
            <button
              type="button"
              onClick={handleTimeSave}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              确定
            </button>
            <button
              type="button"
              onClick={() => setEditingTime(false)}
              className="text-xs text-zinc-400 hover:text-zinc-500"
            >
              取消
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartTimeClick}
            className="text-xs text-zinc-500 hover:text-zinc-700"
          >
            <span className="text-zinc-400">开始</span>{" "}
            <span className="font-medium text-zinc-700">{draft.startTime}</span>
          </button>
        )}

        <span className="text-xs text-zinc-300">→</span>

        <span className="text-xs text-zinc-500">
          <span className="text-zinc-400">结束</span>{" "}
          <span className="font-medium text-zinc-700">{draft.endTime}</span>
        </span>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => onEarlyFiveToggle(!draft.finishEarlyFiveMinutes)}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
              draft.finishEarlyFiveMinutes ? "bg-blue-600" : "bg-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${
                draft.finishEarlyFiveMinutes ? "translate-x-[18px]" : "translate-x-[2px]"
              }`}
            />
          </button>
          <span className="text-xs text-zinc-400">提前5分钟</span>
        </div>
      </div>
    </div>
  );
}