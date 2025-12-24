"use strict";
/**
 * 核心计算引擎
 * 实现下克上小助手的所有数值计算逻辑
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TAX_RATE_SOLDIER_MULTIPLIERS = exports.ARMAMENT_LEVELS = exports.MAINTENANCE_RATIO_EFFECTS = void 0;
exports.calculateTerritoryKokudaka = calculateTerritoryKokudaka;
exports.calculateSpecialProductKokudaka = calculateSpecialProductKokudaka;
exports.calculateSpecialProductSoldierBonus = calculateSpecialProductSoldierBonus;
exports.calculateIntegrationBonus = calculateIntegrationBonus;
exports.calculateSoldierMaintenanceRatio = calculateSoldierMaintenanceRatio;
exports.getBonusCoefficient = getBonusCoefficient;
exports.getGrowthRate = getGrowthRate;
exports.calculateSurfaceKokudaka = calculateSurfaceKokudaka;
exports.calculateIncome = calculateIncome;
exports.calculateMaxRecruitableSoldiers = calculateMaxRecruitableSoldiers;
exports.getArmamentLevel = getArmamentLevel;
exports.calculateMaintenanceCost = calculateMaintenanceCost;
exports.calculateTotalSoldiers = calculateTotalSoldiers;
exports.calculateLegionSoldiers = calculateLegionSoldiers;
exports.calculateFactionData = calculateFactionData;
// 士兵维持比区间效果表
exports.MAINTENANCE_RATIO_EFFECTS = [
    { min: 0, max: 0.20, bonusCoefficient: 0.12, growthRate: 0.03 },
    { min: 0.21, max: 0.45, bonusCoefficient: 0.06, growthRate: 0.01 },
    { min: 0.46, max: 0.60, bonusCoefficient: 0, growthRate: -0.01 },
    { min: 0.61, max: 0.80, bonusCoefficient: -0.10, growthRate: -0.02 },
    { min: 0.81, max: 0.94, bonusCoefficient: -0.20, growthRate: -0.04 },
    { min: 0.95, max: 1.00, bonusCoefficient: -0.30, growthRate: -0.08 },
    { min: 1.01, max: Infinity, bonusCoefficient: -0.40, growthRate: -0.12 },
];
// 武备等级表
exports.ARMAMENT_LEVELS = [
    { level: 0, name: '朽坏', minPoints: 0, maxPoints: 0, maintenanceModifier: 0.20 },
    { level: 1, name: '普通', minPoints: 1, maxPoints: 15, maintenanceModifier: 0 },
    { level: 2, name: '整修', minPoints: 16, maxPoints: 30, maintenanceModifier: -0.05 },
    { level: 3, name: '精良', minPoints: 31, maxPoints: 50, maintenanceModifier: -0.10 },
    { level: 4, name: '军械', minPoints: 51, maxPoints: 70, maintenanceModifier: -0.20 },
    { level: 5, name: '严整', minPoints: 71, maxPoints: 85, maintenanceModifier: -0.30 },
    { level: 6, name: '兵法', minPoints: 86, maxPoints: 99, maintenanceModifier: -0.40 },
    { level: 7, name: '武库', minPoints: 100, maxPoints: 100, maintenanceModifier: -0.50 },
];
// 税率对应的士兵上限系数
exports.TAX_RATE_SOLDIER_MULTIPLIERS = {
    0.4: 230,
    0.6: 200,
    0.8: 180,
};
/**
 * 计算领地石高汇总
 * @param territories 势力拥有的所有领地
 * @returns 领地石高总和
 */
function calculateTerritoryKokudaka(territories) {
    return territories.reduce((sum, t) => sum + t.baseKokudaka, 0);
}
/**
 * 计算特产石高
 * @param territories 势力拥有的所有领地
 * @param specialProducts 特产配置表
 * @returns 特产石高总和
 */
function calculateSpecialProductKokudaka(territories, specialProducts) {
    const productMap = new Map(specialProducts.map(p => [p.name, p]));
    let total = 0;
    for (const territory of territories) {
        const products = [
            territory.specialProduct1,
            territory.specialProduct2,
            territory.specialProduct3,
        ].filter((p) => !!p);
        for (const productName of products) {
            const product = productMap.get(productName);
            if (product) {
                total += product.annualKokudaka;
            }
        }
    }
    return total;
}
/**
 * 计算特产带来的士兵上限加成
 * @param territories 势力拥有的所有领地
 * @param specialProducts 特产配置表
 * @returns 士兵上限加成总和
 */
