"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Download, Search, Settings } from "lucide-react";
import { getTodayStr, formatCurrency } from "@/lib/utils";

export default function OwnerPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [searchDate, setSearchDate] = useState(getTodayStr());
  const [searchTherapist, setSearchTherapist] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchEntries();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch(`/api/owner/stats?date=${getTodayStr()}`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Stats error:", err);
    }
  }

  async function fetchEntries() {
    try {
      const params = new URLSearchParams();
      if (searchDate) params.set("date", searchDate);
      if (searchTherapist) params.set("employee_id", searchTherapist);
      const res = await fetch(`/api/worksheets?${params}`);
      const data = await res.json();
      const worksheets = Array.isArray(data) ? data : data.worksheets || [];
      const allEntries = worksheets.flatMap((ws: any) => {
        const entries = ws.entries || [];
        return entries.map((e: any) => ({ ...e, therapistName: ws.employee_name || ws.employee?.name || "" }));
      });
      setEntries(allEntries.sort((a: any, b: any) => a.row_number - b.row_number));
    } catch (err) {
      console.error("Entries error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    const params = new URLSearchParams();
    if (searchDate) params.set("date", searchDate);
    if (searchTherapist) params.set("employee_id", searchTherapist);
    window.open(`/api/export?${params}`, "_blank");
  }

  if (loading) {
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">老板后台</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/owner/codes")}>
              <Settings className="h-4 w-4 mr-1" /> 项目管理
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Dashboard stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日按摩收入</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayMassageIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日美容收入</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayFacialIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日小费</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayTips)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日服务单数</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.todayServiceCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日现金</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayCash)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-gray-500">今日刷卡</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(stats.todayCard)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">搜索与筛选</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">日期：</span>
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">按摩师：</span>
                <Input
                  value={searchTherapist}
                  onChange={(e) => setSearchTherapist(e.target.value)}
                  placeholder="全部"
                  className="w-32"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchEntries}>
                <Search className="h-4 w-4 mr-1" /> 搜索
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> 导出 CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>按摩师</TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead className="min-w-[150px]">原始记账</TableHead>
                  <TableHead>按摩现金</TableHead>
                  <TableHead>按摩刷卡</TableHead>
                  <TableHead>小费</TableHead>
                  <TableHead>美容</TableHead>
                  <TableHead>总计</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-400">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{entry.worksheet?.date || searchDate}</TableCell>
                      <TableCell>{entry.therapistName}</TableCell>
                      <TableCell>{entry.row_number || entry.rowNumber}</TableCell>
                      <TableCell>{entry.start_time || entry.startTime || "-"}</TableCell>
                      <TableCell>{entry.room || "-"}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">
                        {entry.confirmed_notation || entry.confirmedNotation || entry.raw_ocr_text || entry.rawOcrText || "-"}
                      </TableCell>
                      <TableCell>{(entry.massage_cash ?? entry.massageCash) > 0 ? formatCurrency(entry.massage_cash ?? entry.massageCash) : "-"}</TableCell>
                      <TableCell>{(entry.massage_card ?? entry.massageCard) > 0 ? formatCurrency(entry.massage_card ?? entry.massageCard) : "-"}</TableCell>
                      <TableCell>{(entry.card_tip ?? entry.cardTip) > 0 ? formatCurrency(entry.card_tip ?? entry.cardTip) : "-"}</TableCell>
                      <TableCell>{(entry.facial_total ?? entry.facialTotal) > 0 ? formatCurrency(entry.facial_total ?? entry.facialTotal) : "-"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(entry.total_with_tips ?? entry.totalWithTips)}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "reviewed" ? "success" : "warning"} className="text-[10px]">
                          {entry.status === "reviewed" ? "已核对" : entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}