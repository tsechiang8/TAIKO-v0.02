"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../auth");
const middleware_1 = require("../auth/middleware");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', (req, res) => {
    const { code } = req.body;
    if (!code) {
        res.status(400).json({
            success: false,
            error: '请提供登录代码',
        });
        return;
    }
    const result = (0, auth_1.login)(code);
    if (result.success) {
        res.json({
            success: true,
            data: {
                userType: result.userType,
                factionId: result.factionId,
                sessionId: result.sessionId,
            },
        });
    }
    else {
        res.status(401).json({
            success: false,
            error: result.errorMessage,
        });
    }
});
/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', middleware_1.requireAuth, (req, res) => {
    if (req.sessionId) {
        (0, auth_1.logout)(req.sessionId);
    }
    res.json({
        success: true,
        message: '已成功登出',
    });
});
/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', middleware_1.requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});
/**
 * GET /api/auth/factions
 * 获取所有势力列表（仅管理员）
 */
router.get('/factions', middleware_1.requireAuth, middleware_1.requireAdmin, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({
            success: false,
            error: '未认证',
        });
        return;
    }
    const factions = (0, auth_1.getAllFactionsForAdmin)(req.sessionId);
    if (factions === null) {
        res.status(403).json({
            success: false,
            error: '无权访问',
        });
        return;
    }
    res.json({
        success: true,
        factions,
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map