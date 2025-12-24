/**
 * 势力数据服务
 * 提供势力数据的获取、更新等功能
 */
import { Territory, Samurai, Legion, Buff, DiplomacyRelation } from '../types';
/**
 * 完整的势力仪表盘数据
 */
export interface FactionDashboardData {
    id: string;
    name: string;
    lordName: string;
    taxRate: number;
    treasury: number;
    surfaceKokudaka: number;
    income: number;
    armyLevel: string;
    armyLevelNumber: number;
    rifles: number;
    horses: number;
    cannons: number;
    totalSoldiers: number;
    idleSoldiers: number;
    maxRecruitableSoldiers: number;
    legionSoldiers: number;
    soldierMaintenanceRatio: number;
    agriculturePoints: number;
    commercePoints: number;
    navyPoints: number;
    armamentPoints: number;
    buffs: Buff[];
    territoryKokudaka: number;
    specialProductKokudaka: number;
    integrationBonus: number;
    industryKokudaka: number;
    bonusCoefficient: number;
    growthRate: number;
    maintenanceCost: {
        infantryCost: number;
        horseCost: number;
        rifleCost: number;
        cannonCost: number;
        legionExtraCost: number;
        samuraiSalary: number;
        subtotal: number;
        armamentModifier: number;
        total: number;
    };
    territories: Territory[];
    samurais: Samurai[];
    legions: Legion[];
    diplomacy: DiplomacyRelation[];
}
/**
 * 势力列表项（管理员用）
 */
export interface FactionListItem {
    id: string;
    name: string;
    lordName: string;
    code: string;
    taxRate: number;
    surfaceKokudaka: number;
    totalSoldiers: number;
}
/**
 * 获取势力完整仪表盘数据
 * @param factionId 势力ID
 * @returns 势力仪表盘数据或null
 */
export declare function getFactionDashboard(factionId: string): FactionDashboardData | null;
/**
 * 获取所有势力列表（管理员用）
 * @returns 势力列表
 */
export declare function getAllFactionsList(): FactionListItem[];
/**
 * 更新势力代码
 * @param factionId 势力ID
 * @param newCode 新代码
 * @returns 是否成功
 */
export declare function updateFactionCode(factionId: string, newCode: string): {
    success: boolean;
    error?: string;
};
/**
 * 获取势力基础信息（用于验证等场景）
 * @param factionId 势力ID
 * @returns 势力基础信息或null
 */
export declare function getFactionBasicInfo(factionId: string): {
    id: string;
    name: string;
    lordName: string;
} | null;
/**
 * 检查势力是否存在
 * @param factionId 势力ID
 * @returns 是否存在
 */
export declare function factionExists(factionId: string): boolean;
//# sourceMappingURL=faction.d.ts.map