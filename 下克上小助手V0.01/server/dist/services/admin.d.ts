/**
 * 管理员数据管理服务
 * Requirements: 8.1-8.5
 */
import { Territory, SpecialProduct, Legion, FactionData } from '../types';
/**
 * 郡国搜索筛选参数
 */
export interface TerritorySearchParams {
    provinceName?: string;
    districtName?: string;
    factionId?: string;
    hasSpecialProduct?: boolean;
    minKokudaka?: number;
    maxKokudaka?: number;
}
/**
 * 获取所有郡国数据
 */
export declare function getAllTerritories(): Territory[];
/**
 * 搜索筛选郡国数据
 */
export declare function searchTerritories(params: TerritorySearchParams): Territory[];
/**
 * 获取单个郡国数据
 */
export declare function getTerritoryById(id: string): Territory | undefined;
/**
 * 创建郡国
 */
export declare function createTerritory(data: Omit<Territory, 'id'>): {
    success: boolean;
    territory?: Territory;
    error?: string;
};
/**
 * 更新郡国数据
 */
export declare function updateTerritory(id: string, data: Partial<Territory>): {
    success: boolean;
    territory?: Territory;
    error?: string;
};
/**
 * 删除郡国
 */
export declare function deleteTerritory(id: string): {
    success: boolean;
    error?: string;
};
/**
 * 势力代码管理数据
 */
export interface FactionCodeInfo {
    id: string;
    name: string;
    lordName: string;
    code: string;
}
/**
 * 获取所有势力代码信息
 */
export declare function getAllFactionCodes(): FactionCodeInfo[];
/**
 * 势力完整信息
 */
export interface FactionFullInfo {
    id: string;
    name: string;
    lordName: string;
    code: string;
    taxRate: number;
    treasury: number;
    idleSoldiers: number;
    rifles: number;
    horses: number;
    cannons: number;
    agriculturePoints: number;
    commercePoints: number;
    navyPoints: number;
    armamentPoints: number;
    industryKokudaka: number;
    samuraiCount: number;
    surfaceKokudaka: number;
    totalSoldiers: number;
    buffs: {
        name: string;
        effect: string;
    }[];
}
/**
 * 获取所有势力完整信息
 */
export declare function getAllFactionsFull(): FactionFullInfo[];
/**
 * 更新势力代码
 */
export declare function updateFactionCodeAdmin(factionId: string, newCode: string): {
    success: boolean;
    error?: string;
};
/**
 * 创建新势力
 */
export declare function createFaction(data: {
    name: string;
    lordName: string;
    code: string;
    taxRate?: number;
}): {
    success: boolean;
    faction?: FactionData;
    error?: string;
};
/**
 * 更新势力基础信息
 */
export declare function updateFactionInfo(factionId: string, data: {
    name?: string;
    lordName?: string;
    taxRate?: number;
    treasury?: number;
    idleSoldiers?: number;
    rifles?: number;
    horses?: number;
    cannons?: number;
    agriculturePoints?: number;
    commercePoints?: number;
    navyPoints?: number;
    armamentPoints?: number;
    industryKokudaka?: number;
}): {
    success: boolean;
    faction?: FactionData;
    error?: string;
};
/**
 * 删除势力
 */
export declare function deleteFaction(factionId: string): {
    success: boolean;
    error?: string;
};
/**
 * 军团一览数据
 */
export interface LegionOverviewItem {
    id: string;
    name: string;
    factionId: string;
    factionName: string;
    commanderId: string;
    commanderName: string;
    soldierCount: number;
    rifles: number;
    horses: number;
    cannons: number;
    locationId: string;
    locationName: string;
}
/**
 * 获取所有军团一览
 */
export declare function getAllLegionsOverview(): LegionOverviewItem[];
/**
 * 管理员编辑军团
 */
export declare function adminUpdateLegion(legionId: string, data: {
    name?: string;
    commanderId?: string;
    soldierCount?: number;
    rifles?: number;
    horses?: number;
    cannons?: number;
    locationId?: string;
}): {
    success: boolean;
    legion?: Legion;
    error?: string;
};
/**
 * 管理员删除军团
 */
export declare function adminDeleteLegion(legionId: string): {
    success: boolean;
    error?: string;
};
/**
 * 获取所有特产
 */
export declare function getAllSpecialProducts(): SpecialProduct[];
/**
 * 获取单个特产
 */
export declare function getSpecialProductByName(name: string): SpecialProduct | undefined;
/**
 * 创建特产
 */
export declare function createSpecialProduct(data: SpecialProduct): {
    success: boolean;
    product?: SpecialProduct;
    error?: string;
};
/**
 * 更新特产
 */
export declare function updateSpecialProduct(name: string, data: Partial<SpecialProduct>): {
    success: boolean;
    product?: SpecialProduct;
    error?: string;
};
/**
 * 删除特产
 */
export declare function deleteSpecialProduct(name: string): {
    success: boolean;
    error?: string;
};
/**
 * 获取势力简要信息列表（用于下拉选择）
 */
export declare function getFactionOptions(): {
    id: string;
    name: string;
}[];
/**
 * 获取领地简要信息列表（用于下拉选择）
 */
export declare function getTerritoryOptions(): {
    id: string;
    name: string;
    provinceName: string;
}[];
import { Samurai } from '../types';
/**
 * 获取势力的所有武士
 */
export declare function getFactionSamurais(factionId: string): Samurai[];
/**
 * 创建武士
 */
export declare function createSamurai(data: {
    name: string;
    age?: number;
    type: 'warrior' | 'strategist';
    martialValue: number;
    civilValue: number;
    factionId: string;
}): {
    success: boolean;
    samurai?: Samurai;
    error?: string;
};
/**
 * 更新武士
 */
export declare function updateSamurai(samuraiId: string, data: {
    name?: string;
    age?: number;
    type?: 'warrior' | 'strategist';
    martialValue?: number;
    civilValue?: number;
    factionId?: string;
}): {
    success: boolean;
    samurai?: Samurai;
    error?: string;
};
/**
 * 删除武士
 */
export declare function deleteSamurai(samuraiId: string): {
    success: boolean;
    error?: string;
};
//# sourceMappingURL=admin.d.ts.map