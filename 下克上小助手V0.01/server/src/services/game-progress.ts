/**
 * 游戏进程控制服务
 * Requirements: 9.1-9.7
 */

import { v4 as uuidv4 } from 'uuid';
import {
  FactionData,
  Territory,
  Samurai,
  Legion,
  GameState,
  OperationRecord,
} from '../types';
import {
  getFactions,
  saveFactions,
  getTerritories,
  saveTerritories,
  getSamurais,
  saveSamurais,
  getLegions,
  getSpecialProducts,
  getGameState,
  saveGameState,
  createSnapshot,
  restoreFromSnapshot,
  getOperationRecords,
  addOperationRecord,
  listSnapshots,
} from '../storage';
import {
  calculateFactionData,
  getGrowthRate,
  calculateTerritoryKokudaka,
  calculateMaxRecruitableSoldiers,
  calculateSoldierMaintenanceRatio,
  calculateTotalSoldiers,
} from '../calculation';

// ============ 记账推演日志类型 ============

export interface AccountingLog {
  id: string;
  year: number;
  factionId: string;
  factionName: string;
  content: string;
  shouldCalculate: boolean;
  timestamp: string;
}

// ============ 年度结算结果 ============

export interface YearEndSettlement {
  year: number;
  previousYear: number;
  factionSettlements: FactionSettlement[];
  snapshotId: string;
}

export interface FactionSettlement {
  factionId: string;
  factionName: string;
  income: number;
  maintenanceCost: number;
  previousTreasury: number;
  newTreasury: number;
  kokudakaGrowth: { territoryId: string; territoryName: string; growth: number }[];
  totalKokudakaGrowth: number;
  samuraisReset: number;
}

// ============ 下一年结算服务 (Requirements: 9.1, 9.2) ============

/**
 * 执行下一年结算
 * - 扣除维护费
 * - 更新基础石高（自然增长）
 * - 重置武士行动力
 * - 创建数据快照
 */
export function advanceYear(): { success: boolean; settlement?: YearEndSettlement; error?: string } {
  const gameState = getGameState();
  
  // 检查是否锁定
  if (gameState.isLocked) {
    return { success: false, error: '游戏已锁定，请先解锁' };
  }

  const factions = getFactions();
  const territories = getTerritories();
  const samurais = getSamurais();
  const legions = getLegions();
  const specialProducts = getSpecialProducts();

  const factionSettlements: FactionSettlement[] = [];

  // 为每个势力执行结算
  for (const faction of factions) {
    const factionTerritories = territories.filter(t => t.factionId === faction.id);
    const factionLegions = legions.filter(l => l.factionId === faction.id);
    const factionSamurais = samurais.filter(s => s.factionId === faction.id);

    // 计算势力数据
    const calcResult = calculateFactionData(
      faction,
      factionTerritories,
      territories,
      factionLegions,
      factionSamurais,
      specialProducts
    );

    // 1. 计算收入和维护费，更新金库
    // 年度收入 = 表面石高 × 税率 × 0.4
    // 年度净收入 = 年度收入 - 维护费
    // 新金库 = 旧金库 + 年度净收入（可以为负）
    const previousTreasury = faction.treasury;
    const income = calcResult.income;  // 表面石高 × 税率 × 0.4
    const maintenanceCost = calcResult.maintenanceCost.total;
    const netIncome = income - maintenanceCost;  // 年度净收入
    faction.treasury = previousTreasury + netIncome;  // 金库可以为负

    // 2. 计算自然增长率并更新领地石高
    const growthRate = calcResult.growthRate;
    const kokudakaGrowth: { territoryId: string; territoryName: string; growth: number }[] = [];
    let totalKokudakaGrowth = 0;

    for (const territory of factionTerritories) {
      const growth = Math.floor(territory.baseKokudaka * growthRate);
      if (growth !== 0) {
        territory.baseKokudaka = Math.max(0, territory.baseKokudaka + growth);
        kokudakaGrowth.push({
          territoryId: territory.id,
          territoryName: territory.districtName,
          growth,
        });
        totalKokudakaGrowth += growth;
      }
    }

    // 3. 重置武士行动力
    let samuraisReset = 0;
    for (const samurai of factionSamurais) {
      if (samurai.actionPoints !== 2) {
        samurai.actionPoints = 2;
        samuraisReset++;
      }
    }

    factionSettlements.push({
      factionId: faction.id,
      factionName: faction.name,
      income,
      maintenanceCost,
      previousTreasury,
      newTreasury: faction.treasury,
      kokudakaGrowth,
      totalKokudakaGrowth,
      samuraisReset,
    });
  }

  // 保存更新后的数据
  saveFactions(factions);
  saveTerritories(territories);
  saveSamurais(samurais);

  // 更新游戏年份
  const previousYear = gameState.currentYear;
  gameState.currentYear += 1;
  saveGameState(gameState);

  // 创建操作记录
  const operationRecord = addOperationRecord({
    userId: 'admin',
    userType: 'admin',
    action: 'advance_year',
    details: {
      previousYear,
      newYear: gameState.currentYear,
      factionCount: factionSettlements.length,
    },
  });

  // 创建数据快照
  const snapshot = createSnapshot(operationRecord.id);

  return {
    success: true,
    settlement: {
      year: gameState.currentYear,
      previousYear,
      factionSettlements,
      snapshotId: snapshot.id,
    },
  };
}

