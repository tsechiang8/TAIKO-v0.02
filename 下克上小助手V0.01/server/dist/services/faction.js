"use strict";
/**
 * 势力数据服务
 * 提供势力数据的获取、更新等功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFactionDashboard = getFactionDashboard;
exports.getAllFactionsList = getAllFactionsList;
exports.updateFactionCode = updateFactionCode;
exports.getFactionBasicInfo = getFactionBasicInfo;
exports.factionExists = factionExists;
const storage_1 = require("../storage");
const calculation_1 = require("../calculation");
/**
 * 获取势力完整仪表盘数据
 * @param factionId 势力ID
 * @returns 势力仪表盘数据或null
 */
function getFactionDashboard(factionId) {
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return null;
    }
    // 获取关联数据
    const allTerritories = (0, storage_1.getTerritories)();
    const allSamurais = (0, storage_1.getSamurais)();
    const allLegions = (0, storage_1.getLegions)();
    const specialProducts = (0, storage_1.getSpecialProducts)();
    // 筛选该势力的数据
    const territories = allTerritories.filter(t => t.factionId === factionId);
    const samurais = allSamurais.filter(s => s.factionId === factionId);
    const legions = allLegions.filter(l => l.factionId === factionId);
    // 计算势力数据
    const calculation = (0, calculation_1.calculateFactionData)(faction, territories, allTerritories, legions, samurais, specialProducts);
    // 构建仪表盘数据
    return {
        // 基础信息
        id: faction.id,
        name: faction.name,
        lordName: faction.lordName,
        taxRate: faction.taxRate,
        treasury: faction.treasury,
        // 计算属性
        surfaceKokudaka: calculation.surfaceKokudaka,
        income: calculation.income,
        armyLevel: calculation.armamentLevel.name,
        armyLevelNumber: calculation.armamentLevel.level,
        // 武库数据（库存）
        rifles: faction.rifles,
        horses: faction.horses,
        cannons: faction.cannons,
        // 士兵数据
        totalSoldiers: calculation.totalSoldiers,
        idleSoldiers: faction.idleSoldiers,
        maxRecruitableSoldiers: calculation.maxRecruitableSoldiers,
        legionSoldiers: calculation.legionSoldiers,
        soldierMaintenanceRatio: calculation.soldierMaintenanceRatio,
        // 投资点数
        agriculturePoints: faction.agriculturePoints,
        commercePoints: faction.commercePoints,
        navyPoints: faction.navyPoints,
        armamentPoints: faction.armamentPoints,
        // 增益列表（最多10个）
        buffs: faction.buffs.slice(0, 10),
        // 详细计算数据
        territoryKokudaka: calculation.territoryKokudaka,
        specialProductKokudaka: calculation.specialProductKokudaka,
        integrationBonus: calculation.integrationBonus,
        industryKokudaka: faction.industryKokudaka,
        bonusCoefficient: calculation.bonusCoefficient,
        growthRate: calculation.growthRate,
        // 维护费明细
        maintenanceCost: calculation.maintenanceCost,
        // 关联数据
        territories,
        samurais,
        legions,
        diplomacy: faction.diplomacy,
    };
}
/**
 * 获取所有势力列表（管理员用）
 * @returns 势力列表
 */
function getAllFactionsList() {
    const factions = (0, storage_1.getFactions)();
    const allTerritories = (0, storage_1.getTerritories)();
    const allLegions = (0, storage_1.getLegions)();
    const allSamurais = (0, storage_1.getSamurais)();
    const specialProducts = (0, storage_1.getSpecialProducts)();
    return factions.map(faction => {
        const territories = allTerritories.filter(t => t.factionId === faction.id);
        const legions = allLegions.filter(l => l.factionId === faction.id);
        const samurais = allSamurais.filter(s => s.factionId === faction.id);
        const calculation = (0, calculation_1.calculateFactionData)(faction, territories, allTerritories, legions, samurais, specialProducts);
        return {
            id: faction.id,
            name: faction.name,
            lordName: faction.lordName,
            code: faction.code,
            taxRate: faction.taxRate,
            surfaceKokudaka: calculation.surfaceKokudaka,
            totalSoldiers: calculation.totalSoldiers,
        };
    });
}
/**
 * 更新势力代码
 * @param factionId 势力ID
 * @param newCode 新代码
 * @returns 是否成功
 */
function updateFactionCode(factionId, newCode) {
    if (!newCode || newCode.trim() === '') {
        return { success: false, error: '代码不能为空' };
    }
    const trimmedCode = newCode.trim();
    const factions = (0, storage_1.getFactions)();
    // 检查代码是否已被使用
    const existingFaction = factions.find(f => f.code === trimmedCode && f.id !== factionId);
    if (existingFaction) {
        return { success: false, error: '该代码已被其他势力使用' };
    }
    // 查找并更新势力
    const factionIndex = factions.findIndex(f => f.id === factionId);
    if (factionIndex === -1) {
        return { success: false, error: '势力不存在' };
    }
    factions[factionIndex].code = trimmedCode;
    (0, storage_1.saveFactions)(factions);
    return { success: true };
}
/**
 * 获取势力基础信息（用于验证等场景）
 * @param factionId 势力ID
 * @returns 势力基础信息或null
 */
function getFactionBasicInfo(factionId) {
    const faction = (0, storage_1.getFactionById)(factionId);
    if (!faction) {
        return null;
    }
    return {
        id: faction.id,
        name: faction.name,
        lordName: faction.lordName,
    };
}
/**
 * 检查势力是否存在
 * @param factionId 势力ID
 * @returns 是否存在
 */
function factionExists(factionId) {
    return (0, storage_1.getFactionById)(factionId) !== undefined;
}
//# sourceMappingURL=faction.js.map