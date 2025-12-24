/**
 * 核心计算引擎
 * 实现下克上小助手的所有数值计算逻辑
 */
import { FactionData, Territory, Legion, Samurai, SpecialProduct } from '../types';
export declare const MAINTENANCE_RATIO_EFFECTS: readonly [{
    readonly min: 0;
    readonly max: 0.2;
    readonly bonusCoefficient: 0.12;
    readonly growthRate: 0.03;
}, {
    readonly min: 0.21;
    readonly max: 0.45;
    readonly bonusCoefficient: 0.06;
    readonly growthRate: 0.01;
}, {
    readonly min: 0.46;
    readonly max: 0.6;
    readonly bonusCoefficient: 0;
    readonly growthRate: -0.01;
}, {
    readonly min: 0.61;
    readonly max: 0.8;
    readonly bonusCoefficient: -0.1;
    readonly growthRate: -0.02;
}, {
    readonly min: 0.81;
    readonly max: 0.94;
    readonly bonusCoefficient: -0.2;
    readonly growthRate: -0.04;
}, {
    readonly min: 0.95;
    readonly max: 1;
    readonly bonusCoefficient: -0.3;
    readonly growthRate: -0.08;
}, {
    readonly min: 1.01;
    readonly max: number;
    readonly bonusCoefficient: -0.4;
    readonly growthRate: -0.12;
}];
export declare const ARMAMENT_LEVELS: readonly [{
    readonly level: 0;
    readonly name: "朽坏";
    readonly minPoints: 0;
    readonly maxPoints: 0;
    readonly maintenanceModifier: 0.2;
}, {
    readonly level: 1;
    readonly name: "普通";
    readonly minPoints: 1;
    readonly maxPoints: 15;
    readonly maintenanceModifier: 0;
}, {
    readonly level: 2;
    readonly name: "整修";
    readonly minPoints: 16;
    readonly maxPoints: 30;
    readonly maintenanceModifier: -0.05;
}, {
    readonly level: 3;
    readonly name: "精良";
    readonly minPoints: 31;
    readonly maxPoints: 50;
    readonly maintenanceModifier: -0.1;
}, {
    readonly level: 4;
    readonly name: "军械";
    readonly minPoints: 51;
    readonly maxPoints: 70;
    readonly maintenanceModifier: -0.2;
}, {
    readonly level: 5;
    readonly name: "严整";
    readonly minPoints: 71;
    readonly maxPoints: 85;
    readonly maintenanceModifier: -0.3;
}, {
    readonly level: 6;
    readonly name: "兵法";
    readonly minPoints: 86;
    readonly maxPoints: 99;
    readonly maintenanceModifier: -0.4;
}, {
    readonly level: 7;
    readonly name: "武库";
    readonly minPoints: 100;
    readonly maxPoints: 100;
    readonly maintenanceModifier: -0.5;
}];
export declare const TAX_RATE_SOLDIER_MULTIPLIERS: Record<number, number>;
/**
 * 计算领地石高汇总
 * @param territories 势力拥有的所有领地
 * @returns 领地石高总和
 */
export declare function calculateTerritoryKokudaka(territories: Territory[]): number;
/**
 * 计算特产石高
 * @param territories 势力拥有的所有领地
 * @param specialProducts 特产配置表
 * @returns 特产石高总和
 */
export declare function calculateSpecialProductKokudaka(territories: Territory[], specialProducts: SpecialProduct[]): number;
/**
 * 计算特产带来的士兵上限加成
 * @param territories 势力拥有的所有领地
 * @param specialProducts 特产配置表
 * @returns 士兵上限加成总和
 */
export declare function calculateSpecialProductSoldierBonus(territories: Territory[], specialProducts: SpecialProduct[]): number;
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
export declare function calculateIntegrationBonus(territories: Territory[], allTerritories: Territory[]): number;
/**
 * 计算士兵维持比
 * @param totalSoldiers 总士兵数（闲置 + 军团在编）
 * @param maxRecruitableSoldiers 可招募士兵上限
 * @returns 士兵维持比（可以超过1）
 */
export declare function calculateSoldierMaintenanceRatio(totalSoldiers: number, maxRecruitableSoldiers: number): number;
/**
 * 根据士兵维持比获取加成系数
 * @param maintenanceRatio 士兵维持比
 * @returns 加成系数
 */
export declare function getBonusCoefficient(maintenanceRatio: number): number;
/**
 * 根据士兵维持比获取自然增长率
 * @param maintenanceRatio 士兵维持比
 * @returns 自然增长率
 */
export declare function getGrowthRate(maintenanceRatio: number): number;
/**
 * 计算表面石高
 * 公式：领地石高 × (1 + 加成系数) + 特产石高 + 领内财产 + 产业石高
 * @param params 计算参数
 * @returns 表面石高
 */
export declare function calculateSurfaceKokudaka(params: {
    territoryKokudaka: number;
    bonusCoefficient: number;
    specialProductKokudaka: number;
    integrationBonus: number;
    industryKokudaka: number;
}): number;
/**
 * 计算收入
 * 公式：表面石高 × 税率 × 0.4
 * @param surfaceKokudaka 表面石高
 * @param taxRate 税率（0.4, 0.6, 0.8）
 * @returns 收入
 */
export declare function calculateIncome(surfaceKokudaka: number, taxRate: number): number;
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
export declare function calculateMaxRecruitableSoldiers(territoryKokudaka: number, taxRate: number, specialProductSoldierBonus?: number): number;
/**
 * 获取武备等级信息
 * @param armamentPoints 武备点数
 * @returns 武备等级信息
 */
export declare function getArmamentLevel(armamentPoints: number): typeof ARMAMENT_LEVELS[number];
/**
 * 维护费计算结果
 */
export interface MaintenanceCost {
    infantryCost: number;
    horseCost: number;
    rifleCost: number;
    cannonCost: number;
    legionExtraCost: number;
    samuraiSalary: number;
    subtotal: number;
    armamentModifier: number;
    total: number;
}
/**
 * 计算年度维护费
 * @param params 计算参数
 * @returns 维护费详情
 */
export declare function calculateMaintenanceCost(params: {
    totalSoldiers: number;
    legionSoldiers: number;
    horses: number;
    rifles: number;
    cannons: number;
    samuraiCount: number;
    armamentPoints: number;
}): MaintenanceCost;
/**
 * 计算势力的总士兵数
 * @param faction 势力数据
 * @param legions 势力的军团列表
 * @returns 总士兵数
 */
export declare function calculateTotalSoldiers(faction: FactionData, legions: Legion[]): number;
/**
 * 计算军团在编士兵总数
 * @param legions 军团列表
 * @returns 军团士兵总数
 */
export declare function calculateLegionSoldiers(legions: Legion[]): number;
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
export declare function calculateFactionData(faction: FactionData, territories: Territory[], allTerritories: Territory[], legions: Legion[], samurais: Samurai[], specialProducts: SpecialProduct[]): FactionCalculationResult;
//# sourceMappingURL=index.d.ts.map