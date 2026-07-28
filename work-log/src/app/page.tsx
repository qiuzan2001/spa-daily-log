"use client";

import React from "react";
import { useWorkLog } from "@/hooks/useWorkLog";
import DailyLogTable from "@/components/DailyLogTable";
import CurrentEntry from "@/components/CurrentEntry";
import ServiceInput from "@/components/ServiceInput";
import PaymentSection from "@/components/PaymentSection";

export default function Home() {
  const {
    selectedTherapist,
    selectedDate,
    draft,
    editingId,
    filteredEntries,
    totals,
    therapists,
    autoSaveStatus,
    canUndo,
    serviceTotal,
    totalDuration,
    remainingBalance,
    totalCollected,
    orderStatus,
    setSelectedTherapist,
    setSelectedDate,
    updateDraft,
    newEntry,
    selectEntry,
    completeEntry,
    deleteEntry,
    cancelEditing,
    undo,
    selectService,
    selectMassageService,
    selectAddon,
    addCustomService,
    removeItem,
    startEditItem,
    cancelEdit,
    openPayment,
    closePayment,
    addPaymentEntry,
    removePaymentEntry,
    markNoTip,
    draft: {
      selectedMode,
      editingItemId,
      editingItemShortName,
      selectedMassageCategory,
      selectedMassageService,
      paymentEntries,
      showPayment,
      tipResolved,
      pendingType,
      pendingMethod,
      pendingAmount,
      pendingCardTime,
      pendingGiftCardNumber,
      pendingGiftCardImage,
    },
  } = useWorkLog();

  const handleComplete = () => {
    const error = completeEntry();
    if (error) {
      alert(error);
    }
  };

  const handleDelete = () => {
    if (confirm("确定删除这条记录？")) {
      deleteEntry();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-zinc-800">NextBar</h1>
          <div className="flex items-center gap-3">
            <select
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700
                         focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700
                         focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto flex max-w-7xl gap-4 px-6 py-4">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500">
              {filteredEntries.length} 条记录
            </h2>
            <button
              type="button"
              onClick={newEntry}
              disabled={editingId !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                         hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed
                         transition-colors"
            >
              新增一工
            </button>
          </div>
          <DailyLogTable
            entries={filteredEntries}
            editingId={editingId}
            onSelectEntry={selectEntry}
            totals={totals}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[420px] flex-shrink-0 space-y-4">
          {/* Current Entry */}
          <CurrentEntry
            draft={draft}
            serviceTotal={serviceTotal}
            totalDuration={totalDuration}
            remainingBalance={remainingBalance}
            paymentStatus={orderStatus}
            autoSaveStatus={autoSaveStatus}
            editingId={editingId}
            onRemoveItem={removeItem}
            onStartEditItem={startEditItem}
            onUndo={undo}
            canUndo={canUndo}
            onStartTimeChange={(val) => updateDraft({ startTime: val })}
            onEarlyFiveToggle={(val) => updateDraft({ finishEarlyFiveMinutes: val })}
          />

          {/* Service Input */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-medium text-zinc-700 mb-3">服务</h3>
            <ServiceInput
              selectedMode={selectedMode}
              onModeChange={(mode) => updateDraft({ selectedMode: mode })}
              editingItemId={editingItemId}
              editingItemShortName={editingItemShortName}
              selectedMassageCategory={selectedMassageCategory}
              selectedMassageService={selectedMassageService}
              onSelectService={selectService}
              onSelectMassageService={selectMassageService}
              onSelectAddon={selectAddon}
              onCustomService={addCustomService}
              onCancelEdit={cancelEdit}
              onSetMassageCategory={(name) => updateDraft({ selectedMassageCategory: name })}
              onSetMassageService={(id) => updateDraft({ selectedMassageService: id })}
            />
          </div>

          {/* Payment */}
          <PaymentSection
            showPayment={showPayment}
            onOpenPayment={openPayment}
            onClosePayment={closePayment}
            pendingType={pendingType}
            pendingMethod={pendingMethod}
            pendingAmount={pendingAmount}
            pendingCardTime={pendingCardTime}
            pendingGiftCardNumber={pendingGiftCardNumber}
            pendingGiftCardImage={pendingGiftCardImage}
            onPendingGiftCardNumberChange={(val) => updateDraft({ pendingGiftCardNumber: val })}
            onPendingGiftCardImageChange={(val) => updateDraft({ pendingGiftCardImage: val })}
            onPendingTypeChange={(val) => updateDraft({ pendingType: val })}
            onPendingMethodChange={(val) => updateDraft({ pendingMethod: val })}
            onPendingAmountChange={(val) => updateDraft({ pendingAmount: val })}
            onPendingCardTimeChange={(val) => updateDraft({ pendingCardTime: val })}
            onAddEntry={addPaymentEntry}
            onMarkNoTip={markNoTip}
            tipResolved={tipResolved}
            paymentEntries={paymentEntries}
            onRemoveEntry={removePaymentEntry}
            serviceTotal={serviceTotal}
            remainingBalance={remainingBalance}
            totalCollected={totalCollected}
            paymentStatus={orderStatus}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            {editingId && (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600
                             hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
                             hover:bg-blue-700 active:bg-blue-800 transition-colors"
                >
                  完成修改
                </button>
              </>
            )}
            {!editingId && (
              <button
                type="button"
                onClick={handleComplete}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
                           hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                完成本工
              </button>
            )}
          </div>

          {/* Delete — in overflow menu style */}
          {editingId && (
            <div className="relative flex justify-center">
              <div className="group relative">
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
                >
                  <span>···</span>
                  <span className="text-xs">更多</span>
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                  <div className="rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="block w-full px-4 py-1.5 text-xs text-red-600 hover:bg-red-50 whitespace-nowrap"
                    >
                      删除整条记录
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}