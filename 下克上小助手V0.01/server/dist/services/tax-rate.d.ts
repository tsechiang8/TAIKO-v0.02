/**
 * 税率更改服务
 * 每回合只能更换一次税率
 */
/**
 * 检查势力本回合是否已更改税率
 */
export declare function hasTaxRateChangedThisYear(factionId: string): boolean;
/**
 * 获取税率信息
 */
export declare function getTaxRateInfo(factionId: string): {
    success: boolean;
    error?: string;
    data?: {
        currentTaxRate: number;
        canChange: boolean;
        availableRates: number[];
    };
};
/**
 * 更改税率
 */
export declare function changeTaxRate(factionId: string, newTaxRate: number): {
    success: boolean;
    error?: string;
    newTaxRate?: number;
};
/**
 * 重置税率更改状态（年度结算时调用）
 */
export declare function resetTaxRateChangeStatus(): void;
//# sourceMappingURL=tax-rate.d.ts.map