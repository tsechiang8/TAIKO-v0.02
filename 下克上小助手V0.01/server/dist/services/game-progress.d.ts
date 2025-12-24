/**
 * 游戏进程控制服务
 * Requirements: 9.1-9.7
 */
import { OperationRecord } from '../types';
export interface AccountingLog {
    id: string;
    year: number;
    factionId: string;
    factionName: string;
    content: string;
    shouldCalculate: boolean;
    timestamp: string;
}
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
    kokudakaGrowth: {
        territoryId: string;
        territoryName: string;
        growth: number;
    }[];
    totalKokudakaGrowth: number;
    samuraisReset: number;
}
/**
 * 执行下一年结算
 * - 扣除维护费
 * - 更新基础石高（自然增长）
 * - 重置武士行动力
 * - 创建数据快照
 */
export declare function advanceYear(): {
    success: boolean;
    settlement?: YearEndSettlement;
    error?: string;
};
/**
 * 获取游戏锁定状态
 */
export declare function isGameLocked(): boolean;
/**
 * 获取当前游戏年份
 */
export declare function getCurrentYear(): number;
/**
 * 锁定游戏
 */
export declare function lockGame(): {
    success: boolean;
    error?: string;
};
/**
 * 解锁游戏
 */
export declare function unlockGame(): {
    success: boolean;
    error?: string;
};
/**
 * 检查玩家操作是否被锁定
 */
export declare function checkPlayerOperationAllowed(): {
    allowed: boolean;
    error?: string;
};
/**
 * 获取所有记账日志
 */
export declare function getAccountingLogs(): AccountingLog[];
/**
 * 添加记账日志
 */
export declare function addAccountingLog(data: {
    year: number;
    factionId: string;
    content: string;
    shouldCalculate: boolean;
}): {
    success: boolean;
    log?: AccountingLog;
    error?: string;
};
/**
 * 筛选记账日志
 */
export declare function filterAccountingLogs(params: {
    year?: number;
    factionId?: string;
    shouldCalculate?: boolean;
}): AccountingLog[];
/**
 * 删除记账日志
 */
export declare function deleteAccountingLog(logId: string): {
    success: boolean;
    error?: string;
};
/**
 * 批量删除记账日志
 */
export declare function deleteAccountingLogsByYear(year: number): {
    success: boolean;
    deletedCount: number;
};
/**
 * 获取操作记录（最近N条）
 */
export declare function getRecentOperations(limit?: number): OperationRecord[];
/**
 * 获取可回溯的操作记录（最近20条有快照的）
 */
export declare function getRollbackableOperations(limit?: number): (OperationRecord & {
    hasSnapshot: boolean;
})[];
/**
 * 回溯到指定操作记录
 */
export declare function rollbackToOperation(operationId: string): {
    success: boolean;
    error?: string;
};
/**
 * 获取游戏状态摘要
 */
export declare function getGameStatusSummary(): {
    currentYear: number;
    isLocked: boolean;
    factionCount: number;
    totalTerritories: number;
    totalLegions: number;
    recentOperationsCount: number;
};
/**
 * 记录玩家操作（用于错误报告）
 */
export declare function recordPlayerOperation(userId: string, factionId: string, action: string, details: Record<string, unknown>): OperationRecord;
/**
 * 获取玩家最近的操作记录
 */
export declare function getPlayerRecentOperations(factionId: string, limit?: number): OperationRecord[];
//# sourceMappingURL=game-progress.d.ts.map