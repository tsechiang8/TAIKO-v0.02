/**
 * 错误报告服务
 * Requirements: 14.1-14.9
 */
import { ErrorReport, OperationRecord } from '../types';
/**
 * 记录玩家操作（保留最近5步）
 * Requirements: 14.2, 14.5
 */
export declare function recordPlayerOperation(userId: string, userType: 'admin' | 'player', factionId: string | undefined, action: string, details: Record<string, unknown>): void;
/**
 * 获取玩家最近操作记录
 */
export declare function getRecentOperations(factionId: string): OperationRecord[];
/**
 * 创建手动错误报告
 * Requirements: 14.1, 14.2, 14.3
 */
export declare function createManualErrorReport(playerId: string, playerName: string, factionId: string, errorMessage?: string): ErrorReport;
/**
 * 创建自动错误报告
 * Requirements: 14.4, 14.5
 */
export declare function createAutomaticErrorReport(playerId: string, playerName: string, factionId: string, errorMessage: string): ErrorReport;
/**
 * 获取所有错误报告
 * Requirements: 14.6
 */
export declare function getAllErrorReports(): ErrorReport[];
/**
 * 获取错误报告（支持筛选）
 * Requirements: 14.8
 */
export declare function getErrorReports(filter?: {
    factionId?: string;
    startTime?: string;
    endTime?: string;
    resolved?: boolean;
}): ErrorReport[];
/**
 * 标记错误报告为已处理
 * Requirements: 14.9
 */
export declare function markErrorReportResolved(reportId: string): boolean;
/**
 * 删除错误报告
 */
export declare function deleteErrorReport(reportId: string): boolean;
/**
 * 获取单个错误报告
 */
export declare function getErrorReportById(reportId: string): ErrorReport | null;
//# sourceMappingURL=error-report.d.ts.map