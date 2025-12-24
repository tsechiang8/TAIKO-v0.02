"use strict";
/**
 * 装备购买路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const equipment_purchase_1 = require("../services/equipment-purchase");
const router = (0, express_1.Router)();
/**
 * GET /api/equipment/info
 * 获取购买装备信息
 */
router.get('/info', middleware_1.requireAuth, (req, res) => {
    let factionId = req.query.factionId;
    if (req.user?.type === 'player') {
        factionId = req.user.factionId;
    }
    if (!factionId) {
        res.status(400).json({ success: false, error: '无法获取势力信息' });
        return;
    }
    const result = (0, equipment_purchase_1.getPurchaseInfo)(factionId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
/**
 * GET /api/equipment/prices
 * 获取装备价格
 */
router.get('/prices', (req, res) => {
    res.json({
        success: true,
        data: equipment_purchase_1.EQUIPMENT_PRICES,
    });
});
/**
 * POST /api/equipment/purchase
 * 购买装备
 */
router.post('/purchase', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    let factionId = req.body.factionId;
    if (req.user?.type === 'player') {
        factionId = req.user.factionId;
    }
    if (!factionId) {
        res.status(400).json({ success: false, error: '无法获取势力信息' });
        return;
    }
    const { rifles = 0, horses = 0, cannons = 0 } = req.body;
    const result = (0, equipment_purchase_1.purchaseEquipment)(factionId, {
        rifles: Number(rifles),
        horses: Number(horses),
        cannons: Number(cannons),
    });
    if (result.success) {
        res.json({
            success: true,
            data: {
                totalCost: result.totalCost,
                newTreasury: result.newTreasury,
                newEquipment: result.newEquipment,
            },
        });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
exports.default = router;
//# sourceMappingURL=equipment-purchase.js.map