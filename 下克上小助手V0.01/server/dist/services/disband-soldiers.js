"use strict";
/**
 * 解散士兵服务
 * Requirements: 解散士兵功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.disbandSoldiers = disbandSoldiers;
exports.getDisbandInfo = getDisbandInfo;
const storage_1 = require("../storage");
const DISBAND_COST_PER_SOLDIER = 2; // 每解散一个士兵扣除2石
/**
 * 解散士兵
 * @param factionId 势力ID
 * @param count 解散数量
 * @returns 解散结果
 */
function disbandSoldiers(factionId, count) {
    if (count <= 0) {
        return { success: false, error: '解散数量必须大于0' };
    }
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    if (count > faction.idleSoldiers) {
        return { success: false, error: '解散数量超过闲置士兵数量' };
    }
    const totalCost = count * DISBAND_COST_PER_SOLDIER;
    if (totalCost > faction.treasury) {
        return { success: false, error: `金库不足，需要${totalCost}石，当前${faction.treasury}石` };
    }
    // 更新势力数据
    const factions = (0, storage_1.getFactions)();
    const factionIndex = factions.findIndex(f => f.id === factionId);
    if (factionIndex === -1) {
        return { success: false, error: '势力不存在' };
    }
    factions[factionIndex].idleSoldiers -= count;
    factions[factionIndex].treasury -= totalCost;
    (0, storage_1.saveFactions)(factions);
    // 记录操作
    (0, storage_1.addOperationRecord)({
        userId: factionId,
        userType: 'player',
        factionId: factionId,
        action: '解散士兵',
        details: {
            count,
            cost: totalCost,
            newIdleSoldiers: factions[factionIndex].idleSoldiers,
            newTreasury: factions[factionIndex].treasury,
        },
    });
    return {
        success: true,
        newIdleSoldiers: factions[factionIndex].idleSoldiers,
        newTreasury: factions[factionIndex].treasury,
        totalCost,
    };
}
/**
 * 获取解散士兵信息
 * @param factionId 势力ID
 * @returns 解散信息
 */
function getDisbandInfo(factionId) {
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    const maxByTreasury = Math.floor(faction.treasury / DISBAND_COST_PER_SOLDIER);
    const maxDisbandable = Math.min(faction.idleSoldiers, maxByTreasury);
    return {
        success: true,
        data: {
            idleSoldiers: faction.idleSoldiers,
            treasury: faction.treasury,
            costPerSoldier: DISBAND_COST_PER_SOLDIER,
            maxDisbandable,
        },
    };
}
//# sourceMappingURL=disband-soldiers.js.map