"use strict";
/**
 * 军团管理路由
 * Requirements: 5.1-5.10, 6.1-6.6
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middleware_1 = require("../auth/middleware");
const legion_1 = require("../services/legion");
const auth_1 = require("../auth");
const storage_1 = require("../storage");
const router = (0, express_1.Router)();
/**
 * GET /api/legions
 * 获取当前玩家势力的所有军团
 */
router.get('/', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = req.query.factionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    const legions = (0, legion_1.getFactionLegions)(factionId);
    res.json({ success: true, data: legions });
});
/**
 * GET /api/legions/commanders
 * 获取可用将领列表
 */
router.get('/commanders', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = req.query.factionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    const commanders = (0, legion_1.getAvailableCommanders)(factionId);
    res.json({ success: true, data: commanders });
});
/**
 * GET /api/legions/territories
 * 获取可用位置列表（势力拥有的领地）
 */
router.get('/territories', middleware_1.requireAuth, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = req.query.factionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    const territories = (0, storage_1.getTerritories)().filter(t => t.factionId === factionId);
    res.json({ success: true, data: territories });
});
/**
 * GET /api/legions/:legionId
 * 获取军团详情
 */
router.get('/:legionId', middleware_1.requireAuth, (req, res) => {
    const { legionId } = req.params;
    const legion = (0, legion_1.getLegionById)(legionId);
    if (!legion) {
        res.status(404).json({ success: false, error: '军团不存在' });
        return;
    }
    // 验证权限
    if (req.user?.type !== 'admin') {
        const factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
        if (legion.factionId !== factionId) {
            res.status(403).json({ success: false, error: '无权访问该军团' });
            return;
        }
    }
    res.json({ success: true, data: legion });
});
/**
 * POST /api/legions/validate-name
 * 验证军团名称
 */
router.post('/validate-name', middleware_1.requireAuth, (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ success: false, error: '请提供军团名称' });
        return;
    }
    const result = (0, legion_1.validateLegionName)(name);
    res.json({ success: true, data: result });
});
/**
 * POST /api/legions/check-commander
 * 检查将领冲突
 */
router.post('/check-commander', middleware_1.requireAuth, (req, res) => {
    const { commanderId, excludeLegionId } = req.body;
    if (!commanderId) {
        res.status(400).json({ success: false, error: '请提供将领ID' });
        return;
    }
    const conflictLegion = (0, legion_1.checkCommanderConflict)(commanderId, excludeLegionId);
    res.json({
        success: true,
        data: {
            hasConflict: !!conflictLegion,
            conflictLegion,
        },
    });
});
/**
 * POST /api/legions
 * 创建军团
 */
router.post('/', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    const { name, commanderId, soldierCount, rifles = 0, horses = 0, cannons = 0, locationId, factionId: requestFactionId, forceReassign = false, } = req.body;
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
        if (requestFactionId && requestFactionId !== factionId) {
            res.status(403).json({ success: false, error: '无权为其他势力创建军团' });
            return;
        }
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    // 验证必填字段
    if (!name) {
        res.status(400).json({ success: false, error: '请提供军团名称' });
        return;
    }
    if (!commanderId) {
        res.status(400).json({ success: false, error: '请选择将领' });
        return;
    }
    if (!soldierCount || soldierCount <= 0) {
        res.status(400).json({ success: false, error: '军团人数必须大于0' });
        return;
    }
    if (!locationId) {
        res.status(400).json({ success: false, error: '请选择创建位置' });
        return;
    }
    // 创建军团
    const result = (0, legion_1.createLegion)({
        factionId,
        name,
        commanderId,
        soldierCount: Number(soldierCount),
        rifles: Number(rifles),
        horses: Number(horses),
        cannons: Number(cannons),
        locationId,
    }, forceReassign);
    if (!result.success) {
        const statusCode = result.conflictLegion ? 409 : 400;
        res.status(statusCode).json({
            success: false,
            error: result.error,
            conflictLegion: result.conflictLegion,
        });
        return;
    }
    res.status(201).json({
        success: true,
        data: result.legion,
        message: `军团「${result.legion.name}」创建成功`,
    });
});
/**
 * DELETE /api/legions/:legionId
 * 解散军团
 */
router.delete('/:legionId', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    const { legionId } = req.params;
    const { factionId: requestFactionId } = req.body;
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    const result = (0, legion_1.disbandLegion)(legionId, factionId);
    if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
    }
    res.json({
        success: true,
        data: { returnedResources: result.returnedResources },
        message: '军团已解散，资源已返还库存',
    });
});
/**
 * PATCH /api/legions/:legionId/soldiers
 * 编辑军团人数
 */
router.patch('/:legionId/soldiers', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    const { legionId } = req.params;
    const { count, factionId: requestFactionId } = req.body;
    if (count === undefined || count === null) {
        res.status(400).json({ success: false, error: '请提供新的人数' });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    const result = (0, legion_1.updateLegionSoldiers)({
        legionId,
        factionId,
        newCount: Number(count),
    });
    if (!result.success) {
        res.status(400).json({
            success: false,
            error: result.error,
            shouldDisband: result.shouldDisband,
        });
        return;
    }
    res.json({
        success: true,
        data: {
            newSoldierCount: result.newSoldierCount,
            newIdleSoldiers: result.newIdleSoldiers,
        },
        message: '军团人数已更新',
    });
});
/**
 * PATCH /api/legions/:legionId/equipment
 * 编辑军团装备
 */
router.patch('/:legionId/equipment', middleware_1.requireAuth, middleware_1.checkGameLock, (req, res) => {
    if (!req.sessionId) {
        res.status(401).json({ success: false, error: '未认证' });
        return;
    }
    const { legionId } = req.params;
    const { rifles, horses, cannons, factionId: requestFactionId } = req.body;
    if (rifles === undefined && horses === undefined && cannons === undefined) {
        res.status(400).json({ success: false, error: '请提供要更新的装备数量' });
        return;
    }
    // 获取势力ID
    let factionId;
    if (req.user?.type === 'admin') {
        factionId = requestFactionId;
        if (!factionId) {
            res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
            return;
        }
    }
    else {
        factionId = (0, auth_1.getPlayerFactionId)(req.sessionId);
    }
    if (!factionId) {
        res.status(404).json({ success: false, error: '未找到所属势力' });
        return;
    }
    // 获取当前军团装备
    const legion = (0, legion_1.getLegionById)(legionId);
    if (!legion) {
        res.status(404).json({ success: false, error: '军团不存在' });
        return;
    }
    const result = (0, legion_1.updateLegionEquipment)({
        legionId,
        factionId,
        rifles: rifles !== undefined ? Number(rifles) : legion.rifles,
        horses: horses !== undefined ? Number(horses) : legion.horses,
        cannons: cannons !== undefined ? Number(cannons) : legion.cannons,
    });
    if (!result.success) {
        res.status(400).json({ success: false, error: result.error });
        return;
    }
    res.json({
        success: true,
        data: {
            newEquipment: result.newEquipment,
            newInventory: result.newInventory,
        },
        message: '军团装备已更新',
    });
});
exports.default = router;
//# sourceMappingURL=legion.js.map