/**
 * 核心计算引擎
 * 实现下克上小助手的所有数值计算逻辑
 */

import { FactionData, Territory, Legion, Samurai, SpecialProduct } from '../types';

// 士兵维持比区间效果表
export const MAINTENANCE_RATIO_EFFECTS = [
  { min: 0, max: 0.20, bonusCoefficient: 0.12, growthRate: 0.03 },
  { min: 0.21, max: 0.45, bonusCoefficient: 0.06, growthRate: 0.01 },
  { min: 0.46, max: 0.60, bonusCoefficient: 0, growthRate: -0.01 },
  { min: 0.61, max: 0.80, bonusCoefficient: -0.10, growthRate: -0.02 },
  { min: 0.81, max: 0.94, bonusCoefficient: -0.20, growthRate: -0.04 },
  { min: 0.95, max: 1.00, bonusCoefficient: -0.30, growthRate: -0.08 },
  { min: 1.01, max: Infinity, bonusCoefficient: -0.40, growthRate: -0.12 },
] as const;

// 武备等级表
export const ARMAMENT_LEVELS = [
  { level: 0, name: '朽坏', minPoints: 0, maxPoints: 0, maintenanceModifier: 0.20 },
  { level: 1, name: '普通', minPoints: 1, maxPoints: 15, maintenanceModifier: 0 },
  { level: 2, name: '整修', minPoints: 16, maxPoints: 30, maintenanceModifier: -0.05 },
  { level: 3, name: '精良', minPoints: 31, maxPoints: 50, maintenanceModifier: -0.10 },
  { level: 4, name: '军械', minPoints: 51, maxPoints: 70, maintenanceModifier: -0.20 },
  { level: 5, name: '严整', minPoints: 71, maxPoints: 85, maintenanceModifier: -0.30 },
  { level: 6, name: '兵法', minPoints: 86, maxPoints: 99, maintenanceModifier: -0.40 },
  { level: 7, name: '武库', minPoints: 100, maxPoints: 100, maintenanceModifier: -0.50 },
] as const;

// 税率对应的士兵上限系数
export const TAX_RATE_SOLDIER_MULTIPLIERS: Record<number, number> = {
  0.4: 230,
  0.6: 200,
  0.8: 180,
};

/**
 * 计算领地石高汇总
 * @param territories 势力拥有的所有领地
 * @returns 领地石高总和
 */
export function calculateTerritoryKokudaka(territories: Territory[]): number {
  return territories.reduce((sum, t) => sum + t.baseKokudaka, 0);
}

/**
 * 计算特产石高
 * @param territories 势力拥有的所有领地
 * @param specialProducts 特产配置表
 * @returns 特产石高总和
 */
