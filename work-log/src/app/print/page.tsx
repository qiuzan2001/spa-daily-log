"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Printer } from "lucide-react";
import { getTodayStr, formatCurrency } from "@/lib/utils";

interface PrintData {
  [therapistName: string]: {
    name: string;
    entries: any[];
    totals: { massageTotal: number; facialTotal: number; cardTip: number; cashTip: number; serviceTotal: number; grandTotal: number };
  };
}

export default function PrintPage() {
  const router = useRouter();
  const [date, setDate] = useState(getTodayStr());
  const [printData, setPrintData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(false);


  async function fetchPrintData() {
    setLoading(true);
    try {
      const res = await fetch("/api/print/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      setPrintData(data.therapists);
    } catch (err) {
      console.error("Print fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPrintData();
  }, [date]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">打印管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> 打印
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* Print preview */}
        <div className="print-area">
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : !printData || Object.keys(printData).length === 0 ? (
            <div className="text-center py-12 text-gray-400">{date} 暂无数据</div>
          ) : (
            Object.entries(printData).map(([name, data]) => (
              <div key={name} className="print-page mb-8">
                <h1>Lake Spa Massage</h1>
                <div className="header-info">
                  <p>{date}</p>
                  <p><strong>{name}</strong></p>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>时间</th>
                      <th>Room</th>
                      <th>原始记账</th>
                      <th>按摩现金</th>
                      <th>按摩刷卡</th>
                      <th>小费刷卡</th>
                      <th>美容现金</th>
                      <th>美容刷卡</th>
                      <th>总计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((entry: any, idx: number) => (
                      <tr key={entry.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{entry.startTime || "-"}</td>
                        <td>{entry.room || "-"}</td>
                        <td style={{ textAlign: "left", fontFamily: "monospace", fontSize: "10px" }}>
                          {entry.confirmedNotation || entry.rawOcrText || "-"}
                        </td>
                        <td>{entry.massageCash > 0 ? `$${entry.massageCash}` : "-"}</td>
                        <td>{entry.massageCard > 0 ? `$${entry.massageCard}` : "-"}</td>
                        <td>{entry.cardTip > 0 ? `$${entry.cardTip}` : "-"}</td>
                        <td>{entry.facialCash > 0 ? `$${entry.facialCash}` : "-"}</td>
                        <td>{entry.facialCard > 0 ? `$${entry.facialCard}` : "-"}</td>
                        <td><strong>${entry.totalWithTips}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: "bold", backgroundColor: "#f0f0f0" }}>
                      <td colSpan={4}>合计</td>
                      <td>${data.totals.massageTotal}</td>
                      <td>-</td>
                      <td>${data.totals.cardTip}</td>
                      <td>${data.totals.facialTotal}</td>
                      <td>-</td>
                      <td>${data.totals.grandTotal}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}