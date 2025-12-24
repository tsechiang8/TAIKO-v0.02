/**
 * 解散士兵服务
 * Requirements: 解散士兵功能
 */

import { getFactionById, saveFactions, getFactions, addOperationRecord } from '../storage';

const DISBAND_COST_PER_SOLDIER = 2; // 每解散一个士兵扣除2石

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
export function disbandSoldiers(factionId: string, count: number): DisbandSoldiersResult {
  if (count <= 0) {
    return { success: false, error: '解散数量必须大于0' };
  }

  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  if (count > faction.idleSoldiers) {
    return { success: false, error: '解散数量超过闲置士兵数量' };
  }

  const totalCost = count * DISBAND_COST_PER_SOLDIER;
  if (totalCost > faction.treasury) {
    return { success: false, error: `金库不足，需要${totalCost}石，当前${faction.treasury}石` };
  }

  // 更新势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  factions[factionIndex].idleSoldiers -= count;
  factions[factionIndex].treasury -= totalCost;
  saveFactions(factions);

  // 记录操作
  addOperationRecord({
    userId: factionId,
    userType: 'player',
    factionId: factionId,
    action: '解散士兵',
    details: {
      count,
      cost: totalCost,
      newIdleSoldiers: factions[factionIndex].idleSoldiers,
      newTreasury: factions[factionIndex].treasury,
    },
  });

  return {
    success: true,
    newIdleSoldiers: factions[factionIndex].idleSoldiers,
    newTreasury: factions[factionIndex].treasury,
    totalCost,
  };
}

/**
 * 获取解散士兵信息
 * @param factionId 势力ID
 * @returns 解散信息
 */
export function getDisbandInfo(factionId: string): {
  success: boolean;
  error?: string;
  data?: {
    idleSoldiers: number;
    treasury: number;
    costPerSoldier: number;
    maxDisbandable: number;
  };
} {
  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  const maxByTreasury = Math.floor(faction.treasury / DISBAND_COST_PER_SOLDIER);
  const maxDisbandable = Math.min(faction.idleSoldiers, maxByTreasury);

  return {
    success: true,
    data: {
      idleSoldiers: faction.idleSoldiers,
      treasury: faction.treasury,
      costPerSoldier: DISBAND_COST_PER_SOLDIER,
      maxDisbandable,
    },
  };
}