export function calculateSpecialProductKokudaka(
  territories: Territory[],
  specialProducts: SpecialProduct[]
): number {
  const productMap = new Map(specialProducts.map(p => [p.name, p]));
  let total = 0;

  for (const territory of territories) {
    const products = [
      territory.specialProduct1,
      territory.specialProduct2,
      territory.specialProduct3,
    ].filter((p): p is string => !!p);

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
export function calculateSpecialProductSoldierBonus(
  territories: Territory[],
  specialProducts: SpecialProduct[]
): number {
  const productMap = new Map(specialProducts.map(p => [p.name, p]));
  let total = 0;

  for (const territory of territories) {
    const products = [
      territory.specialProduct1,
      territory.specialProduct2,
      territory.specialProduct3,
    ].filter((p): p is string => !!p);

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
export function calculateIntegrationBonus(
  territories: Territory[],
  allTerritories: Territory[]
): number {
  // 按令制国分组统计势力领地数
  const factionProvinces = new Map<string, number>();
  for (const t of territories) {
    factionProvinces.set(t.provinceName, (factionProvinces.get(t.provinceName) || 0) + 1);
  }

  // 按令制国分组统计总领地数和总石高
  const provinceStats = new Map<string, { count: number; totalKokudaka: number }>();
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
    if (!stats) continue;

    // 检查是否完全占领
    if (factionCount === stats.count && stats.count > 0) {
      // 根据令制国总石高决定奖励
      // 注意：这里使用的是令制国的总石高（所有郡的基础石高之和）
      // 如果有 provinceTotalKokudaka 字段则使用它，否则使用累加值
      const provinceKokudaka = stats.totalKokudaka;
      
      if (provinceKokudaka >= 300000) {
        // ≥30万石：+2万石
        bonus += 20000;
      } else if (provinceKokudaka >= 150000) {
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
export function calculateSoldierMaintenanceRatio(
  totalSoldiers: number,
  maxRecruitableSoldiers: number
): number {
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
export function getBonusCoefficient(maintenanceRatio: number): number {
  const ratio = Math.max(0, Math.min(1, maintenanceRatio));
  
  for (const effect of MAINTENANCE_RATIO_EFFECTS) {
    if (ratio >= effect.min && ratio <= effect.max) {
      return effect.bonusCoefficient;
    }
  }
  
  // 默认返回最后一个区间的值
  return MAINTENANCE_RATIO_EFFECTS[MAINTENANCE_RATIO_EFFECTS.length - 1].bonusCoefficient;
}

/**
 * 根据士兵维持比获取自然增长率
 * @param maintenanceRatio 士兵维持比
 * @returns 自然增长率
 */
export function getGrowthRate(maintenanceRatio: number): number {
  const ratio = Math.max(0, Math.min(1, maintenanceRatio));
  
  for (const effect of MAINTENANCE_RATIO_EFFECTS) {
    if (ratio >= effect.min && ratio <= effect.max) {
      return effect.growthRate;
    }
  }
  
  return MAINTENANCE_RATIO_EFFECTS[MAINTENANCE_RATIO_EFFECTS.length - 1].growthRate;
}

/**
 * 计算表面石高
 * 公式：领地石高 × (1 + 加成系数) + 特产石高 + 领内财产 + 产业石高
 * @param params 计算参数
 * @returns 表面石高
 */
export function calculateSurfaceKokudaka(params: {
  territoryKokudaka: number;
  bonusCoefficient: number;
  specialProductKokudaka: number;
  integrationBonus: number;
  industryKokudaka: number;
}): number {
  const {
    territoryKokudaka,
    bonusCoefficient,
    specialProductKokudaka,
    integrationBonus,
    industryKokudaka,
  } = params;

  return (
    territoryKokudaka * (1 + bonusCoefficient) +
    specialProductKokudaka +
    integrationBonus +
    industryKokudaka
  );
}


/**
 * 计算收入
 * 公式：表面石高 × 税率 × 0.4
 * @param surfaceKokudaka 表面石高
 * @param taxRate 税率（0.4, 0.6, 0.8）
 * @returns 收入
 */
export function calculateIncome(surfaceKokudaka: number, taxRate: number): number {
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
export function calculateMaxRecruitableSoldiers(
  territoryKokudaka: number,
  taxRate: number,
  specialProductSoldierBonus: number = 0
): number {
  const multiplier = TAX_RATE_SOLDIER_MULTIPLIERS[taxRate];
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
export function getArmamentLevel(armamentPoints: number): typeof ARMAMENT_LEVELS[number] {
  for (const level of ARMAMENT_LEVELS) {
    if (armamentPoints >= level.minPoints && armamentPoints <= level.maxPoints) {
      return level;
    }
  }
  // 默认返回普通等级
  return ARMAMENT_LEVELS[1];
}

/**
 * 维护费计算结果
 */
export interface MaintenanceCost {
  infantryCost: number;      // 步卒维护费
  horseCost: number;         // 战马维护费
  rifleCost: number;         // 铁炮维护费
  cannonCost: number;        // 大筒维护费
  legionExtraCost: number;   // 军团额外费用
  samuraiSalary: number;     // 武士俸禄
  subtotal: number;          // 小计（修正前）
  armamentModifier: number;  // 武备等级修正系数
  total: number;             // 总维护费（修正后）
}

// 维护费单价常量
const MAINTENANCE_COSTS = {
  INFANTRY_PER_SOLDIER: 4,      // 步卒 4石/人/年
  HORSE_PER_UNIT: 12,           // 战马 12石/匹/年
  RIFLE_PER_UNIT: 3,            // 铁炮 3石/挺/年
  CANNON_PER_UNIT: 8,           // 大筒 8石/门/年 (购买价450石/门)
  LEGION_EXTRA_PER_SOLDIER: 4,  // 军团士兵额外 4石/人/年
  SAMURAI_SALARY: 2000,         // 武士俸禄 2000石/人/年
};

/**
 * 计算年度维护费
 * @param params 计算参数
 * @returns 维护费详情
 */
export function calculateMaintenanceCost(params: {
  totalSoldiers: number;       // 总士兵数（闲置 + 军团）
  legionSoldiers: number;      // 军团在编士兵数
  horses: number;              // 战马总数
  rifles: number;              // 铁炮总数
  cannons: number;             // 大筒总数
  samuraiCount: number;        // 武士数量
  armamentPoints: number;      // 武备点数
}): MaintenanceCost {
  const {
    totalSoldiers,
    legionSoldiers,
    horses,
    rifles,
    cannons,
    samuraiCount,
    armamentPoints,
  } = params;

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
export function calculateTotalSoldiers(
  faction: FactionData,
  legions: Legion[]
): number {
  const legionSoldiers = legions.reduce((sum, l) => sum + l.soldierCount, 0);
  return faction.idleSoldiers + legionSoldiers;
}

/**
 * 计算军团在编士兵总数
 * @param legions 军团列表
 * @returns 军团士兵总数
 */
export function calculateLegionSoldiers(legions: Legion[]): number {
  return legions.reduce((sum, l) => sum + l.soldierCount, 0);
}

/**
 * 完整的势力数据计算
 * 汇总计算势力的所有关键数值
 */
export interface FactionCalculationResult {
  territoryKokudaka: number;
  specialProductKokudaka: number;
  integrationBonus: number;
  bonusCoefficient: number;
  growthRate: number;
  surfaceKokudaka: number;
  income: number;
  maxRecruitableSoldiers: number;
  totalSoldiers: number;
  legionSoldiers: number;
  soldierMaintenanceRatio: number;
  maintenanceCost: MaintenanceCost;
  armamentLevel: typeof ARMAMENT_LEVELS[number];
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
export function calculateFactionData(
  faction: FactionData,
  territories: Territory[],
  allTerritories: Territory[],
  legions: Legion[],
  samurais: Samurai[],
  specialProducts: SpecialProduct[]
): FactionCalculationResult {
  // 基础石高计算
  const territoryKokudaka = calculateTerritoryKokudaka(territories);
  const specialProductKokudaka = calculateSpecialProductKokudaka(territories, specialProducts);
  const integrationBonus = calculateIntegrationBonus(territories, allTerritories);

  // 特产士兵加成
  const specialProductSoldierBonus = calculateSpecialProductSoldierBonus(territories, specialProducts);

  // 士兵相关计算（包含特产士兵加成）
  const maxRecruitableSoldiers = calculateMaxRecruitableSoldiers(
    territoryKokudaka, 
    faction.taxRate,
    specialProductSoldierBonus
  );
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