function calculateSpecialProductSoldierBonus(territories, specialProducts) {
    const productMap = new Map(specialProducts.map(p => [p.name, p]));
    let total = 0;
    for (const territory of territories) {
        const products = [
            territory.specialProduct1,
            territory.specialProduct2,
            territory.specialProduct3,
        ].filter((p) => !!p);
        for (const productName of products) {
            const product = productMap.get(productName);
            if (product) {
                total += product.soldierCapacityBonus;
            }
        }
    }
    return total;
}
/**
 * 计算领内财产（整合奖励）
 * 当完全占领一个令制国时获得的固定奖励
 * 规则：
 * - 完全占领石高≥30万的领国：+2万石
 * - 完全占领石高15-30万的领国：+1万石
 * - 判断门槛时仅计算郡的基础石高，不包含特产石高
 * @param territories 势力拥有的所有领地
 * @param allTerritories 游戏中所有领地
 * @returns 领内财产总和
 */
function calculateIntegrationBonus(territories, allTerritories) {
    // 按令制国分组统计势力领地数
    const factionProvinces = new Map();
    for (const t of territories) {
        factionProvinces.set(t.provinceName, (factionProvinces.get(t.provinceName) || 0) + 1);
    }
    // 按令制国分组统计总领地数和总石高
    const provinceStats = new Map();
    for (const t of allTerritories) {
        const stats = provinceStats.get(t.provinceName) || { count: 0, totalKokudaka: 0 };
        stats.count += 1;
        // 使用 provinceTotalKokudaka 如果有，否则累加 baseKokudaka
        stats.totalKokudaka += t.provinceTotalKokudaka ?? t.baseKokudaka;
        provinceStats.set(t.provinceName, stats);
    }
    let bonus = 0;
    for (const [province, factionCount] of factionProvinces) {
        const stats = provinceStats.get(province);
        if (!stats)
            continue;
        // 检查是否完全占领
        if (factionCount === stats.count && stats.count > 0) {
            // 根据令制国总石高决定奖励
            // 注意：这里使用的是令制国的总石高（所有郡的基础石高之和）
            // 如果有 provinceTotalKokudaka 字段则使用它，否则使用累加值
            const provinceKokudaka = stats.totalKokudaka;
            if (provinceKokudaka >= 300000) {
                // ≥30万石：+2万石
                bonus += 20000;
            }
            else if (provinceKokudaka >= 150000) {
                // 15-30万石：+1万石
                bonus += 10000;
            }
            // <15万石：无奖励
        }
    }
    return bonus;
}
/**
 * 计算士兵维持比
 * @param totalSoldiers 总士兵数（闲置 + 军团在编）
 * @param maxRecruitableSoldiers 可招募士兵上限
 * @returns 士兵维持比（可以超过1）
 */
function calculateSoldierMaintenanceRatio(totalSoldiers, maxRecruitableSoldiers) {
    if (maxRecruitableSoldiers <= 0) {
        return totalSoldiers > 0 ? 1 : 0;
    }
    return totalSoldiers / maxRecruitableSoldiers;
}
/**
 * 根据士兵维持比获取加成系数
 * @param maintenanceRatio 士兵维持比
 * @returns 加成系数
 */
function getBonusCoefficient(maintenanceRatio) {
    const ratio = Math.max(0, Math.min(1, maintenanceRatio));
    for (const effect of exports.MAINTENANCE_RATIO_EFFECTS) {
        if (ratio >= effect.min && ratio <= effect.max) {
            return effect.bonusCoefficient;
        }
    }
    // 默认返回最后一个区间的值
    return exports.MAINTENANCE_RATIO_EFFECTS[exports.MAINTENANCE_RATIO_EFFECTS.length - 1].bonusCoefficient;
}
/**
 * 根据士兵维持比获取自然增长率
 * @param maintenanceRatio 士兵维持比
 * @returns 自然增长率
 */
