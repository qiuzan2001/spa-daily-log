"use client";

import { useRouter } from "next/navigation";

const pages = [
  {
    title: "工作台",
    desc: "记录每日服务项目、收款",
    path: "/workbench",
    icon: "📋",
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    title: "前台看板",
    desc: "查看员工工作表状态",
    path: "/frontdesk",
    icon: "🖥️",
    color: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    title: "按摩师填表",
    desc: "手写板录入每日服务",
    path: "/therapist",
    icon: "✍️",
    color: "bg-amber-50 border-amber-200 hover:bg-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    title: "当日记录",
    desc: "查看今日所有服务记录",
    path: "/today",
    icon: "📊",
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
    iconBg: "bg-purple-100",
  },
  {
    title: "老板后台",
    desc: "统计、搜索、导出",
    path: "/owner",
    icon: "👑",
    color: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    iconBg: "bg-rose-100",
  },
  {
    title: "打印管理",
    desc: "生成并打印每日报表",
    path: "/print",
    icon: "🖨️",
    color: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    iconBg: "bg-sky-100",
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center pt-8">
          <h1 className="text-2xl font-bold text-zinc-800">Lake Spa</h1>
          <p className="text-sm text-zinc-500 mt-1">工作日志系统</p>
        </div>

        <div className="grid gap-3">
          {pages.map((p) => (
            <button
              key={p.path}
              onClick={() => router.push(p.path)}
              className={`flex items-center gap-4 w-full rounded-xl border p-4 text-left transition-all ${p.color}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-xl ${p.iconBg}`}>
                {p.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-zinc-800">{p.title}</div>
                <div className="text-sm text-zinc-500">{p.desc}</div>
              </div>
              <div className="text-zinc-300 text-lg">›</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}