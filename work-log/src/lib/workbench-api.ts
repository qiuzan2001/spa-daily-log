"use client";

import { apiGet, apiPost, apiPatch, apiDelete } from "./api";

// ── Types matching backend snake_case ──

export interface WorkbenchEmployee {
  id: number;
  spa_platform_id: number;
  name: string;
  active: boolean;
  hire_date: string;
  leave_date: string;
  sort_order: number;
}

export interface WorkbenchItem {
  service_id: string | null;
  type: string;
  label: string;
  shorthand: string;
  amount: number;
  duration_minutes: number;
  is_custom: boolean;
  metadata_json?: Record<string, unknown> | null;
}

export interface WorkbenchPayment {
  type: string;
  method: string;
  amount: number;
  recorded_at: string;
  card_time?: string | null;
  gift_card_number?: string | null;
  gift_card_image?: string | null;
  note?: string | null;
}

export interface WorkbenchEntryResponse {
  id: number;
  worksheet_id: number;
  row_number: number;
  start_time: string;
  duration_minutes: number;
  finish_early_five_minutes: boolean;
  calculated_end_time: string;
  original_log: string;
  service_total: number;
  payment_status: string;
  tip_resolved: boolean;
  status: string;
  items: WorkbenchItem[];
  payments: WorkbenchPayment[];
  created_at: string | null;
  updated_at: string | null;
}

export interface WorkbenchWorksheet {
  id: number;
  date: string;
  employee_id: number;
  spa_platform_employee_id: number | null;
  employee_name: string;
  status: string;
  entries: WorkbenchEntryResponse[];
}

// ── API functions ──

export async function fetchWorkbenchEmployees(): Promise<WorkbenchEmployee[]> {
  return apiGet<WorkbenchEmployee[]>("/api/workbench/employees");
}

export async function syncWorkbenchEmployees(): Promise<{ employees: WorkbenchEmployee[]; synced_count: number }> {
  return apiPost<{ employees: WorkbenchEmployee[]; synced_count: number }>("/api/workbench/employees/sync");
}

export async function getOrCreateWorksheet(date: string, spa_platform_employee_id: number): Promise<WorkbenchWorksheet> {
  return apiPost<WorkbenchWorksheet>("/api/workbench/worksheets/get-or-create", { date, spa_platform_employee_id });
}

export async function fetchWorkbenchEntries(date: string, spa_platform_employee_id: number): Promise<WorkbenchEntryResponse[]> {
  return apiGet<WorkbenchEntryResponse[]>("/api/workbench/entries", { date: date, spa_platform_employee_id: String(spa_platform_employee_id) });
}

export async function createWorkbenchEntry(body: any): Promise<WorkbenchEntryResponse> {
  return apiPost<WorkbenchEntryResponse>("/api/workbench/entries", body);
}

export async function updateWorkbenchEntry(entryId: number, body: any): Promise<WorkbenchEntryResponse> {
  return apiPatch<WorkbenchEntryResponse>(`/api/workbench/entries/${entryId}`, body);
}

export async function deleteWorkbenchEntry(entryId: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/api/workbench/entries/${entryId}`);
}

export async function syncWorkbench(date: string): Promise<any[]> {
  return apiPost<any[]>("/api/workbench/sync", { date });
}