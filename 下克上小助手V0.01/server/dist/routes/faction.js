"use strict";
/**
 * 势力数据路由
 * 提供势力数据的API接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const faction_1 = require("../services/faction");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
/**
 * GET /api/factions
 * 获取所有势力列表（仅管理员）
 */
router.get('/', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const factions = (0, faction_1.getAllFactionsList)();
    res.json({
        success: true,
        factions,
    });
});
/**
 * GET /api/factions/me
 * 获取当前玩家的势力数据
 */
router.get('/me', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    // 管理员没有"自己的势力"
    if (req.user?.type === 'admin') {
        res.status(400).json({
            success: false,
            error: '管理员没有所属势力，请使用 /api/factions/:factionId 访问特定势力',
        });
        return;
    }
    const factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    if (!factionId) {
        res.status(404).json({
            success: false,
            error: '未找到所属势力',
        });
        return;
    }
    const dashboard = (0, faction_1.getFactionDashboard)(factionId);
    if (!dashboard) {
        res.status(404).json({
            success: false,
            error: '势力数据不存在',
        });
        return;
    }
    res.json({
        success: true,
        data: dashboard,
    });
});
/**
 * GET /api/factions/:factionId
 * 获取指定势力的完整数据
 * 玩家只能访问自己的势力，管理员可以访问所有势力
 */
router.get('/:factionId', middleware_1.requireAuth, (0, middleware_1.requireFactionAccess)(middleware_1.factionIdFromParams), (req, res) => {
    const { factionId } = req.params;
    const dashboard = (0, faction_1.getFactionDashboard)(factionId);
    if (!dashboard) {
        res.status(404).json({
            success: false,
            error: '势力不存在',
        });
        return;
    }
    res.json({
        success: true,
        data: dashboard,
    });
});
/**
 * GET /api/factions/:factionId/basic
 * 获取势力基础信息（名称、家主等）
 */
router.get('/:factionId/basic', middleware_1.requireAuth, (0, middleware_1.requireFactionAccess)(middleware_1.factionIdFromParams), (req, res) => {
    const { factionId } = req.params;
    const basicInfo = (0, faction_1.getFactionBasicInfo)(factionId);
    if (!basicInfo) {
        res.status(404).json({
            success: false,
            error: '势力不存在',
        });
        return;
    }
    res.json({
        success: true,
        data: basicInfo,
    });
});
/**
 * PUT /api/factions/:factionId/code
 * 更新势力代码（仅管理员）
 */
router.put('/:factionId/code', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    const { factionId } = req.params;
    const { code } = req.body;
    if (!code) {
        res.status(400).json({
            success: false,
            error: '请提供新代码',
        });
        return;
    }
    const result = (0, faction_1.updateFactionCode)(factionId, code);
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        message: '代码更新成功',
    });
});
exports.default = router;
//# sourceMappingURL=faction.js.map