/**
 * 税率更改服务
 * 每回合只能更换一次税率
 */

import { getFactionById, saveFactions, getFactions, addOperationRecord, getGameState } from '../storage';

// 存储每个势力本回合是否已更改税率
const taxRateChangedThisYear: Map<string, number> = new Map();

/**
 * 检查势力本回合是否已更改税率
 */
export function hasTaxRateChangedThisYear(factionId: string): boolean {
  const currentYear = getGameState().currentYear;
  const changedYear = taxRateChangedThisYear.get(factionId);
  return changedYear === currentYear;
}

/**
 * 获取税率信息
 */
export function getTaxRateInfo(factionId: string): {
  success: boolean;
  error?: string;
  data?: {
    currentTaxRate: number;
    canChange: boolean;
    availableRates: number[];
  };
} {
  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  const canChange = !hasTaxRateChangedThisYear(factionId);

  return {
    success: true,
    data: {
      currentTaxRate: faction.taxRate,
      canChange,
      availableRates: [0.4, 0.6, 0.8],
    },
  };
}

/**
 * 更改税率
 */
export function changeTaxRate(
  factionId: string,
  newTaxRate: number
): {
  success: boolean;
  error?: string;
  newTaxRate?: number;
} {
  // 验证税率
  if (![0.4, 0.6, 0.8].includes(newTaxRate)) {
    return { success: false, error: '税率必须为40%、60%或80%' };
  }

  const faction = getFactionById(factionId);
  if (!faction) {
    return { success: false, error: '势力不存在' };
  }

  // 检查是否已更改过
  if (hasTaxRateChangedThisYear(factionId)) {
    return { success: false, error: '本回合已更改过税率，每回合只能更改一次' };
  }

  // 检查是否与当前税率相同
  if (faction.taxRate === newTaxRate) {
    return { success: false, error: '新税率与当前税率相同' };
  }

  const oldTaxRate = faction.taxRate;

  // 更新势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  factions[factionIndex].taxRate = newTaxRate;
  saveFactions(factions);

  // 记录本回合已更改
  const currentYear = getGameState().currentYear;
  taxRateChangedThisYear.set(factionId, currentYear);

  // 记录操作
  addOperationRecord({
    userId: factionId,
    userType: 'player',
    factionId: factionId,
    action: '更改税率',
    details: {
      oldTaxRate,
      newTaxRate,
      year: currentYear,
    },
  });

  return {
    success: true,
    newTaxRate,
  };
}

/**
 * 重置税率更改状态（年度结算时调用）
 */
export function resetTaxRateChangeStatus(): void {
  taxRateChangedThisYear.clear();
}