// ============ 锁定/解锁功能 (Requirements: 9.3, 9.4) ============

/**
 * 获取游戏锁定状态
 */
export function isGameLocked(): boolean {
  return getGameState().isLocked;
}

/**
 * 获取当前游戏年份
 */
export function getCurrentYear(): number {
  return getGameState().currentYear;
}

/**
 * 锁定游戏
 */
export function lockGame(): { success: boolean; error?: string } {
  const gameState = getGameState();
  
  if (gameState.isLocked) {
    return { success: false, error: '游戏已经处于锁定状态' };
  }

  gameState.isLocked = true;
  saveGameState(gameState);

  // 记录操作
  addOperationRecord({
    userId: 'admin',
    userType: 'admin',
    action: 'lock_game',
    details: { year: gameState.currentYear },
  });

  return { success: true };
}

/**
 * 解锁游戏
 */
export function unlockGame(): { success: boolean; error?: string } {
  const gameState = getGameState();
  
  if (!gameState.isLocked) {
    return { success: false, error: '游戏未处于锁定状态' };
  }

  gameState.isLocked = false;
  saveGameState(gameState);

  // 记录操作
  addOperationRecord({
    userId: 'admin',
    userType: 'admin',
    action: 'unlock_game',
    details: { year: gameState.currentYear },
  });

  return { success: true };
}

/**
 * 检查玩家操作是否被锁定
 */
export function checkPlayerOperationAllowed(): { allowed: boolean; error?: string } {
  const gameState = getGameState();
  
  if (gameState.isLocked) {
    return { allowed: false, error: '游戏已锁定，请等待管理员解锁' };
  }

  return { allowed: true };
}


// ============ 记账与推演功能 (Requirements: 9.5) ============

// 记账日志存储文件名
const ACCOUNTING_LOGS_FILE = 'accounting-logs.json';

import { readJsonFile, writeJsonFile } from '../storage';

/**
 * 获取所有记账日志
 */
export function getAccountingLogs(): AccountingLog[] {
  return readJsonFile<AccountingLog[]>(ACCOUNTING_LOGS_FILE, []);
}

/**
 * 保存记账日志
 */
function saveAccountingLogs(logs: AccountingLog[]): void {
  writeJsonFile(ACCOUNTING_LOGS_FILE, logs);
}

/**
 * 添加记账日志
 */
export function addAccountingLog(data: {
  year: number;
  factionId: string;
  content: string;
  shouldCalculate: boolean;
}): { success: boolean; log?: AccountingLog; error?: string } {
  const factions = getFactions();
  const faction = factions.find(f => f.id === data.factionId);
  
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  if (!data.content || data.content.trim() === '') {
    return { success: false, error: '内容不能为空' };
  }

  const logs = getAccountingLogs();
  const newLog: AccountingLog = {
    id: uuidv4(),
    year: data.year,
    factionId: data.factionId,
    factionName: faction.name,
    content: data.content.trim(),
    shouldCalculate: data.shouldCalculate,
    timestamp: new Date().toISOString(),
  };

  logs.unshift(newLog);
  saveAccountingLogs(logs);

  return { success: true, log: newLog };
}

