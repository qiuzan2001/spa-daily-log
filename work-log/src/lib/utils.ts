import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getTodayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "草稿",
    pending_review: "待核对",
    submitted: "已提交",
    locked: "已锁定",
    deleted: "已删除",
    unreviewed: "未核对",
    has_errors: "有异常",
    reviewed: "已核对",
  };
  return labels[status] || status;
}