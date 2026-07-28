"use client";

import React from "react";

interface NumericKeypadProps {
  onInput: (value: string) => void;
  onConfirm: () => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const KEYS = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["00", "0", "."],
];

export default function NumericKeypad({
  onInput,
  onConfirm,
  onBackspace,
  disabled,
}: NumericKeypadProps) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-1.5">
        {KEYS.flat().map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => onInput(key)}
            className="h-11 rounded-lg border border-zinc-200 bg-white text-base font-medium text-zinc-800
                       hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-40
                       transition-colors"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="h-11 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-500
                     hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-40
                     transition-colors"
        >
          退格
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onConfirm}
          className="col-span-2 h-11 rounded-lg bg-blue-600 text-base font-medium text-white
                     hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40
                     transition-colors"
        >
          确认
        </button>
      </div>
    </div>
  );
}