"use strict";
/**
 * 士兵招募服务
 * Requirements: 4.1-4.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecruitInfo = getRecruitInfo;
exports.recruitSoldiers = recruitSoldiers;
const storage_1 = require("../storage");
const calculation_1 = require("../calculation");
/**
 * 获取势力的招募信息
 * @param factionId 势力ID
 * @returns 招募信息或null
 */
function getRecruitInfo(factionId) {
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return null;
    }
    const territories = (0, storage_1.getTerritories)().filter(t => t.factionId === factionId);
    const allTerritories = (0, storage_1.getTerritories)();
    const legions = (0, storage_1.getLegions)().filter(l => l.factionId === factionId);
    const samurais = (0, storage_1.getSamurais)().filter(s => s.factionId === factionId);
    const specialProducts = (0, storage_1.getSpecialProducts)();
    const calculation = (0, calculation_1.calculateFactionData)(faction, territories, allTerritories, legions, samurais, specialProducts);
    // 可招募数量 = 最大可招募上限 - 当前总士兵数
    const availableToRecruit = Math.max(0, calculation.maxRecruitableSoldiers - calculation.totalSoldiers);
    return {
        currentIdleSoldiers: faction.idleSoldiers,
        maxRecruitableSoldiers: calculation.maxRecruitableSoldiers,
        availableToRecruit,
    };
}
/**
 * 执行士兵招募
 * Requirements: 4.1-4.5
 * - 验证招募数量不超过上限
 * - 更新闲置士兵和可招募额度
 * - 不消耗金钱
 *
 * @param request 招募请求
 * @returns 招募结果
 */
function recruitSoldiers(request) {
    const { factionId, count } = request;
    // 验证招募数量
    if (count <= 0) {
        return {
            success: false,
            error: '招募数量必须大于0',
        };
    }
    if (!Number.isInteger(count)) {
        return {
            success: false,
            error: '招募数量必须为整数',
        };
    }
    // 获取势力数据
    const factions = (0, storage_1.getFactions)();
    const factionIndex = factions.findIndex(f => f.id === factionId);
    if (factionIndex === -1) {
        return {
            success: false,
            error: '势力不存在',
        };
    }
    const faction = factions[factionIndex];
    // 计算当前可招募数量
    const recruitInfo = getRecruitInfo(factionId);
    if (!recruitInfo) {
        return {
            success: false,
            error: '无法获取招募信息',
        };
    }
    // 验证招募数量不超过上限 (Requirement 4.3)
    if (count > recruitInfo.availableToRecruit) {
        return {
            success: false,
            error: `招募数量超过上限，当前最多可招募 ${recruitInfo.availableToRecruit} 人`,
        };
    }
    // 更新闲置士兵 (Requirement 4.4)
    factions[factionIndex].idleSoldiers += count;
    // 保存数据
    (0, storage_1.saveFactions)(factions);
    // 重新计算招募信息
    const newRecruitInfo = getRecruitInfo(factionId);
    return {
        success: true,
        newIdleSoldiers: factions[factionIndex].idleSoldiers,
        newMaxRecruitableSoldiers: newRecruitInfo?.availableToRecruit ?? 0,
    };
}
//# sourceMappingURL=recruitment.js.map