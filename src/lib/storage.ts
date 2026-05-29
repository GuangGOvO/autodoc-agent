// 存储层 — Supabase 实现
// 所有函数均为异步，返回 Promise

import { getSupabaseBrowserClient } from './supabase';
import type { ChatMessage, DiagnosisSession } from '@/types/diagnosis';
import type { UsedCarEvaluation, UsedCarInput } from '@/types/usedCar';

// ==================== 类型定义 ====================

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

// ==================== 车辆管理 ====================

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(v => ({
    id: v.id,
    brand: v.brand,
    series: v.series,
    year: v.year || '',
    engine: v.engine || '',
    transmission: v.transmission || '',
    mileage: v.mileage || 0,
    licensePlate: v.license_plate || '',
    notes: v.notes || '',
    createdAt: v.created_at,
    updatedAt: v.updated_at,
  }));
}

export async function getVehicleById(id: string): Promise<Vehicle | undefined> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    brand: data.brand,
    series: data.series,
    year: data.year || '',
    engine: data.engine || '',
    transmission: data.transmission || '',
    mileage: data.mileage || 0,
    licensePlate: data.license_plate || '',
    notes: data.notes || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function saveVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Vehicle> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const vehicleData = {
    user_id: user.id,
    brand: vehicle.brand,
    series: vehicle.series,
    year: vehicle.year || null,
    engine: vehicle.engine || null,
    transmission: vehicle.transmission || null,
    mileage: vehicle.mileage || 0,
    license_plate: vehicle.licensePlate || null,
    notes: vehicle.notes || null,
  };

  if (vehicle.id) {
    // 更新
    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...vehicleData, updated_at: new Date().toISOString() })
      .eq('id', vehicle.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      brand: data.brand,
      series: data.series,
      year: data.year || '',
      engine: data.engine || '',
      transmission: data.transmission || '',
      mileage: data.mileage || 0,
      licensePlate: data.license_plate || '',
      notes: data.notes || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  // 新增
  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    brand: data.brand,
    series: data.series,
    year: data.year || '',
    engine: data.engine || '',
    transmission: data.transmission || '',
    mileage: data.mileage || 0,
    licensePlate: data.license_plate || '',
    notes: data.notes || '',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function deleteVehicle(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('vehicles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
}

// ==================== 诊断会话 ====================

export async function getDiagnosisSessions(): Promise<DiagnosisSession[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 获取所有会话
  const { data: sessions, error } = await supabase
    .from('diagnosis_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !sessions) return [];

  // 获取每个会话的消息
  const sessionIds = sessions.map(s => s.id);
  const { data: messages } = await supabase
    .from('diagnosis_messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  // 按 session_id 分组消息
  const messagesBySession = new Map<string, ChatMessage[]>();
  (messages || []).forEach(m => {
    if (!messagesBySession.has(m.session_id)) {
      messagesBySession.set(m.session_id, []);
    }
    messagesBySession.get(m.session_id)!.push({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      timestamp: m.created_at,
    });
  });

  return sessions.map(s => ({
    id: s.id,
    status: s.status as 'in_progress' | 'completed',
    initialSymptom: s.initial_symptom || '',
    messages: messagesBySession.get(s.id) || [],
    report: s.report || undefined,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  }));
}

export async function getDiagnosisSessionById(id: string): Promise<DiagnosisSession | undefined> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;

  const { data: session, error } = await supabase
    .from('diagnosis_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !session) return undefined;

  const { data: messages } = await supabase
    .from('diagnosis_messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return {
    id: session.id,
    status: session.status as 'in_progress' | 'completed',
    initialSymptom: session.initial_symptom || '',
    messages: (messages || []).map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      timestamp: m.created_at,
    })),
    report: session.report || undefined,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

export async function createDiagnosisSession(initialSymptom: string): Promise<DiagnosisSession> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('diagnosis_sessions')
    .insert({
      user_id: user.id,
      initial_symptom: initialSymptom,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    status: 'in_progress',
    initialSymptom: initialSymptom,
    messages: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateDiagnosisSession(
  id: string,
  updates: Partial<Pick<DiagnosisSession, 'status' | 'report'>>
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.status) updateData.status = updates.status;
  if (updates.report) updateData.report = updates.report;

  await supabase
    .from('diagnosis_sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);
}

export async function addMessageToSession(sessionId: string, message: ChatMessage): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  await supabase
    .from('diagnosis_messages')
    .insert({
      session_id: sessionId,
      role: message.role,
      content: message.content,
    });
}

// ==================== 二手车评估 ====================

export async function getUsedCarEvaluations(): Promise<UsedCarEvaluation[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('used_car_evaluations')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(e => ({
    id: e.id,
    input: e.input as UsedCarInput,
    reportMarkdown: e.report_markdown || '',
    createdAt: e.created_at,
  }));
}

export async function getUsedCarEvaluationById(id: string): Promise<UsedCarEvaluation | undefined> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;

  const { data, error } = await supabase
    .from('used_car_evaluations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    input: data.input as UsedCarInput,
    reportMarkdown: data.report_markdown || '',
    createdAt: data.created_at,
  };
}

export async function saveUsedCarEvaluation(evaluation: Omit<UsedCarEvaluation, 'id' | 'createdAt'>): Promise<UsedCarEvaluation> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  const { data, error } = await supabase
    .from('used_car_evaluations')
    .insert({
      user_id: user.id,
      input: evaluation.input,
      report_markdown: evaluation.reportMarkdown,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    input: data.input as UsedCarInput,
    reportMarkdown: data.report_markdown || '',
    createdAt: data.created_at,
  };
}

// ==================== 当前会话管理（仍用 localStorage，仅用于 UI 状态） ====================

const CURRENT_SESSION_KEY = 'autodoc_current_session';

export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

export function setCurrentSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_SESSION_KEY, id);
}

export function clearCurrentSessionId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

// ==================== 删除函数 ====================

export async function deleteDiagnosisSession(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 先删除消息（级联删除应该自动处理，但显式删除更安全）
  await supabase
    .from('diagnosis_messages')
    .delete()
    .eq('session_id', id);

  await supabase
    .from('diagnosis_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
}

export async function deleteUsedCarEvaluation(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('used_car_evaluations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
}

// ==================== 用户 Profile ====================

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('name, phone, email, avatar_url')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return {
    name: data.name || '',
    phone: data.phone || '',
    email: data.email || '',
    avatarUrl: data.avatar_url || '',
  };
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  await supabase
    .from('profiles')
    .update({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      avatar_url: profile.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);
}

// ==================== 统计 ====================

export async function getStats(): Promise<{
  totalSessions: number;
  completedSessions: number;
  totalVehicles: number;
  totalEvaluations: number;
}> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalSessions: 0, completedSessions: 0, totalVehicles: 0, totalEvaluations: 0 };

  const [sessions, completedSessions, vehicles, evaluations] = await Promise.all([
    supabase.from('diagnosis_sessions').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('diagnosis_sessions').select('id', { count: 'exact' }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('vehicles').select('id', { count: 'exact' }).eq('user_id', user.id),
    supabase.from('used_car_evaluations').select('id', { count: 'exact' }).eq('user_id', user.id),
  ]);

  return {
    totalSessions: sessions.count || 0,
    completedSessions: completedSessions.count || 0,
    totalVehicles: vehicles.count || 0,
    totalEvaluations: evaluations.count || 0,
  };
}
