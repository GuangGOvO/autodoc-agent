// 存储层 — 客户端封装（自托管：所有数据读写经 API 路由 → PostgreSQL）
// 导出函数签名与旧 Supabase 版本保持一致，页面无需改动

import { apiFetch } from './apiClient';
import type { ChatMessage, DiagnosisSession } from '@/types/diagnosis';
import type { UsedCarEvaluation, UsedCarInput } from '@/types/usedCar';

export interface Vehicle {
  id: string;
  brand: string;
  series: string;
  year: string;
  engine: string;
  transmission: string;
  mileage: number;
  licensePlate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, init);
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || '请求失败，请稍后重试');
  }
  return response.json() as Promise<T>;
}

// ==================== 车辆管理 ====================

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const { vehicles } = await request<{ vehicles: Vehicle[] }>('/api/vehicles');
    return vehicles;
  } catch (error) {
    console.warn('[storage] getVehicles error:', error);
    return [];
  }
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  try {
    const { vehicle } = await request<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
    return vehicle;
  } catch {
    return undefined;
  }
}

export async function saveVehicle(
  vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Vehicle> {
  if (vehicle.id) {
    const { vehicle: updated } = await request<{ vehicle: Vehicle }>(`/api/vehicles/${vehicle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vehicle),
    });
    return updated;
  }
  const { vehicle: created } = await request<{ vehicle: Vehicle }>('/api/vehicles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vehicle),
  });
  return created;
}

export async function deleteVehicle(id: string): Promise<void> {
  await request(`/api/vehicles/${id}`, { method: 'DELETE' });
}

// ==================== 诊断会话 ====================

export async function getDiagnosisSessions(): Promise<DiagnosisSession[]> {
  try {
    const { sessions } = await request<{ sessions: DiagnosisSession[] }>('/api/diagnose/sessions');
    return sessions;
  } catch (error) {
    console.warn('[storage] getDiagnosisSessions error:', error);
    return [];
  }
}

export async function getDiagnosisSessionById(id: string): Promise<DiagnosisSession | undefined> {
  try {
    const { session } = await request<{ session: DiagnosisSession }>(`/api/diagnose/sessions/${id}`);
    return session;
  } catch {
    return undefined;
  }
}

export async function createDiagnosisSession(initialSymptom: string): Promise<DiagnosisSession> {
  const { session } = await request<{ session: DiagnosisSession }>('/api/diagnose/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialSymptom }),
  });
  return session;
}

export async function updateDiagnosisSession(
  id: string,
  updates: Partial<Pick<DiagnosisSession, 'status' | 'report'>>
): Promise<void> {
  await request(`/api/diagnose/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
  await request(`/api/diagnose/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: message.role, content: message.content }),
  });
}

export async function deleteDiagnosisSession(id: string): Promise<void> {
  await request(`/api/diagnose/sessions/${id}`, { method: 'DELETE' });
}

// ==================== 二手车评估 ====================

export async function getUsedCarEvaluations(): Promise<UsedCarEvaluation[]> {
  try {
    const { evaluations } = await request<{ evaluations: UsedCarEvaluation[] }>('/api/used-car/evaluations');
    return evaluations;
  } catch (error) {
    console.warn('[storage] getUsedCarEvaluations error:', error);
    return [];
  }
}

export async function getUsedCarEvaluationById(id: string): Promise<UsedCarEvaluation | undefined> {
  try {
    const { evaluation } = await request<{ evaluation: UsedCarEvaluation }>(`/api/used-car/evaluations/${id}`);
    return evaluation;
  } catch {
    return undefined;
  }
}

export async function saveUsedCarEvaluation(
  evaluation: Omit<UsedCarEvaluation, 'id' | 'createdAt'>
): Promise<UsedCarEvaluation> {
  const { evaluation: saved } = await request<{ evaluation: UsedCarEvaluation }>('/api/used-car/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: evaluation.input as UsedCarInput,
      reportMarkdown: evaluation.reportMarkdown,
    }),
  });
  return saved;
}

export async function deleteUsedCarEvaluation(id: string): Promise<void> {
  await request(`/api/used-car/evaluations/${id}`, { method: 'DELETE' });
}

// ==================== 用户 Profile ====================

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { profile } = await request<{ profile: UserProfile }>('/api/profile');
    return profile;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  await request('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
}

// ==================== 统计 ====================

export async function getStats(): Promise<{
  totalSessions: number;
  completedSessions: number;
  totalVehicles: number;
  totalEvaluations: number;
}> {
  try {
    const { stats } = await request<{
      stats: {
        totalSessions: number;
        completedSessions: number;
        totalVehicles: number;
        totalEvaluations: number;
      };
    }>('/api/stats');
    return stats;
  } catch (error) {
    console.warn('[storage] getStats error:', error);
    return { totalSessions: 0, completedSessions: 0, totalVehicles: 0, totalEvaluations: 0 };
  }
}

// ==================== 当前会话管理（localStorage，仅用于 UI 状态） ====================

const CURRENT_SESSION_KEY = 'autodoc_current_session';

let currentSessionIdCache: string | null | undefined;

export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  if (currentSessionIdCache !== undefined) return currentSessionIdCache;
  try {
    currentSessionIdCache = localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    currentSessionIdCache = null;
  }
  return currentSessionIdCache;
}

export function setCurrentSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  currentSessionIdCache = id;
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, id);
  } catch {
    // 隐私模式/配额超限时静默失败
  }
}

export function clearCurrentSessionId(): void {
  if (typeof window === 'undefined') return;
  currentSessionIdCache = null;
  try {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch {
    // 忽略
  }
}
