/**
 * 解散士兵服务
 * Requirements: 解散士兵功能
 */
export interface DisbandSoldiersResult {
    success: boolean;
    error?: string;
    newIdleSoldiers?: number;
    newTreasury?: number;
    totalCost?: number;
}
/**
 * 解散士兵
 * @param factionId 势力ID
 * @param count 解散数量
 * @returns 解散结果
 */
export declare function disbandSoldiers(factionId: string, count: number): DisbandSoldiersResult;
/**
 * 获取解散士兵信息
 * @param factionId 势力ID
 * @returns 解散信息
 */
export declare function getDisbandInfo(factionId: string): {
    success: boolean;
    error?: string;
    data?: {
        idleSoldiers: number;
        treasury: number;
        costPerSoldier: number;
        maxDisbandable: number;
    };
};
//# sourceMappingURL=disband-soldiers.d.ts.map