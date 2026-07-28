"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Eye, History } from "lucide-react";
import { getTodayStr, formatCurrency, getStatusLabel } from "@/lib/utils";

interface Entry {
  id: string;
  row_number: number;
  start_time: string;
  end_time: string;
  room: string;
  confirmed_notation: string;
  massage_cash: number;
  massage_card: number;
  facial_cash: number;
  facial_card: number;
  card_tip: number;
  cash_tip: number;
  massage_total: number;
  facial_total: number;
  service_total: number;
  total_with_tips: number;
  status: string;
  raw_handwriting_image: string | null;
  raw_ocr_text: string | null;
}

export default function TodayPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "therapist" && user.role !== "front_desk" && user.role !== "owner"))) {
      router.push("/");
      return;
    }

    if (user) {
      fetchEntries();
    }
  }, [user, isLoading]);

  async function fetchEntries() {
    try {
      const today = getTodayStr();
      const params = user?.role === "therapist" ? `?date=${today}&employee_id=${user.id}` : `?date=${today}`;
      const res = await fetch(`/api/worksheets${params}`);
      const data = await res.json();
      const worksheets = Array.isArray(data) ? data : data.worksheets || [];
      const allEntries = worksheets.flatMap((ws: any) => {
        const entries = ws.entries || [];
        return entries.map((e: any) => ({ ...e, therapistName: ws.employee_name || ws.employee?.name || "" }));
      });
      setEntries(allEntries.sort((a: any, b: any) => a.row_number - b.row_number));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const totals = entries.reduce(
    (acc, e) => ({
      massageCash: acc.massageCash + e.massage_cash,
      massageCard: acc.massageCard + e.massage_card,
      facialCash: acc.facialCash + e.facial_cash,
      facialCard: acc.facialCard + e.facial_card,
      cardTip: acc.cardTip + e.card_tip,
      cashTip: acc.cashTip + e.cash_tip,
      massageTotal: acc.massageTotal + e.massage_total,
      facialTotal: acc.facialTotal + e.facial_total,
      serviceTotal: acc.serviceTotal + e.service_total,
      grandTotal: acc.grandTotal + e.total_with_tips,
    }),
    { massageCash: 0, massageCard: 0, facialCash: 0, facialCard: 0, cardTip: 0, cashTip: 0, massageTotal: 0, facialTotal: 0, serviceTotal: 0, grandTotal: 0 }
  );

  if (isLoading || loading) {
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
            <h1 className="text-lg font-semibold text-gray-900">当日记录</h1>
            <span className="text-sm text-gray-500">{getTodayStr()}</span>
          </div>
          <Badge variant="outline">{entries.length} 单</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="min-w-[200px]">原始记账</TableHead>
                  <TableHead>按摩现金</TableHead>
                  <TableHead>按摩刷卡</TableHead>
                  <TableHead>小费刷卡</TableHead>
                  <TableHead>美容现金</TableHead>
                  <TableHead>美容刷卡</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.row_number}</TableCell>
                      <TableCell>{entry.start_time || "-"}</TableCell>
                      <TableCell>{entry.room || "-"}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {entry.confirmed_notation || entry.raw_ocr_text || "-"}
                      </TableCell>
                      <TableCell>{entry.massage_cash > 0 ? formatCurrency(entry.massage_cash) : "-"}</TableCell>
                      <TableCell>{entry.massage_card > 0 ? formatCurrency(entry.massage_card) : "-"}</TableCell>
                      <TableCell>{entry.card_tip > 0 ? formatCurrency(entry.card_tip) : "-"}</TableCell>
                      <TableCell>{entry.facial_cash > 0 ? formatCurrency(entry.facial_cash) : "-"}</TableCell>
                      <TableCell>{entry.facial_card > 0 ? formatCurrency(entry.facial_card) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "reviewed" ? "success" : "warning"}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedEntry(entry)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Totals */}
        {entries.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">合计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">按摩现金</span>
                  <p className="font-semibold">{formatCurrency(totals.massageCash)}</p>
                </div>
                <div>
                  <span className="text-gray-500">按摩刷卡</span>
                  <p className="font-semibold">{formatCurrency(totals.massageCard)}</p>
                </div>
                <div>
                  <span className="text-gray-500">小费刷卡</span>
                  <p className="font-semibold">{formatCurrency(totals.cardTip)}</p>
                </div>
                <div>
                  <span className="text-gray-500">美容现金</span>
                  <p className="font-semibold">{formatCurrency(totals.facialCash)}</p>
                </div>
                <div>
                  <span className="text-gray-500">美容刷卡</span>
                  <p className="font-semibold">{formatCurrency(totals.facialCard)}</p>
                </div>
                <div>
                  <span className="text-gray-500">服务总额</span>
                  <p className="font-semibold">{formatCurrency(totals.serviceTotal)}</p>
                </div>
                <div>
                  <span className="text-gray-500">小费总额</span>
                  <p className="font-semibold">{formatCurrency(totals.cardTip + totals.cashTip)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">全部总计</span>
                  <p className="font-bold text-lg">{formatCurrency(totals.grandTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Entry detail dialog */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">记录详情 #{selectedEntry.row_number}</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-gray-500">时间：</span>{selectedEntry.start_time || "-"}</div>
                <div><span className="text-gray-500">Room：</span>{selectedEntry.room || "-"}</div>
              </div>
              <div>
                <span className="text-gray-500">原始记账：</span>
                <p className="font-mono bg-gray-50 p-2 rounded mt-1">{selectedEntry.confirmed_notation || selectedEntry.raw_ocr_text || "-"}</p>
              </div>
              {selectedEntry.raw_handwriting_image && (
                <div>
                  <span className="text-gray-500">手写原图：</span>
                  <img src={selectedEntry.raw_handwriting_image} alt="手写" className="border rounded mt-1 max-w-full" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 border-t pt-2">
                <div>按摩现金：{formatCurrency(selectedEntry.massage_cash)}</div>
                <div>按摩刷卡：{formatCurrency(selectedEntry.massage_card)}</div>
                <div>小费刷卡：{formatCurrency(selectedEntry.card_tip)}</div>
                <div>美容现金：{formatCurrency(selectedEntry.facial_cash)}</div>
                <div>美容刷卡：{formatCurrency(selectedEntry.facial_card)}</div>
              </div>
              <div className="border-t pt-2 font-bold">
                总计：{formatCurrency(selectedEntry.total_with_tips)}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedEntry(null)}>关闭</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}