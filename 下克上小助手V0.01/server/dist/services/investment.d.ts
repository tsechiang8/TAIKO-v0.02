/**
 * 投资服务
 * 实现四大投资子系统：农业、商业、水军、武备
 */
import { Samurai } from '../types';
export type InvestmentType = 'agriculture' | 'commerce' | 'navy' | 'armament';
export type InvestmentOutcome = 'critical_success' | 'success' | 'failure';
export interface InvestmentRequest {
    factionId: string;
    samuraiId: string;
    type: InvestmentType;
    targetTerritoryId?: string;
    amount?: number;
}
export interface InvestmentResult {
    success: boolean;
    outcome: InvestmentOutcome;
    pointsGained: number;
    newPoints: number;
    newLevel: string;
    message: string;
    roll: number;
    successRate: number;
    error?: string;
}
export interface InvestmentPreview {
    successRate: number;
    modifierCoefficient: number;
    expectedPointsOnSuccess: number;
    expectedPointsOnCritical: number;
    expectedPointsOnFailure: number;
    cost: number;
    samuraiAttribute: number;
    attributeName: string;
    canExecute: boolean;
    error?: string;
}
export interface InvestmentConfig {
    attributeKey: 'civilValue' | 'martialValue';
    attributeName: string;
    baseCost: number;
    basePoints: number;
    pointsKey: 'agriculturePoints' | 'commercePoints' | 'navyPoints' | 'armamentPoints';
}
export declare const INVESTMENT_CONFIGS: Record<InvestmentType, InvestmentConfig>;
export declare const AGRICULTURE_LEVELS: readonly [{
    readonly level: 0;
    readonly name: "荒废";
    readonly minPoints: 0;
    readonly maxPoints: 0;
    readonly growthBonus: -0.01;
    readonly kokudakaBonus: -0.05;
}, {
    readonly level: 1;
    readonly name: "开垦";
    readonly minPoints: 1;
    readonly maxPoints: 15;
    readonly growthBonus: 0;
    readonly kokudakaBonus: 0;
}, {
    readonly level: 2;
    readonly name: "井田";
    readonly minPoints: 16;
    readonly maxPoints: 30;
    readonly growthBonus: 0.005;
    readonly kokudakaBonus: 0;
}, {
    readonly level: 3;
    readonly name: "检地";
    readonly minPoints: 31;
    readonly maxPoints: 50;
    readonly growthBonus: 0.01;
    readonly kokudakaBonus: 0.02;
}, {
    readonly level: 4;
    readonly name: "治水";
    readonly minPoints: 51;
    readonly maxPoints: 70;
    readonly growthBonus: 0.015;
    readonly kokudakaBonus: 0.04;
}, {
    readonly level: 5;
    readonly name: "丰饶";
    readonly minPoints: 71;
    readonly maxPoints: 85;
    readonly growthBonus: 0.02;
    readonly kokudakaBonus: 0.06;
}, {
    readonly level: 6;
    readonly name: "天府";
    readonly minPoints: 86;
    readonly maxPoints: 99;
    readonly growthBonus: 0.025;
    readonly kokudakaBonus: 0.08;
}, {
    readonly level: 7;
    readonly name: "瑞穗";
    readonly minPoints: 100;
    readonly maxPoints: 100;
    readonly growthBonus: 0.03;
    readonly kokudakaBonus: 0.1;
}];
export declare const COMMERCE_LEVELS: readonly [{
    readonly level: 0;
    readonly name: "闭塞";
    readonly minPoints: 0;
    readonly maxPoints: 0;
}, {
    readonly level: 1;
    readonly name: "通商";
    readonly minPoints: 1;
    readonly maxPoints: 15;
}, {
    readonly level: 2;
    readonly name: "市集";
    readonly minPoints: 16;
    readonly maxPoints: 30;
}, {
    readonly level: 3;
    readonly name: "商会";
    readonly minPoints: 31;
    readonly maxPoints: 50;
}, {
    readonly level: 4;
    readonly name: "繁荣";
    readonly minPoints: 51;
    readonly maxPoints: 70;
}, {
    readonly level: 5;
    readonly name: "富庶";
    readonly minPoints: 71;
    readonly maxPoints: 85;
}, {
    readonly level: 6;
    readonly name: "商都";
    readonly minPoints: 86;
    readonly maxPoints: 99;
}, {
    readonly level: 7;
    readonly name: "天下之台所";
    readonly minPoints: 100;
    readonly maxPoints: 100;
}];
export declare const NAVY_LEVELS: readonly [{
    readonly level: 0;
    readonly name: "无";
    readonly minPoints: 0;
    readonly maxPoints: 0;
}, {
    readonly level: 1;
    readonly name: "渔船";
    readonly minPoints: 1;
    readonly maxPoints: 15;
}, {
    readonly level: 2;
    readonly name: "关船";
    readonly minPoints: 16;
    readonly maxPoints: 30;
}, {
    readonly level: 3;
    readonly name: "小早";
    readonly minPoints: 31;
    readonly maxPoints: 50;
}, {
    readonly level: 4;
    readonly name: "安宅船";
    readonly minPoints: 51;
    readonly maxPoints: 70;
}, {
    readonly level: 5;
    readonly name: "大安宅";
    readonly minPoints: 71;
    readonly maxPoints: 85;
}, {
    readonly level: 6;
    readonly name: "�的铁甲船";
    readonly minPoints: 86;
    readonly maxPoints: 99;
}, {
    readonly level: 7;
    readonly name: "日本丸";
    readonly minPoints: 100;
    readonly maxPoints: 100;
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
/**
 * 计算投资成功率
 * 公式：50% + (武士属性 - 70)%，锁定在5%-95%范围内
 * @param samuraiAttribute 武士属性值
 * @returns 成功率（0.05-0.95）
 */
export declare function calculateSuccessRate(samuraiAttribute: number): number;
/**
 * 计算修正系数
 * 公式：1 + (武士属性 - 70) × 1%
 * @param samuraiAttribute 武士属性值
 * @returns 修正系数
 */
export declare function calculateModifierCoefficient(samuraiAttribute: number): number;
/**
 * D100随机判定
 * @returns 1-100的随机数
 */
export declare function rollD100(): number;
/**
 * 判定投资结果
 * 大成功: roll < 5
 * 成功: roll <= successRate * 100
 * 失败: roll > successRate * 100
 * @param roll D100结果
 * @param successRate 成功率（0-1）
 * @returns 投资结果类型
 */
export declare function determineOutcome(roll: number, successRate: number): InvestmentOutcome;
/**
 * 计算获得的点数
 * @param outcome 投资结果
 * @param basePoints 基础点数
 * @param modifierCoefficient 修正系数
 * @returns 获得的点数
 */
export declare function calculatePointsGained(outcome: InvestmentOutcome, basePoints: number, modifierCoefficient: number): number;
/**
 * 获取投资等级信息
 * @param type 投资类型
 * @param points 当前点数
 * @returns 等级名称
 */
export declare function getInvestmentLevel(type: InvestmentType, points: number): string;
/**
 * 获取投资预览
 * @param request 投资请求
 * @returns 投资预览信息
 */
export declare function getInvestmentPreview(request: InvestmentRequest): InvestmentPreview;
/**
 * 执行投资操作
 * @param request 投资请求
 * @param rollOverride 可选的骰子结果覆盖（用于测试）
 * @returns 投资结果
 */
export declare function executeInvestment(request: InvestmentRequest, rollOverride?: number): InvestmentResult;
/**
 * 获取势力的投资状态
 * @param factionId 势力ID
 * @returns 投资状态信息
 */
export declare function getInvestmentStatus(factionId: string): {
    treasury: number;
    agriculturePoints: number;
    agricultureLevel: string;
    commercePoints: number;
    commerceLevel: string;
    navyPoints: number;
    navyLevel: string;
    armamentPoints: number;
    armamentLevel: string;
} | null;
/**
 * 获取可执行投资的武士列表
 * @param factionId 势力ID
 * @returns 有行动力的武士列表
 */
export declare function getAvailableSamuraisForInvestment(factionId: string): Samurai[];
//# sourceMappingURL=investment.d.ts.map