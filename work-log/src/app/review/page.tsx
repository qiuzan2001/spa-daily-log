"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { parseServiceNotation, formatServiceNotation } from "@/lib/parser";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, AlertTriangle, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReviewRow {
  rowIndex: number;
  time: string;
  room: string;
  notationImage: string; // canvas data URL
  keyboardText?: string; // for mock OCR
  parsed: ReturnType<typeof parseServiceNotation>;
  hasKeyboardInput: boolean;
}

export default function ReviewPage() {
  const router = useRouter();
  const { user } = useSession();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [mockText, setMockText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showOcrDialog, setShowOcrDialog] = useState(false);
  const [parsedItems, setParsedItems] = useState<Record<number, ReturnType<typeof parseServiceNotation>>>({});

  useEffect(() => {
    // Load data from sessionStorage
    const data = sessionStorage.getItem("review-data");
    if (!data) {
      router.push("/therapist");
      return;
    }
    try {
      const { rows: rawRows } = JSON.parse(data);
      const initialRows: ReviewRow[] = rawRows.map((r: { time: string; room: string; notation: string }, i: number) => ({
        rowIndex: i,
        time: r.time,
        room: r.room,
        notationImage: r.notation,
        parsed: parseServiceNotation(""),
        hasKeyboardInput: false,
      }));
      setRows(initialRows);
    } catch {
      router.push("/therapist");
    }
  }, [router]);

  useEffect(() => {
    if (!user || user.role === "therapist") {
      // Therapists can access this page
    }
  }, [user]);

  const handleMockOcr = useCallback((rowIndex: number, text: string) => {
    setProcessing(true);
    const parsed = parseServiceNotation(text);
    setParsedItems((prev) => ({ ...prev, [rowIndex]: parsed }));
    setRows((prev) => prev.map((r) =>
      r.rowIndex === rowIndex ? { ...r, parsed, hasKeyboardInput: true, keyboardText: text } : r
    ));
    setProcessing(false);
    setShowOcrDialog(false);
    setMockText("");
  }, []);

  const handleSkip = useCallback((rowIndex: number) => {
    setRows((prev) => prev.map((r) =>
      r.rowIndex === rowIndex ? { ...r, parsed: parseServiceNotation(""), hasKeyboardInput: false } : r
    ));
  }, []);

  const handleConfirm = useCallback(async (rowIndex: number) => {
    const row = rows.find((r) => r.rowIndex === rowIndex);
    if (!row) return;

    // Store confirmed data
    const confirmedData = {
      rowIndex: row.rowIndex,
      time: row.time,
      room: row.room,
      notation: row.parsed,
      rawText: row.keyboardText || "",
    };

    // Save to sessionStorage for submission
    const existing = JSON.parse(sessionStorage.getItem("confirmed-rows") || "[]");
    existing.push(confirmedData);
    sessionStorage.setItem("confirmed-rows", JSON.stringify(existing));

    // Mark as confirmed
    setRows((prev) => prev.map((r) =>
      r.rowIndex === rowIndex ? { ...r, parsed: { ...r.parsed, status: "confirmed" as any } } : r
    ));
  }, [rows]);

  const handleSubmitAll = useCallback(async () => {
    if (!user) return;
    const confirmed = JSON.parse(sessionStorage.getItem("confirmed-rows") || "[]");
    if (confirmed.length === 0) {
      alert("请先确认至少一条记录");
      return;
    }

    try {
      // Create worksheet
      const wsRes = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          therapistId: user.id,
        }),
      });
      const wsData = await wsRes.json();
      const worksheetId = wsData.worksheet.id;

      // Create entries
      for (const conf of confirmed) {
        const entryRes = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worksheetId,
            rowNumber: conf.rowIndex + 1,
            startTime: conf.time,
            room: conf.room,
            rawHandwritingImage: rows[conf.rowIndex]?.notationImage || "",
            rawOcrText: conf.rawText,
          }),
        });
        const entryData = await entryRes.json();
        const entryId = entryData.entry.id;

        // Submit review
        const formatted = formatServiceNotation({
          massageBase: conf.notation.massageBase,
          items: conf.notation.items,
          cardTip: conf.notation.cardTip,
          cashTip: conf.notation.cashTip,
        });

        await fetch(`/api/entries/${entryId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            confirmedNotation: formatted,
            items: conf.notation.items,
            massageCash: conf.notation.massageTotal,
            massageCard: 0,
            facialCash: 0,
            facialCard: conf.notation.facialTotal,
            cardTip: conf.notation.cardTip,
            cashTip: conf.notation.cashTip,
            confirmedById: user.id,
            status: "reviewed",
          }),
        });
      }

      // Update worksheet status
      await fetch(`/api/worksheets/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });

      // Clean up
      sessionStorage.removeItem("review-data");
      sessionStorage.removeItem("confirmed-rows");
      localStorage.removeItem(`worksheet-draft-${new Date().toISOString().split("T")[0]}`);

      alert("提交成功！");
      router.push("/therapist");
    } catch (err) {
      console.error("Submit error:", err);
      alert("提交失败，请重试");
    }
  }, [user, rows, router]);

  const currentRow = rows[currentRowIndex];

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/therapist")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">核对记录</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              第 {currentRowIndex + 1} / {rows.length} 行
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {/* Row navigation */}
        <div className="flex gap-2 mb-4 no-print">
          {rows.map((r, i) => (
            <Button
              key={i}
              variant={i === currentRowIndex ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => setCurrentRowIndex(i)}
            >
              {i + 1}
            </Button>
          ))}
        </div>

        {currentRow && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original handwriting */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">原始手写</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRow.notationImage ? (
                  <img src={currentRow.notationImage} alt="手写笔记" className="border rounded max-w-full" />
                ) : (
                  <div className="text-sm text-gray-400 italic">无手写内容</div>
                )}

                {!currentRow.hasKeyboardInput && (
                  <div className="mt-4 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowOcrDialog(true)}
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Mock OCR - 输入识别文字
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSkip(currentRowIndex)}
                    >
                      跳过 - 手动填写
                    </Button>
                  </div>
                )}

                {currentRow.hasKeyboardInput && (
                  <div className="mt-2">
                    <Badge variant="success">已识别</Badge>
                    <p className="text-sm mt-1 font-mono bg-gray-50 p-2 rounded">
                      {currentRow.keyboardText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Parsed result */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">解析结果</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRow.parsed.rawText ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">按摩基础：</span>
                      {formatCurrency(currentRow.parsed.massageBase)}
                    </div>

                    {currentRow.parsed.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
                        <span>
                          <Badge variant={item.category === "facial" ? "success" : "secondary"} className="mr-2">
                            {item.category === "facial" ? "美容" : "按摩"}
                          </Badge>
                          {item.name}
                        </span>
                        <span className="font-mono">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}

                    {currentRow.parsed.unknownTokens.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        无法识别：{currentRow.parsed.unknownTokens.join(", ")}
                      </div>
                    )}

                    {currentRow.parsed.warnings.map((w, i) => (
                      <div key={i} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        {w}
                      </div>
                    ))}

                    <div className="border-t pt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>按摩类合计：</span>
                        <span className="font-semibold">{formatCurrency(currentRow.parsed.massageTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>美容类合计：</span>
                        <span className="font-semibold">{formatCurrency(currentRow.parsed.facialTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>服务总额：</span>
                        <span className="font-semibold">{formatCurrency(currentRow.parsed.serviceTotal)}</span>
                      </div>
                      {currentRow.parsed.cardTip > 0 && (
                        <div className="flex justify-between">
                          <span>刷卡小费：</span>
                          <span className="font-semibold">{formatCurrency(currentRow.parsed.cardTip)}</span>
                        </div>
                      )}
                      {currentRow.parsed.cashTip > 0 && (
                        <div className="flex justify-between">
                          <span>现金小费：</span>
                          <span className="font-semibold">{formatCurrency(currentRow.parsed.cashTip)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-bold border-t pt-1">
                        <span>含小费总额：</span>
                        <span>{formatCurrency(currentRow.parsed.totalWithTips)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">请先识别手写内容</div>
                )}

                {currentRow.hasKeyboardInput && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleConfirm(currentRowIndex)}
                    >
                      <Check className="h-4 w-4 mr-1" /> 确认本单
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOcrDialog(true)}
                    >
                      修改
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Submit all button */}
        <div className="mt-6 flex justify-end no-print">
          <Button
            size="lg"
            onClick={handleSubmitAll}
            className="px-8"
          >
            <Check className="h-5 w-5 mr-2" /> 确认全部并提交
          </Button>
        </div>
      </main>

      {/* OCR Dialog */}
      {showOcrDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-2">Mock OCR 识别</h3>
            <p className="text-sm text-gray-500 mb-4">
              请输入你在手写区域写下的文字，系统将模拟 OCR 识别结果。
            </p>
            <Input
              value={mockText}
              onChange={(e) => setMockText(e.target.value)}
              placeholder="例如：80 + 油5 + 淋20 + 拔20 + 美35 + 刮10 + T15"
              className="mb-4"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowOcrDialog(false)}>
                <X className="h-4 w-4 mr-1" /> 取消
              </Button>
              <Button onClick={() => handleMockOcr(currentRowIndex, mockText)} disabled={!mockText || processing}>
                <Check className="h-4 w-4 mr-1" /> 识别
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}