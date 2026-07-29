"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useAutoSave } from "@/hooks/use-auto-save";
import { HandwritingCanvas, HandwritingCanvasHandle } from "@/components/canvas/handwriting-canvas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getTodayStr, getStatusLabel } from "@/lib/utils";
import { ArrowLeft, Save, Scan, Trash2, Plus } from "lucide-react";

interface RowData {
  id: string;
  time: string;
  room: string;
  notation: string; // canvas data URL or keyboard text
  massageCash: string;
  massageCard: string;
  cardTip: string;
  facialCash: string;
  facialCard: string;
}

const DEFAULT_ROWS = 8;
const STORAGE_KEY_PREFIX = "worksheet-draft-";

export default function TherapistPage() {
  const router = useRouter();
  const { user, isLoading: sessionLoading } = useSession();
  const [rows, setRows] = useState<RowData[]>(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${getTodayStr()}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    // Initialize with empty rows
    return Array.from({ length: DEFAULT_ROWS }, (_, i) => ({
      id: `row-${i}`,
      time: "",
      room: "",
      notation: "",
      massageCash: "",
      massageCard: "",
      cardTip: "",
      facialCash: "",
      facialCard: "",
    }));
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRefs = useRef<Record<string, HandwritingCanvasHandle | null>>({});

  // Auto-save every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const data = rows.map((r) => ({
        ...r,
        // Get latest canvas data
        notation: canvasRefs.current[r.id]?.getDataUrl() || r.notation,
      }));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${getTodayStr()}`, JSON.stringify(data));
      setLastSaved(new Date());
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 3000);
    }, 5000);
    return () => clearInterval(timer);
  }, [rows]);

  // Redirect if not logged in
  useEffect(() => {
    if (!sessionLoading && !user) {
      router.push("/");
    }
  }, [user, sessionLoading, router]);

  const updateRow = useCallback((index: number, field: keyof RowData, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${prev.length}`,
        time: "",
        room: "",
        notation: "",
        massageCash: "",
        massageCard: "",
        cardTip: "",
        facialCash: "",
        facialCard: "",
      },
    ]);
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm("确定清空整张表？所有未保存的数据将丢失。")) return;
    setRows(
      Array.from({ length: DEFAULT_ROWS }, (_, i) => ({
        id: `row-${i}`,
        time: "",
        room: "",
        notation: "",
        massageCash: "",
        massageCard: "",
        cardTip: "",
        facialCash: "",
        facialCard: "",
      }))
    );
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${getTodayStr()}`);
  }, []);

  const handleSaveDraft = useCallback(() => {
    const data = rows.map((r) => ({
      ...r,
      notation: canvasRefs.current[r.id]?.getDataUrl() || r.notation,
    }));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${getTodayStr()}`, JSON.stringify(data));
    setLastSaved(new Date());
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 3000);
  }, [rows]);

  const handleReview = useCallback(async () => {
    setSaving(true);
    try {
      // Save all canvas data first
      const data = rows.map((r) => ({
        ...r,
        notation: canvasRefs.current[r.id]?.getDataUrl() || r.notation,
      }));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${getTodayStr()}`, JSON.stringify(data));

      // Store for review page
      sessionStorage.setItem("review-data", JSON.stringify({ rows: data, date: getTodayStr(), therapistId: user?.id }));
      router.push("/review");
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }, [rows, user, router]);

  if (sessionLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Lake Spa Massage</h1>
              <p className="text-xs text-gray-500">
                {getTodayStr()} | {user.name} |{" "}
                <Badge variant="outline" className="text-[10px]">草稿</Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {showSaveIndicator && lastSaved && (
              <span className="text-xs text-gray-400 auto-save-indicator">
                已自动保存 {lastSaved.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="work-log-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th className="w-20">时间</th>
                <th className="w-16">Room</th>
                <th className="min-w-[200px]">原始记账</th>
                <th className="w-24">按摩现金</th>
                <th className="w-24">按摩刷卡</th>
                <th className="w-24">小费刷卡</th>
                <th className="w-24">美容现金</th>
                <th className="w-24">美容刷卡</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="text-gray-400 text-xs">{index + 1}</td>
                  <td>
                    <Input
                      value={row.time}
                      onChange={(e) => updateRow(index, "time", e.target.value)}
                      placeholder="10:00"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1"
                    />
                  </td>
                  <td>
                    <Input
                      value={row.room}
                      onChange={(e) => updateRow(index, "room", e.target.value)}
                      placeholder="1"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1"
                    />
                  </td>
                  <td className="notation-cell">
                    <HandwritingCanvas
                      ref={(el) => { canvasRefs.current[row.id] = el; }}
                      width={300}
                      height={80}
                      uniqueId={`${getTodayStr()}-${row.id}`}
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={row.massageCash}
                      onChange={(e) => updateRow(index, "massageCash", e.target.value)}
                      placeholder="$"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1 text-right"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={row.massageCard}
                      onChange={(e) => updateRow(index, "massageCard", e.target.value)}
                      placeholder="$"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1 text-right"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={row.cardTip}
                      onChange={(e) => updateRow(index, "cardTip", e.target.value)}
                      placeholder="$"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1 text-right"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={row.facialCash}
                      onChange={(e) => updateRow(index, "facialCash", e.target.value)}
                      placeholder="$"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1 text-right"
                    />
                  </td>
                  <td>
                    <Input
                      type="number"
                      value={row.facialCard}
                      onChange={(e) => updateRow(index, "facialCard", e.target.value)}
                      placeholder="$"
                      className="h-8 text-xs border-0 shadow-none focus:ring-0 px-1 text-right"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4 no-print">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> 新增行
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-1" /> 保存草稿
          </Button>
          <Button size="sm" onClick={handleReview} disabled={saving}>
            <Scan className="h-4 w-4 mr-1" /> 识别并核对
          </Button>
          <Button variant="destructive" size="sm" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1" /> 清空整张表
          </Button>
        </div>
      </main>
    </div>
  );
}