/**
 * 筛选记账日志
 */
export function filterAccountingLogs(params: {
  year?: number;
  factionId?: string;
  shouldCalculate?: boolean;
}): AccountingLog[] {
  let logs = getAccountingLogs();

  if (params.year !== undefined) {
    logs = logs.filter(l => l.year === params.year);
  }

  if (params.factionId) {
    logs = logs.filter(l => l.factionId === params.factionId);
  }

  if (params.shouldCalculate !== undefined) {
    logs = logs.filter(l => l.shouldCalculate === params.shouldCalculate);
  }

  return logs;
}

/**
 * 删除记账日志
 */
export function deleteAccountingLog(logId: string): { success: boolean; error?: string } {
  const logs = getAccountingLogs();
  const index = logs.findIndex(l => l.id === logId);

  if (index === -1) {
    return { success: false, error: '日志不存在' };
  }

  logs.splice(index, 1);
  saveAccountingLogs(logs);

  return { success: true };
}

/**
 * 批量删除记账日志
 */
export function deleteAccountingLogsByYear(year: number): { success: boolean; deletedCount: number } {
  const logs = getAccountingLogs();
  const remainingLogs = logs.filter(l => l.year !== year);
  const deletedCount = logs.length - remainingLogs.length;

  saveAccountingLogs(remainingLogs);

  return { success: true, deletedCount };
}

// ============ 操作记录与回溯 (Requirements: 9.6, 9.7) ============

/**
 * 获取操作记录（最近N条）
 */
export function getRecentOperations(limit: number = 100): OperationRecord[] {
  const records = getOperationRecords();
  return records.slice(0, limit);
}

/**
 * 获取可回溯的操作记录（最近20条有快照的）
 */
export function getRollbackableOperations(limit: number = 20): (OperationRecord & { hasSnapshot: boolean })[] {
  const records = getOperationRecords();
  const snapshots = listSnapshots();
  const snapshotOperationIds = new Set(snapshots.map(s => s.operationId));

  const rollbackable: (OperationRecord & { hasSnapshot: boolean })[] = [];
  
  for (const record of records) {
    const hasSnapshot = snapshotOperationIds.has(record.id);
    rollbackable.push({ ...record, hasSnapshot });
    
    if (rollbackable.length >= limit) {
      break;
    }
  }

  return rollbackable;
}

/**
 * 回溯到指定操作记录
 */
export function rollbackToOperation(operationId: string): { success: boolean; error?: string } {
  const snapshots = listSnapshots();
  const snapshot = snapshots.find(s => s.operationId === operationId);

  if (!snapshot) {
    return { success: false, error: '该操作没有可用的快照' };
  }

  const restored = restoreFromSnapshot(snapshot.id);
  
  if (!restored) {
    return { success: false, error: '恢复快照失败' };
  }

  // 记录回溯操作
  addOperationRecord({
    userId: 'admin',
    userType: 'admin',
    action: 'rollback',
    details: {
      targetOperationId: operationId,
      snapshotId: snapshot.id,
    },
  });

  return { success: true };
}

/**
 * 获取游戏状态摘要
 */
export function getGameStatusSummary(): {
  currentYear: number;
  isLocked: boolean;
  factionCount: number;
  totalTerritories: number;
  totalLegions: number;
  recentOperationsCount: number;
} {
  const gameState = getGameState();
  const factions = getFactions();
  const territories = getTerritories();
  const legions = getLegions();
  const operations = getOperationRecords();

  return {
    currentYear: gameState.currentYear,
    isLocked: gameState.isLocked,
    factionCount: factions.length,
    totalTerritories: territories.length,
    totalLegions: legions.length,
    recentOperationsCount: operations.length,
  };
}

/**
 * 记录玩家操作（用于错误报告）
 */
export function recordPlayerOperation(
  userId: string,
  factionId: string,
  action: string,
  details: Record<string, unknown>
): OperationRecord {
  return addOperationRecord({
    userId,
    userType: 'player',
    factionId,
    action,
    details,
  });
}

/**
 * 获取玩家最近的操作记录
 */
export function getPlayerRecentOperations(factionId: string, limit: number = 5): OperationRecord[] {
  const records = getOperationRecords();
  return records
    .filter(r => r.factionId === factionId)
    .slice(0, limit);
}
