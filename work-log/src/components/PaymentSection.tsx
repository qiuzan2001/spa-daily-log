"use client";

import React, { useRef } from "react";
import { PaymentEntry, PaymentEntryType, PaymentMethod } from "@/types";

interface PaymentSectionProps {
  showPayment: boolean;
  onOpenPayment: () => void;
  onClosePayment: () => void;
  pendingType: PaymentEntryType;
  pendingMethod: PaymentMethod;
  pendingAmount: number;
  pendingCardTime: string;
  pendingGiftCardNumber: string;
  pendingGiftCardImage: string;
  onPendingTypeChange: (type: PaymentEntryType) => void;
  onPendingMethodChange: (method: PaymentMethod) => void;
  onPendingAmountChange: (val: number) => void;
  onPendingCardTimeChange: (val: string) => void;
  onPendingGiftCardNumberChange: (val: string) => void;
  onPendingGiftCardImageChange: (val: string) => void;
  onAddEntry: () => void;
  onMarkNoTip: () => void;
  tipResolved: boolean;
  paymentEntries: PaymentEntry[];
  onRemoveEntry: (entryId: string) => void;
  serviceTotal: number;
  remainingBalance: number;
  totalCollected: number;
  paymentStatus: string;
}

export default function PaymentSection({
  showPayment,
  onOpenPayment,
  onClosePayment,
  pendingType,
  pendingMethod,
  pendingAmount,
  pendingCardTime,
  pendingGiftCardNumber,
  pendingGiftCardImage,
  onPendingTypeChange,
  onPendingMethodChange,
  onPendingAmountChange,
  onPendingCardTimeChange,
  onPendingGiftCardNumberChange,
  onPendingGiftCardImageChange,
  onAddEntry,
  onMarkNoTip,
  tipResolved,
  paymentEntries,
  onRemoveEntry,
  serviceTotal,
  remainingBalance,
  totalCollected,
  paymentStatus,
}: PaymentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasItems = serviceTotal > 0;

  const typeLabel = (t: PaymentEntryType) =>
    t === "service" ? "服务费" : t === "tip" ? "小费" : t === "refund" ? "退款" : "调整";

  const methodLabel = (m: PaymentMethod) =>
    m === "cash" ? "现金" : m === "card" ? "刷卡" : "礼品卡";

  const methodColor = (m: PaymentMethod) =>
    m === "cash" ? "text-green-600" : m === "card" ? "text-blue-600" : "text-purple-600";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-700">收款</h3>
        {!showPayment && hasItems && (
          <button
            type="button"
            onClick={onOpenPayment}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white
                       hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            收款
          </button>
        )}
        {showPayment && (
          <button
            type="button"
            onClick={onClosePayment}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            收起
          </button>
        )}
      </div>

      {/* Ledger display */}
      {paymentEntries.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {paymentEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-1.5"
            >
              <span className="text-xs text-zinc-600">
                <span className="font-medium">{typeLabel(entry.type)}</span>
                {" "}
                <span className={methodColor(entry.method)}>{methodLabel(entry.method)}</span>
                {" "}
                <span className="font-medium text-zinc-800">${entry.amount}</span>
                {entry.giftCardNumber && (
                  <span className="text-zinc-400 ml-1">#{entry.giftCardNumber}</span>
                )}
                {entry.cardTime && (
                  <span className="text-zinc-400 ml-1">@{entry.cardTime}</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => onRemoveEntry(entry.id)}
                className="text-xs text-zinc-300 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payment form */}
      {showPayment && (
        <div className="space-y-2">
          {/* Type selector */}
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
            {(["service", "tip", "refund", "adjustment"] as PaymentEntryType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onPendingTypeChange(t)}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  pendingType === t
                    ? "bg-white text-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {typeLabel(t)}
              </button>
            ))}
          </div>

          {/* Method selector */}
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
            {(["cash", "card", "giftcard"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onPendingMethodChange(m)}
                className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  pendingMethod === m
                    ? "bg-white text-zinc-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {methodLabel(m)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="flex items-center gap-3">
            <label className="w-20 text-sm text-zinc-500">金额</label>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <input
                type="number"
                value={pendingAmount || ""}
                onChange={(e) => onPendingAmountChange(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-200 py-1.5 pl-7 pr-3 text-sm
                           focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                min={0}
              />
            </div>
          </div>

          {/* Card time (conditional) */}
          {pendingMethod === "card" && (
            <div className="flex items-center gap-3">
              <label className="w-20 text-sm text-zinc-500">刷卡时间</label>
              <input
                type="text"
                value={pendingCardTime}
                onChange={(e) => onPendingCardTimeChange(e.target.value)}
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm
                           focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="hh:mm AM/PM"
              />
            </div>
          )}

          {/* Gift card (conditional) */}
          {pendingMethod === "giftcard" && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-zinc-500">卡号</label>
                <input
                  type="text"
                  value={pendingGiftCardNumber}
                  onChange={(e) => onPendingGiftCardNumberChange(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm
                             focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  placeholder="手动输入或拍照上传"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-20 text-sm text-zinc-500">照片</label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          onPendingGiftCardImageChange(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500
                               hover:bg-zinc-50 transition-colors"
                  >
                    📷 拍照
                  </button>
                  {pendingGiftCardImage && (
                    <div className="relative">
                      <img
                        src={pendingGiftCardImage}
                        alt="Gift card"
                        className="h-10 w-16 object-cover rounded border border-zinc-200"
                      />
                      <button
                        type="button"
                        onClick={() => onPendingGiftCardImageChange("")}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add button */}
          <button
            type="button"
            onClick={onAddEntry}
            disabled={pendingAmount <= 0}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 transition-colors"
          >
            添加
          </button>

          {/* No Tip button */}
          {!tipResolved && (
            <button
              type="button"
              onClick={onMarkNoTip}
              className="w-full rounded-lg border border-zinc-200 py-2 text-sm text-zinc-500
                         hover:bg-zinc-50 transition-colors"
            >
              无小费
            </button>
          )}

          {/* Add another link */}
          <div className="text-center">
            <button
              type="button"
              onClick={onOpenPayment}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              ＋添加另一笔付款
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      {paymentEntries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>应收 ${serviceTotal}</span>
            <span>已收 ${totalCollected}</span>
            <span
              className={`font-medium ${
                paymentStatus === "paid" ? "text-green-600" :
                paymentStatus === "overpaid" ? "text-red-500" :
                paymentStatus === "partial" ? "text-amber-600" :
                paymentStatus === "refunded" ? "text-red-500" :
                "text-zinc-400"
              }`}
            >
              {paymentStatus === "complete" ? "已完结" :
               paymentStatus === "service-paid" ? "Tip Pending" :
               paymentStatus === "paid" ? "已付" :
               paymentStatus === "overpaid" ? "超额" :
               paymentStatus === "refunded" ? "已退款" :
               paymentStatus === "partial" ? `待付 $${remainingBalance}` :
               "未付"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}