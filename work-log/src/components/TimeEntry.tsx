"use client";

import React from "react";
import { DURATION_OPTIONS } from "@/types";

interface TimeEntryProps {
  startTime: string;
  durationMinutes: number;
  finishEarlyFiveMinutes: boolean;
  endTime: string;
  totalDuration: number; // auto-calculated from items
  onStartTimeChange: (val: string) => void;
  onDurationChange: (val: number) => void;
  onEarlyFiveToggle: (val: boolean) => void;
}

export default function TimeEntry({
  startTime,
  durationMinutes,
  finishEarlyFiveMinutes,
  endTime,
  totalDuration,
  onStartTimeChange,
  onDurationChange,
  onEarlyFiveToggle,
}: TimeEntryProps) {
  const isAutoCalculated = totalDuration > 0;

  return (
    <div className="space-y-3">
      {/* Start time */}
      <div className="flex items-center gap-3">
        <label className="w-20 text-sm text-zinc-500">开始时间</label>
        <input
          type="text"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm
                     focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          placeholder="hh:mm AM/PM"
        />
      </div>

      {/* Duration - auto-calculated from items, or manual override */}
      <div className="flex items-center gap-3">
        <label className="w-20 text-sm text-zinc-500">时长</label>
        <div className="flex flex-wrap gap-1.5">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDurationChange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                durationMinutes === d
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {d}分钟
            </button>
          ))}
          <button
            type="button"
            onClick={() => onDurationChange(0)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              !DURATION_OPTIONS.includes(durationMinutes)
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            自定义
          </button>
        </div>
      </div>

      {/* Show auto-calculated duration from items */}
      {isAutoCalculated && (
        <div className="flex items-center gap-3 pl-23">
          <span className="text-xs text-green-600">
            已根据服务项目自动计算：{totalDuration} 分钟
          </span>
          <button
            type="button"
            onClick={() => onDurationChange(totalDuration)}
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            应用
          </button>
        </div>
      )}

      {/* Custom duration input */}
      {!DURATION_OPTIONS.includes(durationMinutes) && durationMinutes !== totalDuration && (
        <div className="flex items-center gap-3 pl-23">
          <input
            type="number"
            value={durationMinutes || ""}
            onChange={(e) => onDurationChange(parseInt(e.target.value) || 0)}
            className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm
                       focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            placeholder="分钟"
            min={1}
          />
          <span className="text-sm text-zinc-400">分钟</span>
        </div>
      )}

      {/* Early 5 toggle */}
      <div className="flex items-center gap-3">
        <label className="w-20 text-sm text-zinc-500">提前5分钟</label>
        <button
          type="button"
          onClick={() => onEarlyFiveToggle(!finishEarlyFiveMinutes)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            finishEarlyFiveMinutes ? "bg-blue-600" : "bg-zinc-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              finishEarlyFiveMinutes ? "translate-x-[22px]" : "translate-x-[2px]"
            }`}
          />
        </button>
      </div>

      {/* End time (read-only) */}
      <div className="flex items-center gap-3">
        <label className="w-20 text-sm text-zinc-500">结束时间</label>
        <span className="text-sm font-medium text-zinc-800">{endTime}</span>
      </div>
    </div>
  );
}