function getGrowthRate(maintenanceRatio) {
    const ratio = Math.max(0, Math.min(1, maintenanceRatio));
    for (const effect of exports.MAINTENANCE_RATIO_EFFECTS) {
        if (ratio >= effect.min && ratio <= effect.max) {
            return effect.growthRate;
        }
    }
    return exports.MAINTENANCE_RATIO_EFFECTS[exports.MAINTENANCE_RATIO_EFFECTS.length - 1].growthRate;
}
/**
 * 计算表面石高
 * 公式：领地石高 × (1 + 加成系数) + 特产石高 + 领内财产 + 产业石高
 * @param params 计算参数
 * @returns 表面石高
 */
function calculateSurfaceKokudaka(params) {
    const { territoryKokudaka, bonusCoefficient, specialProductKokudaka, integrationBonus, industryKokudaka, } = params;
    return (territoryKokudaka * (1 + bonusCoefficient) +
        specialProductKokudaka +
        integrationBonus +
        industryKokudaka);
}
/**
 * 计算收入
 * 公式：表面石高 × 税率 × 0.4
 * @param surfaceKokudaka 表面石高
 * @param taxRate 税率（0.4, 0.6, 0.8）
 * @returns 收入
 */
function calculateIncome(surfaceKokudaka, taxRate) {
    return surfaceKokudaka * taxRate * 0.4;
}
/**
 * 计算士兵招募上限
 * 每10000石对应：
 * 税率40%: 230人
 * 税率60%: 200人
 * 税率80%: 180人
 * @param territoryKokudaka 领地石高（以石为单位）
 * @param taxRate 税率
 * @param specialProductSoldierBonus 特产带来的士兵上限加成（可选）
 * @returns 士兵招募上限
 */
function calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate, specialProductSoldierBonus = 0) {
    const multiplier = exports.TAX_RATE_SOLDIER_MULTIPLIERS[taxRate];
    const baseLimit = multiplier !== undefined
        ? Math.floor((territoryKokudaka / 10000) * multiplier)
        : Math.floor((territoryKokudaka / 10000) * 200);
    // 特产士兵加成直接加到上限
    return baseLimit + specialProductSoldierBonus;
}
/**
 * 获取武备等级信息
 * @param armamentPoints 武备点数
 * @returns 武备等级信息
 */
function getArmamentLevel(armamentPoints) {
    for (const level of exports.ARMAMENT_LEVELS) {
        if (armamentPoints >= level.minPoints && armamentPoints <= level.maxPoints) {
            return level;
        }
    }
    // 默认返回普通等级
    return exports.ARMAMENT_LEVELS[1];
}
// 维护费单价常量
const MAINTENANCE_COSTS = {
    INFANTRY_PER_SOLDIER: 4, // 步卒 4石/人/年
    HORSE_PER_UNIT: 12, // 战马 12石/匹/年
    RIFLE_PER_UNIT: 3, // 铁炮 3石/挺/年
    CANNON_PER_UNIT: 8, // 大筒 8石/门/年 (购买价450石/门)
    LEGION_EXTRA_PER_SOLDIER: 4, // 军团士兵额外 4石/人/年
    SAMURAI_SALARY: 2000, // 武士俸禄 2000石/人/年
};
/**
 * 计算年度维护费
 * @param params 计算参数
 * @returns 维护费详情
 */
function calculateMaintenanceCost(params) {
    const { totalSoldiers, legionSoldiers, horses, rifles, cannons, samuraiCount, armamentPoints, } = params;
    // 计算各项基础维护费
    const infantryCost = totalSoldiers * MAINTENANCE_COSTS.INFANTRY_PER_SOLDIER;
    const horseCost = horses * MAINTENANCE_COSTS.HORSE_PER_UNIT;
    const rifleCost = rifles * MAINTENANCE_COSTS.RIFLE_PER_UNIT;
    const cannonCost = cannons * MAINTENANCE_COSTS.CANNON_PER_UNIT;
    const legionExtraCost = legionSoldiers * MAINTENANCE_COSTS.LEGION_EXTRA_PER_SOLDIER;
    const samuraiSalary = samuraiCount * MAINTENANCE_COSTS.SAMURAI_SALARY;
    // 计算小计（武士俸禄不受武备等级影响）
    const militaryCost = infantryCost + horseCost + rifleCost + cannonCost + legionExtraCost;
    // 获取武备等级修正
    const armamentLevel = getArmamentLevel(armamentPoints);
    const armamentModifier = armamentLevel.maintenanceModifier;
    // 应用武备等级修正（仅对军事维护费）
    const adjustedMilitaryCost = militaryCost * (1 + armamentModifier);
    // 总维护费 = 修正后军事维护费 + 武士俸禄
    const total = adjustedMilitaryCost + samuraiSalary;
    return {
        infantryCost,
        horseCost,
        rifleCost,
        cannonCost,
        legionExtraCost,
        samuraiSalary,
        subtotal: militaryCost + samuraiSalary,
        armamentModifier,
        total,
    };
}
/**
 * 计算势力的总士兵数
 * @param faction 势力数据
 * @param legions 势力的军团列表
 * @returns 总士兵数
 */
