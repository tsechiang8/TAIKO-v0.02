/**
 * 错误报告服务
 * Requirements: 14.1-14.9
 */

import { v4 as uuidv4 } from 'uuid';
import { ErrorReport, OperationRecord } from '../types';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const ERROR_REPORTS_FILE = path.join(DATA_DIR, 'error-reports.json');

// 玩家操作记录缓存（最近5步）
const playerOperationCache: Map<string, OperationRecord[]> = new Map();
const MAX_CACHED_OPERATIONS = 5;

/**
 * 读取错误报告文件
 */
function readErrorReports(): ErrorReport[] {
  try {
    if (!fs.existsSync(ERROR_REPORTS_FILE)) {
      return [];
    }
    const content = fs.readFileSync(ERROR_REPORTS_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('读取错误报告文件失败:', error);
    return [];
  }
}

/**
 * 保存错误报告文件
 */
function saveErrorReports(reports: ErrorReport[]): void {
  try {
    fs.writeFileSync(ERROR_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (error) {
    console.error('保存错误报告文件失败:', error);
  }
}

/**
 * 记录玩家操作（保留最近5步）
 * Requirements: 14.2, 14.5
 */
export function recordPlayerOperation(
  userId: string,
  userType: 'admin' | 'player',
  factionId: string | undefined,
  action: string,
  details: Record<string, unknown>
): void {
  const record: OperationRecord = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userId,
    userType,
    factionId,
    action,
    details,
  };

  const cacheKey = factionId || userId;
  const operations = playerOperationCache.get(cacheKey) || [];
  
  // 添加新操作到开头
  operations.unshift(record);
  
  // 保留最近5步
  if (operations.length > MAX_CACHED_OPERATIONS) {
    operations.pop();
  }
  
  playerOperationCache.set(cacheKey, operations);
}

/**
 * 获取玩家最近操作记录
 */
export function getRecentOperations(factionId: string): OperationRecord[] {
  return playerOperationCache.get(factionId) || [];
}

/**
 * 创建手动错误报告
 * Requirements: 14.1, 14.2, 14.3
 */
export function createManualErrorReport(
  playerId: string,
  playerName: string,
  factionId: string,
  errorMessage?: string
): ErrorReport {
  const recentOperations = getRecentOperations(factionId);
  
  const report: ErrorReport = {
    id: uuidv4(),
    playerId,
    playerName,
    factionId,
    timestamp: new Date().toISOString(),
    errorType: 'manual',
    errorMessage,
    recentOperations,
    resolved: false,
  };

  const reports = readErrorReports();
  reports.unshift(report);
  saveErrorReports(reports);

  return report;
}


/**
 * 创建自动错误报告
 * Requirements: 14.4, 14.5
 */
export function createAutomaticErrorReport(
  playerId: string,
  playerName: string,
  factionId: string,
  errorMessage: string
): ErrorReport {
  const recentOperations = getRecentOperations(factionId);
  
  const report: ErrorReport = {
    id: uuidv4(),
    playerId,
    playerName,
    factionId,
    timestamp: new Date().toISOString(),
    errorType: 'automatic',
    errorMessage,
    recentOperations,
    resolved: false,
  };

  const reports = readErrorReports();
  reports.unshift(report);
  saveErrorReports(reports);

  return report;
}

/**
 * 获取所有错误报告
 * Requirements: 14.6
 */
export function getAllErrorReports(): ErrorReport[] {
  return readErrorReports();
}

/**
 * 获取错误报告（支持筛选）
 * Requirements: 14.8
 */
export function getErrorReports(filter?: {
  factionId?: string;
  startTime?: string;
  endTime?: string;
  resolved?: boolean;
}): ErrorReport[] {
  let reports = readErrorReports();

  if (filter) {
    if (filter.factionId) {
      reports = reports.filter(r => r.factionId === filter.factionId);
    }
    if (filter.startTime) {
      const startDate = new Date(filter.startTime);
      reports = reports.filter(r => new Date(r.timestamp) >= startDate);
    }
    if (filter.endTime) {
      const endDate = new Date(filter.endTime);
      reports = reports.filter(r => new Date(r.timestamp) <= endDate);
    }
    if (filter.resolved !== undefined) {
      reports = reports.filter(r => r.resolved === filter.resolved);
    }
  }

  return reports;
}

/**
 * 标记错误报告为已处理
 * Requirements: 14.9
 */
export function markErrorReportResolved(reportId: string): boolean {
  const reports = readErrorReports();
  const report = reports.find(r => r.id === reportId);
  
  if (!report) {
    return false;
  }

  report.resolved = true;
  saveErrorReports(reports);
  return true;
}

/**
 * 删除错误报告
 */
export function deleteErrorReport(reportId: string): boolean {
  const reports = readErrorReports();
  const index = reports.findIndex(r => r.id === reportId);
  
  if (index === -1) {
    return false;
  }

  reports.splice(index, 1);
  saveErrorReports(reports);
  return true;
}

/**
 * 获取单个错误报告
 */
export function getErrorReportById(reportId: string): ErrorReport | null {
  const reports = readErrorReports();
  return reports.find(r => r.id === reportId) || null;
}
