"use strict";
/**
 * 税率更改路由
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const tax_rate_1 = require("../services/tax-rate");
const router = (0, express_1.Router)();
/**
 * GET /api/tax-rate/info
 * 获取税率信息
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
    const result = (0, tax_rate_1.getTaxRateInfo)(factionId);
    if (result.success) {
        res.json({ success: true, data: result.data });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
/**
 * POST /api/tax-rate/change
 * 更改税率
 */
router.post('/change', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    let factionId = req.body.factionId;
    if (req.user?.type === 'player') {
        factionId = req.user.factionId;
    }
    if (!factionId) {
        res.status(400).json({ success: false, error: '无法获取势力信息' });
        return;
    }
    const { taxRate } = req.body;
    if (typeof taxRate !== 'number') {
        res.status(400).json({ success: false, error: '请提供有效的税率' });
        return;
    }
    const result = (0, tax_rate_1.changeTaxRate)(factionId, taxRate);
    if (result.success) {
        res.json({
            success: true,
            data: { newTaxRate: result.newTaxRate },
        });
    }
    else {
        res.status(400).json({ success: false, error: result.error });
    }
});
exports.default = router;
//# sourceMappingURL=tax-rate.js.map