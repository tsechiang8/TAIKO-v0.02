"use strict";
/**
 * 投资系统路由
 * Requirements: 7.1-7.8
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const auth_1 = require("../auth");
const investment_1 = require("../services/investment");
const router = (0, express_1.Router)();
/**
 * GET /api/investment/status
 * 获取势力的投资状态
 */
router.get('/status', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = req.query.factionId;
        if (!factionId) {
            res.status(400).json({
                success: false,
                error: '管理员需要指定势力ID',
            });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({
            success: false,
            error: '未找到所属势力',
        });
        return;
    }
    const status = (0, investment_1.getInvestmentStatus)(factionId);
    if (!status) {
        res.status(404).json({
            success: false,
            error: '无法获取投资状态',
        });
        return;
    }
    res.json({
        success: true,
        data: status,
    });
});
/**
 * GET /api/investment/samurais
 * 获取可执行投资的武士列表
 */
router.get('/samurais', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = req.query.factionId;
        if (!factionId) {
            res.status(400).json({
                success: false,
                error: '管理员需要指定势力ID',
            });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({
            success: false,
            error: '未找到所属势力',
        });
        return;
    }
    const samurais = (0, investment_1.getAvailableSamuraisForInvestment)(factionId);
    res.json({
        success: true,
        data: samurais,
    });
});
/**
 * POST /api/investment/preview
 * 获取投资预览
 */
router.post('/preview', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    const { type, samuraiId, amount, factionId: requestFactionId } = req.body;
    // 验证投资类型
    if (!type || !['agriculture', 'commerce', 'navy', 'armament'].includes(type)) {
        res.status(400).json({
            success: false,
            error: '无效的投资类型',
        });
        return;
    }
    // 验证武士ID
    if (!samuraiId) {
        res.status(400).json({
            success: false,
            error: '请选择执行投资的武士',
        });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({
                success: false,
                error: '管理员需要指定势力ID',
            });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
        if (requestFactionId && requestFactionId !== factionId) {
            res.status(403).json({
                success: false,
                error: '无权为其他势力执行投资',
            });
            return;
        }
    }
    if (!factionId) {
        res.status(404).json({
            success: false,
            error: '未找到所属势力',
        });
        return;
    }
    const preview = (0, investment_1.getInvestmentPreview)({
        factionId,
        samuraiId,
        type: type,
        amount: type === 'commerce' ? Number(amount) : undefined,
    });
    res.json({
        success: true,
        data: preview,
    });
});
/**
 * POST /api/investment/execute
 * 执行投资
 */
router.post('/execute', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    const { type, samuraiId, amount, factionId: requestFactionId } = req.body;
    // 验证投资类型
    if (!type || !['agriculture', 'commerce', 'navy', 'armament'].includes(type)) {
        res.status(400).json({
            success: false,
            error: '无效的投资类型',
        });
        return;
    }
    // 验证武士ID
    if (!samuraiId) {
        res.status(400).json({
            success: false,
            error: '请选择执行投资的武士',
        });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({
                success: false,
                error: '管理员需要指定势力ID',
            });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
        if (requestFactionId && requestFactionId !== factionId) {
            res.status(403).json({
                success: false,
                error: '无权为其他势力执行投资',
            });
            return;
        }
    }
    if (!factionId) {
        res.status(404).json({
            success: false,
            error: '未找到所属势力',
        });
        return;
    }
    // 执行投资
    const result = (0, investment_1.executeInvestment)({
        factionId,
        samuraiId,
        type: type,
        amount: type === 'commerce' ? Number(amount) : undefined,
    });
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
        });
        return;
    }
    res.json({
        success: true,
        data: result,
    });
});
/**
 * GET /api/investment/levels
 * 获取所有投资等级表
 */
router.get('/levels', (req, res) => {
    res.json({
        success: true,
        data: {
            agriculture: investment_1.AGRICULTURE_LEVELS,
            commerce: investment_1.COMMERCE_LEVELS,
            navy: investment_1.NAVY_LEVELS,
            armament: investment_1.ARMAMENT_LEVELS,
        },
    });
});
/**
 * GET /api/investment/configs
 * 获取投资配置
 */
router.get('/configs', (req, res) => {
    res.json({
        success: true,
        data: investment_1.INVESTMENT_CONFIGS,
    });
});
exports.default = router;
//# sourceMappingURL=investment.js.map