/**
 * 士兵招募服务
 * Requirements: 4.1-4.5
 */
/**
 * 招募请求
 */
export interface RecruitRequest {
    factionId: string;
    count: number;
}
/**
 * 招募结果
 */
export interface RecruitResult {
    success: boolean;
    error?: string;
    newIdleSoldiers?: number;
    newMaxRecruitableSoldiers?: number;
}
/**
 * 获取招募信息
 */
export interface RecruitInfo {
    currentIdleSoldiers: number;
    maxRecruitableSoldiers: number;
    availableToRecruit: number;
}
/**
 * 获取势力的招募信息
 * @param factionId 势力ID
 * @returns 招募信息或null
 */
export declare function getRecruitInfo(factionId: string): RecruitInfo | null;
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
export declare function recruitSoldiers(request: RecruitRequest): RecruitResult;
//# sourceMappingURL=recruitment.d.ts.map