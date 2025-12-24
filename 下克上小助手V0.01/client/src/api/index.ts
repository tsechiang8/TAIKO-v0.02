/**
 * API客户端
 * Requirements: 13.1 - 支持联网访问
 */

/// <reference types="vite/client" />

import { AuthResult, User, FactionDashboardData, ApiResponse } from '../types';

// API基础URL - 生产环境使用相对路径，开发环境使用代理
const API_BASE_URL = '/api';

// 存储sessionId
let sessionId: string | null = null;

/**
 * 设置sessionId
 */
export function setSessionId(id: string | null): void {
  sessionId = id;
  if (id) {
    localStorage.setItem('sessionId', id);
  } else {
    localStorage.removeItem('sessionId');
  }
}

/**
 * 获取sessionId
 */
export function getSessionId(): string | null {
  if (!sessionId) {
    sessionId = localStorage.getItem('sessionId');
  }
  return sessionId;
}

/**
 * 通用请求函数 - 统一错误处理
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const currentSessionId = getSessionId();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (currentSessionId) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${currentSessionId}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    // 尝试解析JSON响应
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      // 如果无法解析JSON，创建一个错误响应
      return {
        success: false,
        error: `服务器响应错误 (${response.status})`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `请求失败 (${response.status})`,
      };
    }

    return data;
  } catch (error) {
    // 网络错误或其他异常
    const errorMessage = error instanceof Error ? error.message : '网络错误';
    console.error('API请求失败:', errorMessage);
    return {
      success: false,
      error: errorMessage.includes('fetch') ? '网络连接失败，请检查网络' : errorMessage,
    };
  }
}

/**
 * 登录
 */
export async function login(code: string): Promise<AuthResult> {
  const response = await request<AuthResult & { sessionId?: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

  if (response.success && response.data?.sessionId) {
    setSessionId(response.data.sessionId);
  }

  return {
    success: response.success,
    userType: response.data?.userType || 'player',
    factionId: response.data?.factionId,
    sessionId: response.data?.sessionId,
    error: response.error,
  };
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
  setSessionId(null);
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
  return request<{ user: User }>('/auth/me');
}

/**
 * 获取当前玩家的势力数据
 */
export async function getMyFaction(): Promise<ApiResponse<FactionDashboardData>> {
  const response = await request<FactionDashboardData>('/factions/me');
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
    };
  }
  return {
    success: false,
    error: response.error,
  };
}

/**
 * 获取指定势力数据
 */
export async function getFaction(factionId: string): Promise<ApiResponse<FactionDashboardData>> {
  const response = await request<FactionDashboardData>(`/factions/${factionId}`);
  if (response.success && response.data) {
    return {
      success: true,
      data: response.data,
    };
  }
  return {
    success: false,
    error: response.error,
  };
}

/**
 * 获取所有势力列表（管理员）
 */
export async function getAllFactions(): Promise<ApiResponse<{ id: string; name: string; lordName: string; code: string }[]>> {
  const response = await request<{ factions: { id: string; name: string; lordName: string; code: string }[] }>('/factions');
  if (response.success && response.data?.factions) {
    return {
      success: true,
      data: response.data.factions,
    };
  }
  return {
    success: false,
    error: response.error,
  };
}

/**
 * 招募信息
 */
export interface RecruitInfo {
  currentIdleSoldiers: number;
  maxRecruitableSoldiers: number;
  availableToRecruit: number;
}

/**
 * 获取招募信息
 */
export async function getRecruitInfo(factionId?: string): Promise<ApiResponse<RecruitInfo>> {
  const endpoint = factionId ? `/recruitment/info?factionId=${factionId}` : '/recruitment/info';
  return request<RecruitInfo>(endpoint);
}

/**
 * 招募士兵
 */
export async function recruitSoldiers(count: number, factionId?: string): Promise<ApiResponse<{ newIdleSoldiers: number; newMaxRecruitableSoldiers: number }>> {
  return request<{ newIdleSoldiers: number; newMaxRecruitableSoldiers: number }>('/recruitment/recruit', {
    method: 'POST',
    body: JSON.stringify({ count, factionId }),
  });
}


// ============ 军团管理 API ============

import { Legion, Samurai, Territory } from '../types';

/**
 * 获取势力的所有军团
 */
