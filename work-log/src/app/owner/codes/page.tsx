"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit2, Trash2 } from "lucide-react";

interface ServiceCode {
  id: string;
  name: string;
  chineseName: string;
  aliases: string;
  defaultAmount: number | null;
  commonAmounts: string;
  category: string;
  minAmount: number | null;
  maxAmount: number | null;
  active: boolean;
}

export default function CodesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<ServiceCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCode, setEditingCode] = useState<ServiceCode | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCodes();
  }, []);

  async function fetchCodes() {
    try {
      const res = await fetch("/api/codes");
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : data.codes || []);
    } catch (err) {
      console.error("Fetch codes error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(code: Partial<ServiceCode>) {
    try {
      if (code.id) {
        await fetch(`/api/codes/${code.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(code),
        });
      } else {
        await fetch("/api/codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(code),
        });
      }
      setShowForm(false);
      setEditingCode(null);
      fetchCodes();
    } catch (err) {
      console.error("Save code error:", err);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("确定停用此项目？")) return;
    try {
      await fetch(`/api/codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      fetchCodes();
    } catch (err) {
      console.error("Deactivate error:", err);
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
            <Button variant="ghost" size="icon" onClick={() => router.push("/owner")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">项目缩写管理</h1>
          </div>
          <Button size="sm" onClick={() => { setEditingCode(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> 新增项目
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>中文名</TableHead>
                  <TableHead>缩写</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>默认金额</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-medium">{code.name}</TableCell>
                    <TableCell>{code.chineseName}</TableCell>
                    <TableCell className="font-mono text-xs">{code.aliases || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={code.category === "facial" ? "success" : "secondary"}>
                        {code.category === "massage" ? "按摩" : code.category === "facial" ? "美容" : code.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{code.defaultAmount ? `$${code.defaultAmount}` : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={code.active ? "success" : "outline"}>
                        {code.active ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingCode(code); setShowForm(true); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        {code.active && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeactivate(code.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Edit/Create form dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCode ? "编辑项目" : "新增项目"}
            </h3>
            <CodeForm
              initial={editingCode}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingCode(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: ServiceCode | null;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [chineseName, setChineseName] = useState(initial?.chineseName || "");
  const [aliases, setAliases] = useState(initial?.aliases || "");
  const [category, setCategory] = useState(initial?.category || "massage");
  const [defaultAmount, setDefaultAmount] = useState(initial?.defaultAmount?.toString() || "");
  const [commonAmounts, setCommonAmounts] = useState(initial?.commonAmounts || "");
  const [minAmount, setMinAmount] = useState(initial?.minAmount?.toString() || "");
  const [maxAmount, setMaxAmount] = useState(initial?.maxAmount?.toString() || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initial?.id,
      name,
      chineseName,
      aliases,
      category,
      defaultAmount: defaultAmount ? parseFloat(defaultAmount) : null,
      commonAmounts,
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-500">名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-gray-500">中文名</label>
          <Input value={chineseName} onChange={(e) => setChineseName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm text-gray-500">缩写（逗号分隔）</label>
          <Input value={aliases} onChange={(e) => setAliases(e.target.value)} placeholder="油,O,Oil" />
        </div>
        <div>
          <label className="text-sm text-gray-500">分类</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="massage">按摩</option>
            <option value="facial">美容</option>
            <option value="card_tip">刷卡小费</option>
            <option value="cash_tip">现金小费</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-500">默认金额</label>
          <Input type="number" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-500">常用金额</label>
          <Input value={commonAmounts} onChange={(e) => setCommonAmounts(e.target.value)} placeholder="5,10,15" />
        </div>
        <div>
          <label className="text-sm text-gray-500">最低金额</label>
          <Input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-500">最高金额</label>
          <Input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" type="button" onClick={onCancel}>取消</Button>
        <Button type="submit">{initial ? "保存" : "创建"}</Button>
      </div>
    </form>
  );
}