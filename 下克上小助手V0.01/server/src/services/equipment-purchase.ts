/**
 * 装备购买服务
 * 价格：铁炮10石/挺、战马12石/匹、大筒450石/门
 */

import { getFactionById, saveFactions, getFactions, addOperationRecord } from '../storage';
import { isGameLocked } from './game-progress';

// 装备价格
export const EQUIPMENT_PRICES = {
  rifles: 10,    // 铁炮 10石/挺
  horses: 12,    // 战马 12石/匹
  cannons: 450,  // 大筒 450石/门
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
export function calculatePurchaseCost(request: PurchaseEquipmentRequest): number {
  return (
    request.rifles * EQUIPMENT_PRICES.rifles +
    request.horses * EQUIPMENT_PRICES.horses +
    request.cannons * EQUIPMENT_PRICES.cannons
  );
}

/**
 * 获取购买信息
 */
export function getPurchaseInfo(factionId: string): {
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
} {
  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  return {
    success: true,
    data: {
      treasury: faction.treasury,
      currentEquipment: {
        rifles: faction.rifles,
        horses: faction.horses,
        cannons: faction.cannons,
      },
      prices: EQUIPMENT_PRICES,
    },
  };
}

/**
 * 购买装备
 */
export function purchaseEquipment(
  factionId: string,
  request: PurchaseEquipmentRequest
): PurchaseEquipmentResult {
  // 验证数量
  if (request.rifles < 0 || request.horses < 0 || request.cannons < 0) {
    return { success: false, error: '购买数量不能为负数' };
  }

  if (request.rifles === 0 && request.horses === 0 && request.cannons === 0) {
    return { success: false, error: '请至少选择一种装备购买' };
  }

  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  // 计算总价
  const totalCost = calculatePurchaseCost(request);
  if (totalCost > faction.treasury) {
    return { 
      success: false, 
      error: `金库不足，需要${totalCost}石，当前${faction.treasury}石` 
    };
  }

  // 更新势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  factions[factionIndex].treasury -= totalCost;
  factions[factionIndex].rifles += request.rifles;
  factions[factionIndex].horses += request.horses;
  factions[factionIndex].cannons += request.cannons;
  saveFactions(factions);

  // 记录操作
  addOperationRecord({
    userId: factionId,
    userType: 'player',
    factionId: factionId,
    action: '购买装备',
    details: {
      rifles: request.rifles,
      horses: request.horses,
      cannons: request.cannons,
      totalCost,
      newTreasury: factions[factionIndex].treasury,
    },
  });

  return {
    success: true,
    totalCost,
    newTreasury: factions[factionIndex].treasury,
    newEquipment: {
      rifles: factions[factionIndex].rifles,
      horses: factions[factionIndex].horses,
      cannons: factions[factionIndex].cannons,
    },
  };
}