export async function getFactionLegions(factionId?: string): Promise<ApiResponse<Legion[]>> {
  const endpoint = factionId ? `/legions?factionId=${factionId}` : '/legions';
  return request<Legion[]>(endpoint);
}

/**
 * 获取可用将领列表
 */
export async function getAvailableCommanders(factionId?: string): Promise<ApiResponse<Samurai[]>> {
  const endpoint = factionId ? `/legions/commanders?factionId=${factionId}` : '/legions/commanders';
  return request<Samurai[]>(endpoint);
}

/**
 * 获取可用位置列表（势力拥有的领地）
 */
export async function getAvailableTerritories(factionId?: string): Promise<ApiResponse<Territory[]>> {
  const endpoint = factionId ? `/legions/territories?factionId=${factionId}` : '/legions/territories';
  return request<Territory[]>(endpoint);
}

/**
 * 检查将领冲突
 */
export async function checkCommanderConflict(
  commanderId: string,
  excludeLegionId?: string
): Promise<ApiResponse<{ hasConflict: boolean; conflictLegion?: Legion }>> {
  return request<{ hasConflict: boolean; conflictLegion?: Legion }>('/legions/check-commander', {
    method: 'POST',
    body: JSON.stringify({ commanderId, excludeLegionId }),
  });
}

/**
 * 创建军团请求数据
 */
export interface CreateLegionRequest {
  name: string;
  commanderId: string;
  soldierCount: number;
  rifles: number;
  horses: number;
  cannons: number;
  locationId: string;
  factionId?: string;
  forceReassign?: boolean;
}

/**
 * 创建军团
 */
