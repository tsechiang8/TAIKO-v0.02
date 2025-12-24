"use strict";
/**
 * 错误报告服务
 * Requirements: 14.1-14.9
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPlayerOperation = recordPlayerOperation;
exports.getRecentOperations = getRecentOperations;
exports.createManualErrorReport = createManualErrorReport;
exports.createAutomaticErrorReport = createAutomaticErrorReport;
exports.getAllErrorReports = getAllErrorReports;
exports.getErrorReports = getErrorReports;
exports.markErrorReportResolved = markErrorReportResolved;
exports.deleteErrorReport = deleteErrorReport;
exports.getErrorReportById = getErrorReportById;
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DATA_DIR = path.join(__dirname, '../../data');
const ERROR_REPORTS_FILE = path.join(DATA_DIR, 'error-reports.json');
// 玩家操作记录缓存（最近5步）
const playerOperationCache = new Map();
const MAX_CACHED_OPERATIONS = 5;
/**
 * 读取错误报告文件
 */
function readErrorReports() {
    try {
        if (!fs.existsSync(ERROR_REPORTS_FILE)) {
            return [];
        }
        const content = fs.readFileSync(ERROR_REPORTS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.error('读取错误报告文件失败:', error);
        return [];
    }
}
/**
 * 保存错误报告文件
 */
function saveErrorReports(reports) {
    try {
        fs.writeFileSync(ERROR_REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('保存错误报告文件失败:', error);
    }
}
/**
 * 记录玩家操作（保留最近5步）
 * Requirements: 14.2, 14.5
 */
function recordPlayerOperation(userId, userType, factionId, action, details) {
    const record = {
        id: (0, uuid_1.v4)(),
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
function getRecentOperations(factionId) {
    return playerOperationCache.get(factionId) || [];
}
/**
 * 创建手动错误报告
 * Requirements: 14.1, 14.2, 14.3
 */
function createManualErrorReport(playerId, playerName, factionId, errorMessage) {
    const recentOperations = getRecentOperations(factionId);
    const report = {
        id: (0, uuid_1.v4)(),
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
function createAutomaticErrorReport(playerId, playerName, factionId, errorMessage) {
    const recentOperations = getRecentOperations(factionId);
    const report = {
        id: (0, uuid_1.v4)(),
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
function getAllErrorReports() {
    return readErrorReports();
}
/**
 * 获取错误报告（支持筛选）
 * Requirements: 14.8
 */
function getErrorReports(filter) {
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
function markErrorReportResolved(reportId) {
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
function deleteErrorReport(reportId) {
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
function getErrorReportById(reportId) {
    const reports = readErrorReports();
    return reports.find(r => r.id === reportId) || null;
}
//# sourceMappingURL=error-report.js.map