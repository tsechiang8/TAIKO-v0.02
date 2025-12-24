"use strict";
/**
 * 解散士兵路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const disband_soldiers_1 = require("../services/disband-soldiers");
const router = (0, express_1.Router)();
/**
 * GET /api/disband-soldiers/info
 * 获取解散士兵信息
 */
router.get('/info', middleware_1.requireAuth, (req, res) => {
    // 管理员可以通过 query 参数指定势力
    let factionId = req.query.factionId;
    // 玩家只能查看自己的势力
    if (req.user?.type === 'player') {
        factionId = req.user.factionId;
    }
    if (!factionId) {
        res.status(400).json({ success: false, error: '无法获取势力信息' });
        return;
    }
    const result = (0, disband_soldiers_1.getDisbandInfo)(factionId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
/**
 * POST /api/disband-soldiers
 * 解散士兵
 */
router.post('/', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    // 管理员可以通过 body 参数指定势力
    let factionId = req.body.factionId;
    // 玩家只能操作自己的势力
    if (req.user?.type === 'player') {
        factionId = req.user.factionId;
    }
    if (!factionId) {
        res.status(400).json({ success: false, error: '无法获取势力信息' });
        return;
    }
    const { count } = req.body;
    if (typeof count !== 'number' || count <= 0) {
        res.status(400).json({ success: false, error: '请提供有效的解散数量' });
        return;
    }
    const result = (0, disband_soldiers_1.disbandSoldiers)(factionId, count);
    if (result.success) {
        res.json({
            success: true,
            data: {
                newIdleSoldiers: result.newIdleSoldiers,
                newTreasury: result.newTreasury,
                totalCost: result.totalCost,
            },
        });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
exports.default = router;
//# sourceMappingURL=disband-soldiers.js.map