function calculateTotalSoldiers(faction, legions) {
    const legionSoldiers = legions.reduce((sum, l) => sum + l.soldierCount, 0);
    return faction.idleSoldiers + legionSoldiers;
}
/**
 * 计算军团在编士兵总数
 * @param legions 军团列表
 * @returns 军团士兵总数
 */
function calculateLegionSoldiers(legions) {
    return legions.reduce((sum, l) => sum + l.soldierCount, 0);
}
/**
 * 计算势力的完整数据
 * @param faction 势力数据
 * @param territories 势力拥有的领地
 * @param allTerritories 所有领地
 * @param legions 势力的军团
 * @param samurais 势力的武士
 * @param specialProducts 特产配置
 * @returns 完整计算结果
 */
function calculateFactionData(faction, territories, allTerritories, legions, samurais, specialProducts) {
    // 基础石高计算
    const territoryKokudaka = calculateTerritoryKokudaka(territories);
    const specialProductKokudaka = calculateSpecialProductKokudaka(territories, specialProducts);
    const integrationBonus = calculateIntegrationBonus(territories, allTerritories);
    // 特产士兵加成
    const specialProductSoldierBonus = calculateSpecialProductSoldierBonus(territories, specialProducts);
    // 士兵相关计算（包含特产士兵加成）
    const maxRecruitableSoldiers = calculateMaxRecruitableSoldiers(territoryKokudaka, faction.taxRate, specialProductSoldierBonus);
    const legionSoldiers = calculateLegionSoldiers(legions);
    const totalSoldiers = faction.idleSoldiers + legionSoldiers;
    const soldierMaintenanceRatio = calculateSoldierMaintenanceRatio(totalSoldiers, maxRecruitableSoldiers);
    // 加成系数和增长率
    const bonusCoefficient = getBonusCoefficient(soldierMaintenanceRatio);
    const growthRate = getGrowthRate(soldierMaintenanceRatio);
    // 表面石高和收入
    const surfaceKokudaka = calculateSurfaceKokudaka({
        territoryKokudaka,
        bonusCoefficient,
        specialProductKokudaka,
        integrationBonus,
        industryKokudaka: faction.industryKokudaka,
    });
    const income = calculateIncome(surfaceKokudaka, faction.taxRate);
    // 武备等级
    const armamentLevel = getArmamentLevel(faction.armamentPoints);
    // 计算总装备数（库存 + 军团）
    const totalHorses = faction.horses + legions.reduce((sum, l) => sum + l.horses, 0);
    const totalRifles = faction.rifles + legions.reduce((sum, l) => sum + l.rifles, 0);
    const totalCannons = faction.cannons + legions.reduce((sum, l) => sum + l.cannons, 0);
    // 维护费计算
    const maintenanceCost = calculateMaintenanceCost({
        totalSoldiers,
        legionSoldiers,
        horses: totalHorses,
        rifles: totalRifles,
        cannons: totalCannons,
        samuraiCount: samurais.length,
        armamentPoints: faction.armamentPoints,
    });
    return {
        territoryKokudaka,
        specialProductKokudaka,
        integrationBonus,
        bonusCoefficient,
        growthRate,
        surfaceKokudaka,
        income,
        maxRecruitableSoldiers,
        totalSoldiers,
        legionSoldiers,
        soldierMaintenanceRatio,
        maintenanceCost,
        armamentLevel,
    };
}
//# sourceMappingURL=index.js.map