"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Eye, CheckCircle, XCircle } from "lucide-react";
import { getTodayStr, getStatusLabel } from "@/lib/utils";

interface TherapistStatus {
  id: string;
  name: string;
  status: string;
  entryCount: number;
  worksheetId: string;
}

export default function FrontDeskPage() {
  const router = useRouter();
  const [therapists, setTherapists] = useState<TherapistStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(getTodayStr());

  useEffect(() => {
    fetchData();
  }, [date]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/worksheets?date=${date}`);
      const data = await res.json();
      const statuses = (Array.isArray(data) ? data : data.worksheets || []).map((ws: any) => ({
        id: ws.employee_id?.toString() || ws.therapistId,
        name: ws.employee_name || ws.therapist?.name || "Unknown",
        status: ws.status,
        entryCount: ws.entry_count || ws.entries?.length || 0,
        worksheetId: ws.id?.toString() || ws.worksheetId,
      }));
      setTherapists(statuses);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLock(worksheetId: string) {
    if (!confirm("确定锁定该工作表？锁定后员工无法修改。")) return;
    try {
      await fetch(`/api/worksheets/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "locked" }),
      });
      fetchData();
    } catch (err) {
      console.error("Lock error:", err);
    }
  }

  async function handleReject(worksheetId: string) {
    const reason = prompt("请输入退回原因：");
    if (!reason) return;
    try {
      await fetch(`/api/worksheets/${worksheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      // Create audit log
      await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: 1,
          entityType: "worksheet",
          entityId: worksheetId,
          action: "reject",
          reason,
        }),
      });
      fetchData();
    } catch (err) {
      console.error("Reject error:", err);
    }
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
            <h1 className="text-lg font-semibold text-gray-900">前台 - 员工状态</h1>
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="grid gap-4">
          {therapists.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-400">
                {date} 暂无工作表
              </CardContent>
            </Card>
          ) : (
            therapists.map((t) => (
              <Card key={t.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <p className="text-sm text-gray-500">{t.entryCount} 单</p>
                  </div>
                  <Badge variant={t.status === "locked" ? "outline" : t.status === "submitted" ? "success" : "warning"}>
                    {getStatusLabel(t.status)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/today?therapistId=${t.id}`, "_blank")}
                    >
                      <Eye className="h-4 w-4 mr-1" /> 查看
                    </Button>
                    {t.status === "submitted" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(t.worksheetId)}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> 退回
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleLock(t.worksheetId)}
                        >
                          <Lock className="h-4 w-4 mr-1" /> 锁定
                        </Button>
                      </>
                    )}
                    {t.status === "draft" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLock(t.worksheetId)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> 确认并锁定
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}