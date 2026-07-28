"use client";

import React, { useState } from "react";
import { ServiceMode, SERVICE_MODES } from "@/types";
import { ServiceDef, getServicesByCategory, MASSAGE_MENU, getEnabledAddons, AddonDef } from "@/lib/service-library";

interface ServiceInputProps {
  selectedMode: ServiceMode;
  onModeChange: (mode: ServiceMode) => void;
  editingItemId: string | null;
  editingItemShortName: string | null;
  selectedMassageCategory: string | null;
  selectedMassageService: string | null;
  onSelectService: (service: ServiceDef) => void;
  onSelectMassageService: (serviceId: string, minutes: number, price: number, shortName: string, label: string) => void;
  onSelectAddon: (addon: AddonDef) => void;
  onCustomService: (price: number, durationHours: number, durationMinutes: number) => void;
  onCancelEdit: () => void;
  onSetMassageCategory: (name: string | null) => void;
  onSetMassageService: (id: string | null) => void;
}

export default function ServiceInput({
  selectedMode,
  onModeChange,
  editingItemId,
  editingItemShortName,
  selectedMassageCategory,
  selectedMassageService,
  onSelectService,
  onSelectMassageService,
  onSelectAddon,
  onCustomService,
  onCancelEdit,
  onSetMassageCategory,
  onSetMassageService,
}: ServiceInputProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("0");

  const services = getServicesByCategory(
    selectedMode === "按摩" ? "massage" :
    selectedMode === "美容" ? "facial" :
    selectedMode === "油" ? "oil" : "project"
  );

  const addons = getEnabledAddons();

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(customPrice);
    const hours = parseInt(customHours) || 0;
    const mins = parseInt(customMinutes) || 0;
    if (isNaN(price) || price <= 0) return;
    onCustomService(price, hours, mins);
    setCustomPrice("");
    setCustomHours("0");
    setCustomMinutes("0");
    setShowCustom(false);
  };

  /** Render massage hierarchy (3 levels) */
  const renderMassageHierarchy = () => {
    // Level 1: Category selection
    if (!selectedMassageCategory) {
      return (
        <div className="space-y-1">
          <p className="text-xs text-zinc-400 mb-1">选择类别</p>
          {MASSAGE_MENU.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSetMassageCategory(cat.name)}
              className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              <span className="font-medium">{cat.name}</span>
              <span className="text-xs text-zinc-400">›</span>
            </button>
          ))}
        </div>
      );
    }

    // Level 2: Service selection within category
    const category = MASSAGE_MENU.find((c) => c.name === selectedMassageCategory);
    if (!selectedMassageService && category) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => onSetMassageCategory(null)}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              ‹ 返回
            </button>
            <p className="text-xs text-zinc-400">{selectedMassageCategory}</p>
          </div>
          {category.services.map((svc) => {
            // Single-duration services (Quick Relief) auto-select immediately
            const singleDuration = svc.durations.length === 1 ? svc.durations[0] : null;
            if (singleDuration) {
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => {
                    onSelectMassageService(svc.id, singleDuration.minutes, singleDuration.price, singleDuration.shortName, svc.name);
                    onSetMassageCategory(null);
                  }}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  <span>{svc.name}</span>
                  <span className="text-xs text-zinc-500">${singleDuration.price}</span>
                </button>
              );
            }
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onSetMassageService(svc.id)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                <span>{svc.name}</span>
                <span className="text-xs text-zinc-400">›</span>
              </button>
            );
          })}
          {/* + Custom for Massage */}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="w-full py-2.5 rounded-lg text-sm border border-dashed border-zinc-300 text-zinc-400
                       hover:border-zinc-400 hover:text-zinc-500 transition-colors mt-1"
          >
            + Custom
          </button>
          {renderCustomDialog()}
        </div>
      );
    }

    // Level 3: Duration selection (for multi-duration services)
    if (category && selectedMassageService) {
      const service = category.services.find((s) => s.id === selectedMassageService);
      if (service) {
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={() => onSetMassageService(null)}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                ‹ 返回
              </button>
              <p className="text-xs text-zinc-400">{service.name}</p>
            </div>
            {service.durations.map((dur) => (
              <button
                key={dur.minutes}
                type="button"
                onClick={() => {
                  onSelectMassageService(service.id, dur.minutes, dur.price, dur.shortName, service.name);
                  onSetMassageService(null);
                  onSetMassageCategory(null);
                }}
                className="w-full flex items-center justify-between py-3 px-3 rounded-lg text-sm border border-zinc-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
              >
                <span>{dur.minutes} 分钟</span>
                <span className="font-semibold text-zinc-800">${dur.price}</span>
              </button>
            ))}
          </div>
        );
      }
    }
    return null;
  };

  /** Render add-on cards (Projects tab) */
  const renderAddons = () => {
    return (
      <div className="space-y-2">
        <p className="text-xs text-zinc-400 mb-1">附加服务</p>
        {addons.map((addon) => (
          <button
            key={addon.id}
            type="button"
            onClick={() => onSelectAddon(addon)}
            className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-sm border border-zinc-200 text-zinc-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
          >
            <div className="text-left">
              <span className="font-medium">{addon.name}</span>
              <div className="text-xs text-zinc-400">
                +{addon.durationMinutes} min
              </div>
            </div>
            <span className="font-semibold text-zinc-700">+${addon.price}</span>
          </button>
        ))}

        {/* Custom add-on */}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="w-full py-3 rounded-lg text-sm border border-dashed border-zinc-300 text-zinc-400
                     hover:border-zinc-400 hover:text-zinc-500 transition-colors mt-2"
        >
          + Custom
        </button>

        {/* Custom dialog */}
        {showCustom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-5 w-72 space-y-3">
              <h4 className="text-sm font-medium text-zinc-700">Custom</h4>
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Price"
                    className="w-full rounded-lg border border-zinc-200 py-2 pl-7 pr-3 text-sm
                               focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    min={1}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400">Hours</label>
                    <input
                      type="number"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm
                                 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      min={0}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400">Minutes</label>
                    <input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm
                                 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      min={0}
                      max={59}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustom(false)}
                    className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-500
                               hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white
                               hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  /** Render flat service grid (for Facial, Oil) */
  const renderFlatGrid = () => {
    return (
      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-1.5">
          {services.map((svc) => {
            const isSelected = editingItemShortName === svc.shortName;
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => onSelectService(svc)}
                className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm border transition-colors ${
                  isSelected
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>{svc.name}</span>
                <span className="text-zinc-400 text-xs font-medium">${svc.price}</span>
              </button>
            );
          })}
        </div>
        {/* Custom for flat modes */}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className="w-full py-2 rounded-lg text-sm border border-dashed border-zinc-300 text-zinc-400
                     hover:border-zinc-400 hover:text-zinc-500 transition-colors"
        >
          + Custom
        </button>
        {renderCustomDialog()}
      </div>
    );
  };

  const renderCustomDialog = () => {
    if (!showCustom) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-lg p-5 w-72 space-y-3">
          <h4 className="text-sm font-medium text-zinc-700">Custom</h4>
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Price"
                className="w-full rounded-lg border border-zinc-200 py-2 pl-7 pr-3 text-sm
                           focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                min={1}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-zinc-400">Hours</label>
                <input
                  type="number"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm
                             focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  min={0}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-zinc-400">Minutes</label>
                <input
                  type="number"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm
                             focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  min={0}
                  max={59}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-500
                           hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm text-white
                           hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-0.5">
        {SERVICE_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => {
              onModeChange(mode);
              // Reset massage hierarchy when switching tabs
              if (mode !== "按摩") {
                onSetMassageCategory(null);
                onSetMassageService(null);
              }
              if (editingItemId) onCancelEdit();
            }}
            className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors ${
              selectedMode === mode
                ? "bg-white text-zinc-800 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {mode === "项目" ? "Add-ons" : mode}
          </button>
        ))}
      </div>

      {/* Content based on mode */}
      {selectedMode === "按摩" && renderMassageHierarchy()}
      {selectedMode === "项目" && renderAddons()}
      {(selectedMode === "美容" || selectedMode === "油") && renderFlatGrid()}
    </div>
  );
}