export async function createLegion(data: CreateLegionRequest): Promise<ApiResponse<Legion>> {
  return request<Legion>('/legions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 解散军团
 */
export async function disbandLegion(legionId: string, factionId?: string): Promise<ApiResponse<{ returnedResources: { soldiers: number; rifles: number; horses: number; cannons: number } }>> {
  return request<{ returnedResources: { soldiers: number; rifles: number; horses: number; cannons: number } }>(`/legions/${legionId}`, {
    method: 'DELETE',
    body: JSON.stringify({ factionId }),
  });
}

/**
 * 编辑军团人数
 */
export async function updateLegionSoldiers(
  legionId: string,
  count: number,
  factionId?: string
): Promise<ApiResponse<{ newSoldierCount: number; newIdleSoldiers: number }>> {
  return request<{ newSoldierCount: number; newIdleSoldiers: number }>(`/legions/${legionId}/soldiers`, {
    method: 'PATCH',
    body: JSON.stringify({ count, factionId }),
  });
}

/**
 * 编辑军团装备
 */
export async function updateLegionEquipment(
  legionId: string,
  equipment: { rifles?: number; horses?: number; cannons?: number },
  factionId?: string
): Promise<ApiResponse<{ newEquipment: { rifles: number; horses: number; cannons: number }; newInventory: { rifles: number; horses: number; cannons: number } }>> {
  return request<{ newEquipment: { rifles: number; horses: number; cannons: number }; newInventory: { rifles: number; horses: number; cannons: number } }>(`/legions/${legionId}/equipment`, {
    method: 'PATCH',
    body: JSON.stringify({ ...equipment, factionId }),
  });
}


// ============ 投资系统 API ============

/**
 * 投资类型
 */
export type InvestmentType = 'agriculture' | 'commerce' | 'navy' | 'armament';

/**
 * 投资状态
 */
export interface InvestmentStatus {
  treasury: number;
  agriculturePoints: number;
  agricultureLevel: string;
  commercePoints: number;
  commerceLevel: string;
  navyPoints: number;
  navyLevel: string;
  armamentPoints: number;
  armamentLevel: string;
}

/**
 * 投资预览
 */
export interface InvestmentPreview {
  successRate: number;
  modifierCoefficient: number;
  expectedPointsOnSuccess: number;
  expectedPointsOnCritical: number;
  expectedPointsOnFailure: number;
  cost: number;
  samuraiAttribute: number;
  attributeName: string;
  canExecute: boolean;
  error?: string;
}

/**
 * 投资结果
 */
export interface InvestmentResult {
  success: boolean;
  outcome: 'critical_success' | 'success' | 'failure';
  pointsGained: number;
  newPoints: number;
  newLevel: string;
  message: string;
  roll: number;
  successRate: number;
  error?: string;
}

/**
 * 获取投资状态
 */
export async function getInvestmentStatus(factionId?: string): Promise<ApiResponse<InvestmentStatus>> {
  const endpoint = factionId ? `/investment/status?factionId=${factionId}` : '/investment/status';
  return request<InvestmentStatus>(endpoint);
}

/**
 * 获取可执行投资的武士列表
 */
export async function getAvailableSamuraisForInvestment(factionId?: string): Promise<ApiResponse<Samurai[]>> {
  const endpoint = factionId ? `/investment/samurais?factionId=${factionId}` : '/investment/samurais';
  return request<Samurai[]>(endpoint);
}

/**
 * 获取投资预览
 */
export async function getInvestmentPreview(
  type: InvestmentType,
  samuraiId: string,
  amount?: number,
  factionId?: string
): Promise<ApiResponse<InvestmentPreview>> {
  return request<InvestmentPreview>('/investment/preview', {
    method: 'POST',
    body: JSON.stringify({ type, samuraiId, amount, factionId }),
  });
}

/**
 * 执行投资
 */
export async function executeInvestment(
  type: InvestmentType,
  samuraiId: string,
  amount?: number,
  factionId?: string
): Promise<ApiResponse<InvestmentResult>> {
  return request<InvestmentResult>('/investment/execute', {
    method: 'POST',
    body: JSON.stringify({ type, samuraiId, amount, factionId }),
  });
}


// ============ 管理员数据管理 API (Requirements: 8.1-8.5) ============

// 郡国数据类型
export interface TerritorySearchParams {
  provinceName?: string;
  districtName?: string;
  factionId?: string;
  hasSpecialProduct?: boolean;
  minKokudaka?: number;
  maxKokudaka?: number;
}

// 势力代码信息
export interface FactionCodeInfo {
  id: string;
  name: string;
  lordName: string;
  code: string;
}

// 势力完整信息
export interface FactionFullInfo {
  id: string;
  name: string;
  lordName: string;
  code: string;
  taxRate: number;
  treasury: number;
  idleSoldiers: number;
  rifles: number;
  horses: number;
  cannons: number;
  agriculturePoints: number;
  commercePoints: number;
  navyPoints: number;
  armamentPoints: number;
  industryKokudaka: number;
  samuraiCount: number;
  surfaceKokudaka: number;
  totalSoldiers: number;
  buffs: { name: string; effect: string }[];
}

// 军团一览数据
export interface LegionOverviewItem {
  id: string;
  name: string;
  factionId: string;
  factionName: string;
  commanderId: string;
  commanderName: string;
  soldierCount: number;
  rifles: number;
  horses: number;
  cannons: number;
  locationId: string;
  locationName: string;
}

// 特产数据
export interface SpecialProduct {
  name: string;
  annualKokudaka: number;
  annualHorses: number;
  soldierCapacityBonus: number;
  kokudakaBonus: number;
  otherEffects: string;
}

// ============ 郡国管理 API ============

/**
 * 获取所有郡国数据
 */
export async function getAdminTerritories(params?: TerritorySearchParams): Promise<ApiResponse<Territory[]>> {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.provinceName) queryParams.set('provinceName', params.provinceName);
    if (params.districtName) queryParams.set('districtName', params.districtName);
    if (params.factionId !== undefined) queryParams.set('factionId', params.factionId);
    if (params.hasSpecialProduct !== undefined) queryParams.set('hasSpecialProduct', String(params.hasSpecialProduct));
    if (params.minKokudaka !== undefined) queryParams.set('minKokudaka', String(params.minKokudaka));
    if (params.maxKokudaka !== undefined) queryParams.set('maxKokudaka', String(params.maxKokudaka));
  }
  const query = queryParams.toString();
  const endpoint = `/admin/territories${query ? `?${query}` : ''}`;
  return request<Territory[]>(endpoint);
}

/**
 * 创建郡国
 */
