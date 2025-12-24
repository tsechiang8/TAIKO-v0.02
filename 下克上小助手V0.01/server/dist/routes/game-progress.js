"use strict";
/**
 * 游戏进程控制路由
 * Requirements: 9.1-9.7
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const game_progress_1 = require("../services/game-progress");
const router = (0, express_1.Router)();
// ============ 游戏状态 API ============
/**
 * GET /api/game/status
 * 获取游戏状态（公开）
 */
router.get('/status', middleware_1.requireAuth, (req, res) => {
    res.json({
        success: true,
        data: {
            currentYear: (0, game_progress_1.getCurrentYear)(),
            isLocked: (0, game_progress_1.isGameLocked)(),
        },
    });
});
/**
 * GET /api/game/status/summary
 * 获取游戏状态摘要（管理员）
 */
router.get('/status/summary', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const summary = (0, game_progress_1.getGameStatusSummary)();
    res.json({
        success: true,
        data: summary,
    });
});
/**
 * GET /api/game/check-operation
 * 检查玩家操作是否被允许
 */
router.get('/check-operation', middleware_1.requireAuth, (req, res) => {
    const result = (0, game_progress_1.checkPlayerOperationAllowed)();
    res.json({
        success: true,
        data: result,
    });
});
// ============ 下一年结算 API (Requirements: 9.1, 9.2) ============
/**
 * POST /api/game/advance-year
 * 执行下一年结算（管理员）
 */
router.post('/advance-year', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const result = (0, game_progress_1.advanceYear)();
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        data: result.settlement,
        message: `已进入第${result.settlement?.year}年`,
    });
});
// ============ 锁定/解锁 API (Requirements: 9.3, 9.4) ============
/**
 * POST /api/game/lock
 * 锁定游戏（管理员）
 */
router.post('/lock', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const result = (0, game_progress_1.lockGame)();
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        message: '游戏已锁定',
    });
});
/**
 * POST /api/game/unlock
 * 解锁游戏（管理员）
 */
router.post('/unlock', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const result = (0, game_progress_1.unlockGame)();
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        message: '游戏已解锁',
    });
});
// ============ 记账推演 API (Requirements: 9.5) ============
/**
 * GET /api/game/accounting-logs
 * 获取记账日志（管理员）
 */
router.get('/accounting-logs', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const { year, factionId, shouldCalculate } = req.query;
    const params = {};
    if (year !== undefined) {
        params.year = Number(year);
    }
    if (factionId) {
        params.factionId = factionId;
    }
    if (shouldCalculate !== undefined) {
        params.shouldCalculate = shouldCalculate === 'true';
    }
    const hasFilters = Object.keys(params).length > 0;
    const logs = hasFilters ? (0, game_progress_1.filterAccountingLogs)(params) : (0, game_progress_1.getAccountingLogs)();
    res.json({
        success: true,
        data: logs,
        total: logs.length,
    });
});
/**
 * POST /api/game/accounting-logs
 * 添加记账日志（管理员）
 */
router.post('/accounting-logs', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const { year, factionId, content, shouldCalculate } = req.body;
    if (year === undefined || !factionId || !content) {
        res.status(400).json({
            success: false,
            error: '年份、势力和内容为必填项',
        });
        return;
    }
    const result = (0, game_progress_1.addAccountingLog)({
        year: Number(year),
        factionId,
        content,
        shouldCalculate: shouldCalculate ?? false,
    });
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.status(201).json({
        success: true,
        data: result.log,
        message: '记账日志添加成功',
    });
});
/**
 * DELETE /api/game/accounting-logs/:logId
 * 删除记账日志（管理员）
 */
router.delete('/accounting-logs/:logId', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const { logId } = req.params;
    const result = (0, game_progress_1.deleteAccountingLog)(logId);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        message: '日志删除成功',
    });
});
/**
 * DELETE /api/game/accounting-logs/year/:year
 * 批量删除某年的记账日志（管理员）
 */
router.delete('/accounting-logs/year/:year', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const year = Number(req.params.year);
    if (isNaN(year)) {
        res.status(400).json({
            success: false,
            error: '无效的年份',
        });
        return;
    }
    const result = (0, game_progress_1.deleteAccountingLogsByYear)(year);
    res.json({
        success: true,
        message: `已删除${result.deletedCount}条日志`,
        deletedCount: result.deletedCount,
    });
});
// ============ 操作记录与回溯 API (Requirements: 9.6, 9.7) ============
/**
 * GET /api/game/operations
 * 获取操作记录（管理员）
 */
router.get('/operations', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const operations = (0, game_progress_1.getRecentOperations)(limit);
    res.json({
        success: true,
        data: operations,
        total: operations.length,
    });
});
/**
 * GET /api/game/operations/rollbackable
 * 获取可回溯的操作记录（管理员）
 */
router.get('/operations/rollbackable', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const operations = (0, game_progress_1.getRollbackableOperations)(limit);
    res.json({
        success: true,
        data: operations,
        total: operations.length,
    });
});
/**
 * POST /api/game/rollback/:operationId
 * 回溯到指定操作（管理员）
 */
router.post('/rollback/:operationId', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const { operationId } = req.params;
    const result = (0, game_progress_1.rollbackToOperation)(operationId);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        message: '数据已回溯',
    });
});
/**
 * GET /api/game/player-operations/:factionId
 * 获取玩家最近操作记录（用于错误报告）
 */
router.get('/player-operations/:factionId', middleware_1.requireAuth, (req, res) => {
    const { factionId } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    const operations = (0, game_progress_1.getPlayerRecentOperations)(factionId, limit);
    res.json({
        success: true,
        data: operations,
    });
});
exports.default = router;
//# sourceMappingURL=game-progress.js.map