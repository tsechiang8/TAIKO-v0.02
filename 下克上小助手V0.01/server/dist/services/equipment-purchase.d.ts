/**
 * 装备购买服务
 * 价格：铁炮10石/挺、战马12石/匹、大筒450石/门
 */
export declare const EQUIPMENT_PRICES: {
    rifles: number;
    horses: number;
    cannons: number;
};
export interface PurchaseEquipmentRequest {
    rifles: number;
    horses: number;
    cannons: number;
}
export interface PurchaseEquipmentResult {
    success: boolean;
    error?: string;
    totalCost?: number;
    newTreasury?: number;
    newEquipment?: {
        rifles: number;
        horses: number;
        cannons: number;
    };
}
/**
 * 计算购买总价
 */
export declare function calculatePurchaseCost(request: PurchaseEquipmentRequest): number;
/**
 * 获取购买信息
 */
export declare function getPurchaseInfo(factionId: string): {
    success: boolean;
    error?: string;
    data?: {
        treasury: number;
        currentEquipment: {
            rifles: number;
            horses: number;
            cannons: number;
        };
        prices: typeof EQUIPMENT_PRICES;
    };
};
/**
 * 购买装备
 */
export declare function purchaseEquipment(factionId: string, request: PurchaseEquipmentRequest): PurchaseEquipmentResult;
//# sourceMappingURL=equipment-purchase.d.ts.map