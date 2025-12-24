"use strict";
/**
 * 游戏进程控制服务
 * Requirements: 9.1-9.7
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.advanceYear = advanceYear;
exports.isGameLocked = isGameLocked;
exports.getCurrentYear = getCurrentYear;
exports.lockGame = lockGame;
exports.unlockGame = unlockGame;
exports.checkPlayerOperationAllowed = checkPlayerOperationAllowed;
exports.getAccountingLogs = getAccountingLogs;
exports.addAccountingLog = addAccountingLog;
exports.filterAccountingLogs = filterAccountingLogs;
exports.deleteAccountingLog = deleteAccountingLog;
exports.deleteAccountingLogsByYear = deleteAccountingLogsByYear;
exports.getRecentOperations = getRecentOperations;
exports.getRollbackableOperations = getRollbackableOperations;
exports.rollbackToOperation = rollbackToOperation;
exports.getGameStatusSummary = getGameStatusSummary;
exports.recordPlayerOperation = recordPlayerOperation;
exports.getPlayerRecentOperations = getPlayerRecentOperations;
const uuid_1 = require("uuid");
const storage_1 = require("../storage");
const calculation_1 = require("../calculation");
// ============ 下一年结算服务 (Requirements: 9.1, 9.2) ============
/**
 * 执行下一年结算
 * - 扣除维护费
 * - 更新基础石高（自然增长）
 * - 重置武士行动力
 * - 创建数据快照
 */
function advanceYear() {
    const gameState = (0, storage_1.getGameState)();
    // 检查是否锁定
    if (gameState.isLocked) {
        return { success: false, error: '游戏已锁定，请先解锁' };
    }
    const factions = (0, storage_1.getFactions)();
    const territories = (0, storage_1.getTerritories)();
    const samurais = (0, storage_1.getSamurais)();
    const legions = (0, storage_1.getLegions)();
    const specialProducts = (0, storage_1.getSpecialProducts)();
    const factionSettlements = [];
    // 为每个势力执行结算
    for (const faction of factions) {
        const factionTerritories = territories.filter(t => t.factionId === faction.id);
        const factionLegions = legions.filter(l => l.factionId === faction.id);
        const factionSamurais = samurais.filter(s => s.factionId === faction.id);
        // 计算势力数据
        const calcResult = (0, calculation_1.calculateFactionData)(faction, factionTerritories, territories, factionLegions, factionSamurais, specialProducts);
        // 1. 计算收入和维护费，更新金库
        // 年度收入 = 表面石高 × 税率 × 0.4
        // 年度净收入 = 年度收入 - 维护费
        // 新金库 = 旧金库 + 年度净收入（可以为负）
        const previousTreasury = faction.treasury;
        const income = calcResult.income; // 表面石高 × 税率 × 0.4
        const maintenanceCost = calcResult.maintenanceCost.total;
        const netIncome = income - maintenanceCost; // 年度净收入
        faction.treasury = previousTreasury + netIncome; // 金库可以为负
        // 2. 计算自然增长率并更新领地石高
        const growthRate = calcResult.growthRate;
        const kokudakaGrowth = [];
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
    (0, storage_1.saveFactions)(factions);
    (0, storage_1.saveTerritories)(territories);
    (0, storage_1.saveSamurais)(samurais);
    // 更新游戏年份
    const previousYear = gameState.currentYear;
    gameState.currentYear += 1;
    (0, storage_1.saveGameState)(gameState);
    // 创建操作记录
    const operationRecord = (0, storage_1.addOperationRecord)({
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
    const snapshot = (0, storage_1.createSnapshot)(operationRecord.id);
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
function isGameLocked() {
    return (0, storage_1.getGameState)().isLocked;
}
/**
 * 获取当前游戏年份
 */
function getCurrentYear() {
    return (0, storage_1.getGameState)().currentYear;
}
/**
 * 锁定游戏
 */
function lockGame() {
    const gameState = (0, storage_1.getGameState)();
    if (gameState.isLocked) {
        return { success: false, error: '游戏已经处于锁定状态' };
    }
    gameState.isLocked = true;
    (0, storage_1.saveGameState)(gameState);
    // 记录操作
    (0, storage_1.addOperationRecord)({
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
function unlockGame() {
    const gameState = (0, storage_1.getGameState)();
    if (!gameState.isLocked) {
        return { success: false, error: '游戏未处于锁定状态' };
    }
    gameState.isLocked = false;
    (0, storage_1.saveGameState)(gameState);
    // 记录操作
    (0, storage_1.addOperationRecord)({
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
function checkPlayerOperationAllowed() {
    const gameState = (0, storage_1.getGameState)();
    if (gameState.isLocked) {
        return { allowed: false, error: '游戏已锁定，请等待管理员解锁' };
    }
    return { allowed: true };
}
// ============ 记账与推演功能 (Requirements: 9.5) ============
// 记账日志存储文件名
const ACCOUNTING_LOGS_FILE = 'accounting-logs.json';
const storage_2 = require("../storage");
/**
 * 获取所有记账日志
 */
function getAccountingLogs() {
    return (0, storage_2.readJsonFile)(ACCOUNTING_LOGS_FILE, []);
}
/**
 * 保存记账日志
 */
function saveAccountingLogs(logs) {
    (0, storage_2.writeJsonFile)(ACCOUNTING_LOGS_FILE, logs);
}
/**
 * 添加记账日志
 */
function addAccountingLog(data) {
    const factions = (0, storage_1.getFactions)();
    const faction = factions.find(f => f.id === data.factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    if (!data.content || data.content.trim() === '') {
        return { success: false, error: '内容不能为空' };
    }
    const logs = getAccountingLogs();
    const newLog = {
        id: (0, uuid_1.v4)(),
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
function filterAccountingLogs(params) {
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
function deleteAccountingLog(logId) {
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
function deleteAccountingLogsByYear(year) {
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
function getRecentOperations(limit = 100) {
    const records = (0, storage_1.getOperationRecords)();
    return records.slice(0, limit);
}
/**
 * 获取可回溯的操作记录（最近20条有快照的）
 */
function getRollbackableOperations(limit = 20) {
    const records = (0, storage_1.getOperationRecords)();
    const snapshots = (0, storage_1.listSnapshots)();
    const snapshotOperationIds = new Set(snapshots.map(s => s.operationId));
    const rollbackable = [];
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
function rollbackToOperation(operationId) {
    const snapshots = (0, storage_1.listSnapshots)();
    const snapshot = snapshots.find(s => s.operationId === operationId);
    if (!snapshot) {
        return { success: false, error: '该操作没有可用的快照' };
    }
    const restored = (0, storage_1.restoreFromSnapshot)(snapshot.id);
    if (!restored) {
        return { success: false, error: '恢复快照失败' };
    }
    // 记录回溯操作
    (0, storage_1.addOperationRecord)({
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
function getGameStatusSummary() {
    const gameState = (0, storage_1.getGameState)();
    const factions = (0, storage_1.getFactions)();
    const territories = (0, storage_1.getTerritories)();
    const legions = (0, storage_1.getLegions)();
    const operations = (0, storage_1.getOperationRecords)();
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
function recordPlayerOperation(userId, factionId, action, details) {
    return (0, storage_1.addOperationRecord)({
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
function getPlayerRecentOperations(factionId, limit = 5) {
    const records = (0, storage_1.getOperationRecords)();
    return records
        .filter(r => r.factionId === factionId)
        .slice(0, limit);
}
//# sourceMappingURL=game-progress.js.map