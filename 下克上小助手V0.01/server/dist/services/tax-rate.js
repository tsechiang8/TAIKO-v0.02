"use strict";
/**
 * 税率更改服务
 * 每回合只能更换一次税率
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasTaxRateChangedThisYear = hasTaxRateChangedThisYear;
exports.getTaxRateInfo = getTaxRateInfo;
exports.changeTaxRate = changeTaxRate;
exports.resetTaxRateChangeStatus = resetTaxRateChangeStatus;
const storage_1 = require("../storage");
// 存储每个势力本回合是否已更改税率
const taxRateChangedThisYear = new Map();
/**
 * 检查势力本回合是否已更改税率
 */
function hasTaxRateChangedThisYear(factionId) {
    const currentYear = (0, storage_1.getGameState)().currentYear;
    const changedYear = taxRateChangedThisYear.get(factionId);
    return changedYear === currentYear;
}
/**
 * 获取税率信息
 */
function getTaxRateInfo(factionId) {
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    const canChange = !hasTaxRateChangedThisYear(factionId);
    return {
        success: true,
        data: {
            currentTaxRate: faction.taxRate,
            canChange,
            availableRates: [0.4, 0.6, 0.8],
        },
    };
}
/**
 * 更改税率
 */
function changeTaxRate(factionId, newTaxRate) {
    // 验证税率
    if (![0.4, 0.6, 0.8].includes(newTaxRate)) {
        return { success: false, error: '税率必须为40%、60%或80%' };
    }
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return { success: false, error: '势力不存在' };
    }
    // 检查是否已更改过
    if (hasTaxRateChangedThisYear(factionId)) {
        return { success: false, error: '本回合已更改过税率，每回合只能更改一次' };
    }
    // 检查是否与当前税率相同
    if (faction.taxRate === newTaxRate) {
        return { success: false, error: '新税率与当前税率相同' };
    }
    const oldTaxRate = faction.taxRate;
    // 更新势力数据
    const factions = (0, storage_1.getFactions)();
    const factionIndex = factions.findIndex(f => f.id === factionId);
    if (factionIndex === -1) {
        return { success: false, error: '势力不存在' };
    }
    factions[factionIndex].taxRate = newTaxRate;
    (0, storage_1.saveFactions)(factions);
    // 记录本回合已更改
    const currentYear = (0, storage_1.getGameState)().currentYear;
    taxRateChangedThisYear.set(factionId, currentYear);
    // 记录操作
    (0, storage_1.addOperationRecord)({
        userId: factionId,
        userType: 'player',
        factionId: factionId,
        action: '更改税率',
        details: {
            oldTaxRate,
            newTaxRate,
            year: currentYear,
        },
    });
    return {
        success: true,
        newTaxRate,
    };
}
/**
 * 重置税率更改状态（年度结算时调用）
 */
function resetTaxRateChangeStatus() {
    taxRateChangedThisYear.clear();
}
//# sourceMappingURL=tax-rate.js.map