export async function createTerritory(data: Omit<Territory, 'id'>): Promise<ApiResponse<Territory>> {
  return request<Territory>('/admin/territories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新郡国
 */
export async function updateTerritory(id: string, data: Partial<Territory>): Promise<ApiResponse<Territory>> {
  return request<Territory>(`/admin/territories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除郡国
 */
export async function deleteTerritory(id: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/territories/${id}`, {
    method: 'DELETE',
  });
}

// ============ 势力代码管理 API ============

/**
 * 获取所有势力代码信息
 */
export async function getAdminFactions(): Promise<ApiResponse<FactionCodeInfo[]>> {
  return request<FactionCodeInfo[]>('/admin/factions');
}

/**
 * 获取所有势力完整信息
 */
export async function getAdminFactionsFull(): Promise<ApiResponse<FactionFullInfo[]>> {
  return request<FactionFullInfo[]>('/admin/factions/full');
}

/**
 * 创建势力
 */
export async function createFaction(data: {
  name: string;
  lordName: string;
  code: string;
  taxRate?: number;
}): Promise<ApiResponse<FactionCodeInfo>> {
  return request<FactionCodeInfo>('/admin/factions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新势力信息
 */
export async function updateFaction(factionId: string, data: {
  name?: string;
  lordName?: string;
  taxRate?: number;
  treasury?: number;
  idleSoldiers?: number;
  rifles?: number;
  horses?: number;
  cannons?: number;
  agriculturePoints?: number;
  commercePoints?: number;
  navyPoints?: number;
  armamentPoints?: number;
  industryKokudaka?: number;
}): Promise<ApiResponse<FactionCodeInfo>> {
  return request<FactionCodeInfo>(`/admin/factions/${factionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 更新势力代码
 */
export async function updateFactionCode(factionId: string, code: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/factions/${factionId}/code`, {
    method: 'PUT',
    body: JSON.stringify({ code }),
  });
}

/**
 * 删除势力
 */
export async function deleteFaction(factionId: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/factions/${factionId}`, {
    method: 'DELETE',
  });
}

// ============ 全军团一览 API ============

/**
 * 获取所有军团一览
 */
export async function getAdminLegions(): Promise<ApiResponse<LegionOverviewItem[]>> {
  return request<LegionOverviewItem[]>('/admin/legions');
}

/**
 * 管理员编辑军团
 */
export async function adminUpdateLegion(legionId: string, data: {
  name?: string;
  commanderId?: string;
  soldierCount?: number;
  rifles?: number;
  horses?: number;
  cannons?: number;
  locationId?: string;
}): Promise<ApiResponse<Legion>> {
  return request<Legion>(`/admin/legions/${legionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 管理员删除军团
 */
export async function adminDeleteLegion(legionId: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/legions/${legionId}`, {
    method: 'DELETE',
  });
}

// ============ 特产管理 API ============

/**
 * 获取所有特产
 */
export async function getAdminSpecialProducts(): Promise<ApiResponse<SpecialProduct[]>> {
  return request<SpecialProduct[]>('/admin/special-products');
}

/**
 * 创建特产
 */
export async function createSpecialProduct(data: SpecialProduct): Promise<ApiResponse<SpecialProduct>> {
  return request<SpecialProduct>('/admin/special-products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新特产
 */
export async function updateSpecialProduct(name: string, data: Partial<SpecialProduct>): Promise<ApiResponse<SpecialProduct>> {
  return request<SpecialProduct>(`/admin/special-products/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除特产
 */
export async function deleteSpecialProduct(name: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/special-products/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

// ============ 辅助 API ============

/**
 * 获取势力选项列表
 */
export async function getFactionOptions(): Promise<ApiResponse<{ id: string; name: string }[]>> {
  return request<{ id: string; name: string }[]>('/admin/options/factions');
}

/**
 * 获取领地选项列表
 */
export async function getTerritoryOptions(): Promise<ApiResponse<{ id: string; name: string; provinceName: string }[]>> {
  return request<{ id: string; name: string; provinceName: string }[]>('/admin/options/territories');
}


// ============ 游戏进程控制 API (Requirements: 9.1-9.7) ============

// 游戏状态
export interface GameStatus {
  currentYear: number;
  isLocked: boolean;
}

// 游戏状态摘要
export interface GameStatusSummary {
  currentYear: number;
  isLocked: boolean;
  factionCount: number;
  totalTerritories: number;
  totalLegions: number;
  recentOperationsCount: number;
}

// 势力结算结果
export interface FactionSettlement {
  factionId: string;
  factionName: string;
  maintenanceCost: number;
  previousTreasury: number;
  newTreasury: number;
  kokudakaGrowth: { territoryId: string; territoryName: string; growth: number }[];
  totalKokudakaGrowth: number;
  samuraisReset: number;
}

// 年度结算结果
export interface YearEndSettlement {
  year: number;
  previousYear: number;
  factionSettlements: FactionSettlement[];
  snapshotId: string;
}

// 记账日志
export interface AccountingLog {
  id: string;
  year: number;
  factionId: string;
  factionName: string;
  content: string;
  shouldCalculate: boolean;
  timestamp: string;
}

// 操作记录
export interface OperationRecord {
  id: string;
  timestamp: string;
  userId: string;
  userType: 'admin' | 'player';
  factionId?: string;
  action: string;
  details: Record<string, unknown>;
  snapshotId?: string;
  hasSnapshot?: boolean;
}

/**
 * 获取游戏状态
 */
export async function getGameStatus(): Promise<ApiResponse<GameStatus>> {
  return request<GameStatus>('/game/status');
}

/**
 * 获取游戏状态摘要（管理员）
 */
export async function getGameStatusSummary(): Promise<ApiResponse<GameStatusSummary>> {
  return request<GameStatusSummary>('/game/status/summary');
}

/**
 * 检查玩家操作是否被允许
 */
export async function checkPlayerOperation(): Promise<ApiResponse<{ allowed: boolean; error?: string }>> {
  return request<{ allowed: boolean; error?: string }>('/game/check-operation');
}

/**
 * 执行下一年结算（管理员）
 */
export async function advanceYear(): Promise<ApiResponse<YearEndSettlement>> {
  return request<YearEndSettlement>('/game/advance-year', {
    method: 'POST',
  });
}

/**
 * 锁定游戏（管理员）
 */
export async function lockGame(): Promise<ApiResponse<void>> {
  return request<void>('/game/lock', {
    method: 'POST',
  });
}

/**
 * 解锁游戏（管理员）
 */
export async function unlockGame(): Promise<ApiResponse<void>> {
  return request<void>('/game/unlock', {
    method: 'POST',
  });
}

/**
 * 获取记账日志（管理员）
 */
export async function getAccountingLogs(params?: {
  year?: number;
  factionId?: string;
  shouldCalculate?: boolean;
}): Promise<ApiResponse<AccountingLog[]>> {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.year !== undefined) queryParams.set('year', String(params.year));
    if (params.factionId) queryParams.set('factionId', params.factionId);
    if (params.shouldCalculate !== undefined) queryParams.set('shouldCalculate', String(params.shouldCalculate));
  }
  const query = queryParams.toString();
  const endpoint = `/game/accounting-logs${query ? `?${query}` : ''}`;
  return request<AccountingLog[]>(endpoint);
}

/**
 * 添加记账日志（管理员）
 */
export async function addAccountingLog(data: {
  year: number;
  factionId: string;
  content: string;
  shouldCalculate: boolean;
}): Promise<ApiResponse<AccountingLog>> {
  return request<AccountingLog>('/game/accounting-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 删除记账日志（管理员）
 */
export async function deleteAccountingLog(logId: string): Promise<ApiResponse<void>> {
  return request<void>(`/game/accounting-logs/${logId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取操作记录（管理员）
 */
export async function getOperationRecords(limit?: number): Promise<ApiResponse<OperationRecord[]>> {
  const endpoint = limit ? `/game/operations?limit=${limit}` : '/game/operations';
  return request<OperationRecord[]>(endpoint);
}

/**
 * 获取可回溯的操作记录（管理员）
 */
export async function getRollbackableOperations(limit?: number): Promise<ApiResponse<OperationRecord[]>> {
  const endpoint = limit ? `/game/operations/rollbackable?limit=${limit}` : '/game/operations/rollbackable';
  return request<OperationRecord[]>(endpoint);
}

/**
 * 回溯到指定操作（管理员）
 */
export async function rollbackToOperation(operationId: string): Promise<ApiResponse<void>> {
  return request<void>(`/game/rollback/${operationId}`, {
    method: 'POST',
  });
}


// ============ 数据导入 API (Requirements: 10.1-10.4) ============

// 导入类型
export type ImportType = 'territory' | 'legion' | 'faction' | 'specialProduct';

// 导入模板信息
export interface ImportTemplateInfo {
  type: ImportType;
  template: string;
  description: string;
}

// 导入预览结果
export interface ImportPreviewResult {
  type: ImportType;
  rowCount: number;
  preview: unknown[];
  errors: string[];
  warnings: string[];
}

// 导入结果
export interface ImportResultData {
  imported: number;
  errors: string[];
  warnings: string[];
}

/**
 * 获取导入模板
 */
export async function getImportTemplate(type: ImportType): Promise<ApiResponse<ImportTemplateInfo>> {
  return request<ImportTemplateInfo>(`/import/template/${type}`);
}

/**
 * 预览导入数据
 */
export async function previewImport(type: ImportType, text: string): Promise<ApiResponse<ImportPreviewResult>> {
  return request<ImportPreviewResult>(`/import/preview/${type}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * 执行数据导入
 */
export async function executeImport(
  type: ImportType,
  text: string,
  overwrite: boolean = true
): Promise<ApiResponse<ImportResultData>> {
  return request<ImportResultData>(`/import/${type}`, {
    method: 'POST',
    body: JSON.stringify({ text, overwrite }),
  });
}


// ============ 错误报告 API (Requirements: 14.1-14.9) ============

// 错误报告类型
export interface ErrorReportData {
  id: string;
  playerId: string;
  playerName: string;
  factionId: string;
  timestamp: string;
  errorType: 'manual' | 'automatic';
  errorMessage?: string;
  recentOperations: OperationRecord[];
  resolved: boolean;
}

/**
 * 提交手动错误报告
 * Requirements: 14.1, 14.2, 14.3
 */
export async function submitManualErrorReport(
  errorMessage?: string
): Promise<ApiResponse<ErrorReportData>> {
  return request<ErrorReportData>('/error-reports/manual', {
    method: 'POST',
    body: JSON.stringify({ errorMessage }),
  });
}

/**
 * 提交自动错误报告
 * Requirements: 14.4, 14.5
 */
export async function submitAutomaticErrorReport(
  errorMessage: string
): Promise<ApiResponse<ErrorReportData>> {
  return request<ErrorReportData>('/error-reports/automatic', {
    method: 'POST',
    body: JSON.stringify({ errorMessage }),
  });
}

/**
 * 获取错误报告列表（管理员）
 * Requirements: 14.6, 14.8
 */
export async function getErrorReports(filter?: {
  factionId?: string;
  startTime?: string;
  endTime?: string;
  resolved?: boolean;
}): Promise<ApiResponse<ErrorReportData[]>> {
  const queryParams = new URLSearchParams();
  if (filter) {
    if (filter.factionId) queryParams.set('factionId', filter.factionId);
    if (filter.startTime) queryParams.set('startTime', filter.startTime);
    if (filter.endTime) queryParams.set('endTime', filter.endTime);
    if (filter.resolved !== undefined) queryParams.set('resolved', String(filter.resolved));
  }
  const query = queryParams.toString();
  const endpoint = `/error-reports${query ? `?${query}` : ''}`;
  return request<ErrorReportData[]>(endpoint);
}

/**
 * 获取单个错误报告详情（管理员）
 */
export async function getErrorReportById(
  reportId: string
): Promise<ApiResponse<ErrorReportData>> {
  return request<ErrorReportData>(`/error-reports/${reportId}`);
}

/**
 * 标记错误报告为已处理（管理员）
 * Requirements: 14.9
 */
export async function markErrorReportResolved(
  reportId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/error-reports/${reportId}/resolve`, {
    method: 'PUT',
  });
}

/**
 * 删除错误报告（管理员）
 */
export async function deleteErrorReport(
  reportId: string
): Promise<ApiResponse<void>> {
  return request<void>(`/error-reports/${reportId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取当前玩家最近操作记录
 */
export async function getRecentOperations(): Promise<ApiResponse<OperationRecord[]>> {
  return request<OperationRecord[]>('/error-reports/player/recent-operations');
}


// ============ 解散士兵 API ============

/**
 * 解散士兵信息
 */
export interface DisbandInfo {
  idleSoldiers: number;
  maxDisbandable: number;
  treasury: number;
  costPerSoldier: number;
}

/**
 * 获取解散士兵信息
 */
export async function getDisbandInfo(factionId?: string): Promise<ApiResponse<DisbandInfo>> {
  const endpoint = factionId ? `/disband-soldiers/info?factionId=${factionId}` : '/disband-soldiers/info';
  return request<DisbandInfo>(endpoint);
}

/**
 * 解散士兵
 */
export async function disbandSoldiers(
  count: number,
  factionId?: string
): Promise<ApiResponse<{ newIdleSoldiers: number; newTreasury: number; totalCost: number }>> {
  return request<{ newIdleSoldiers: number; newTreasury: number; totalCost: number }>('/disband-soldiers', {
    method: 'POST',
    body: JSON.stringify({ count, factionId }),
  });
}

// ============ 武士管理 API ============

/**
 * 获取势力的所有武士
 */
export async function getFactionSamurais(factionId: string): Promise<ApiResponse<Samurai[]>> {
  return request<Samurai[]>(`/admin/factions/${factionId}/samurais`);
}

/**
 * 创建武士
 */
export async function createSamurai(data: {
  name: string;
  age?: number;
  type: 'warrior' | 'strategist';
  martialValue: number;
  civilValue: number;
  factionId: string;
}): Promise<ApiResponse<Samurai>> {
  return request<Samurai>('/admin/samurais', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新武士
 */
export async function updateSamurai(samuraiId: string, data: {
  name?: string;
  age?: number;
  type?: 'warrior' | 'strategist';
  martialValue?: number;
  civilValue?: number;
  factionId?: string;
}): Promise<ApiResponse<Samurai>> {
  return request<Samurai>(`/admin/samurais/${samuraiId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除武士
 */
export async function deleteSamurai(samuraiId: string): Promise<ApiResponse<void>> {
  return request<void>(`/admin/samurais/${samuraiId}`, {
    method: 'DELETE',
  });
}


// ============ 装备购买 API ============

/**
 * 装备价格
 */
export const EQUIPMENT_PRICES = {
  rifles: 10,    // 铁炮 10石/挺
  horses: 12,    // 战马 12石/匹
  cannons: 450,  // 大筒 450石/门
};

/**
 * 购买装备信息
 */
export interface PurchaseInfo {
  treasury: number;
  currentEquipment: {
    rifles: number;
    horses: number;
    cannons: number;
  };
  prices: typeof EQUIPMENT_PRICES;
}

/**
 * 获取购买装备信息
 */
export async function getPurchaseInfo(factionId?: string): Promise<ApiResponse<PurchaseInfo>> {
  const endpoint = factionId ? `/equipment/info?factionId=${factionId}` : '/equipment/info';
  return request<PurchaseInfo>(endpoint);
}

/**
 * 购买装备
 */
export async function purchaseEquipment(
  rifles: number,
  horses: number,
  cannons: number,
  factionId?: string
): Promise<ApiResponse<{
  totalCost: number;
  newTreasury: number;
  newEquipment: { rifles: number; horses: number; cannons: number };
}>> {
  return request<{
    totalCost: number;
    newTreasury: number;
    newEquipment: { rifles: number; horses: number; cannons: number };
  }>('/equipment/purchase', {
    method: 'POST',
    body: JSON.stringify({ rifles, horses, cannons, factionId }),
  });
}


// ============ 税率更改 API ============

/**
 * 税率信息
 */
export interface TaxRateInfo {
  currentTaxRate: number;
  canChange: boolean;
  availableRates: number[];
}

/**
 * 获取税率信息
 */
export async function getTaxRateInfo(factionId?: string): Promise<ApiResponse<TaxRateInfo>> {
  const endpoint = factionId ? `/tax-rate/info?factionId=${factionId}` : '/tax-rate/info';
  return request<TaxRateInfo>(endpoint);
}

/**
 * 更改税率
 */
export async function changeTaxRate(
  taxRate: number,
  factionId?: string
): Promise<ApiResponse<{ newTaxRate: number }>> {
  return request<{ newTaxRate: number }>('/tax-rate/change', {
    method: 'POST',
    body: JSON.stringify({ taxRate, factionId }),
  });
}
