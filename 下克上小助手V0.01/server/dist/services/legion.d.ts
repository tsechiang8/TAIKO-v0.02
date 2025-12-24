/**
 * 军团管理服务
 * Requirements: 5.1-5.10, 6.1-6.6
 */
import { Legion, Samurai } from '../types';
/**
 * 验证军团名称是否符合规范
 * Requirement 5.2: 军团名称为1-8个简体中文字符
 * @param name 军团名称
 * @returns 验证结果
 */
export declare function validateLegionName(name: string): {
    valid: boolean;
    error?: string;
};
/**
 * 检查将领是否已经指挥其他军团
 * Requirement 5.9, 5.10: 将领唯一性约束
 * @param samuraiId 武士ID
 * @param excludeLegionId 排除的军团ID（用于编辑时）
 * @returns 冲突的军团信息或null
 */
export declare function checkCommanderConflict(samuraiId: string, excludeLegionId?: string): Legion | null;
/**
 * 创建军团请求
 */
export interface CreateLegionRequest {
    factionId: string;
    name: string;
    commanderId: string;
    soldierCount: number;
    rifles: number;
    horses: number;
    cannons: number;
    locationId: string;
}
/**
 * 创建军团结果
 */
export interface CreateLegionResult {
    success: boolean;
    error?: string;
    legion?: Legion;
    conflictLegion?: Legion;
}
/**
 * 创建军团
 * Requirements: 5.1-5.10
 * @param request 创建请求
 * @param forceReassign 是否强制重新分配将领（处理冲突）
 * @returns 创建结果
 */
export declare function createLegion(request: CreateLegionRequest, forceReassign?: boolean): CreateLegionResult;
/**
 * 解散军团结果
 */
export interface DisbandLegionResult {
    success: boolean;
    error?: string;
    returnedResources?: {
        soldiers: number;
        rifles: number;
        horses: number;
        cannons: number;
    };
}
/**
 * 解散军团
 * Requirements: 6.1, 6.2
 * @param legionId 军团ID
 * @param factionId 势力ID（用于权限验证）
 * @returns 解散结果
 */
export declare function disbandLegion(legionId: string, factionId: string): DisbandLegionResult;
/**
 * 编辑军团人数请求
 */
export interface UpdateLegionSoldiersRequest {
    legionId: string;
    factionId: string;
    newCount: number;
}
/**
 * 编辑军团人数结果
 */
export interface UpdateLegionSoldiersResult {
    success: boolean;
    error?: string;
    shouldDisband?: boolean;
    newSoldierCount?: number;
    newIdleSoldiers?: number;
}
/**
 * 编辑军团人数
 * Requirements: 6.3, 6.4
 * @param request 编辑请求
 * @returns 编辑结果
 */
export declare function updateLegionSoldiers(request: UpdateLegionSoldiersRequest): UpdateLegionSoldiersResult;
/**
 * 编辑军团装备请求
 */
export interface UpdateLegionEquipmentRequest {
    legionId: string;
    factionId: string;
    rifles: number;
    horses: number;
    cannons: number;
}
/**
 * 编辑军团装备结果
 */
export interface UpdateLegionEquipmentResult {
    success: boolean;
    error?: string;
    newEquipment?: {
        rifles: number;
        horses: number;
        cannons: number;
    };
    newInventory?: {
        rifles: number;
        horses: number;
        cannons: number;
    };
}
/**
 * 编辑军团装备
 * Requirements: 6.5, 6.6
 * @param request 编辑请求
 * @returns 编辑结果
 */
export declare function updateLegionEquipment(request: UpdateLegionEquipmentRequest): UpdateLegionEquipmentResult;
/**
 * 获取势力的可用将领列表（用于创建军团时选择）
 * @param factionId 势力ID
 * @returns 可用将领列表
 */
export declare function getAvailableCommanders(factionId: string): Samurai[];
/**
 * 获取军团详情
 * @param legionId 军团ID
 * @returns 军团详情或null
 */
export declare function getLegionById(legionId: string): Legion | null;
/**
 * 获取势力的所有军团
 * @param factionId 势力ID
 * @returns 军团列表
 */
export declare function getFactionLegions(factionId: string): Legion[];
//# sourceMappingURL=legion.d.ts.map