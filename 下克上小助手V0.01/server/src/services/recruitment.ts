/**
 * 士兵招募服务
 * Requirements: 4.1-4.5
 */

import { getFactionById, getFactions, saveFactions, getTerritories, getLegions, getSamurais, getSpecialProducts } from '../storage';
import { calculateFactionData } from '../calculation';

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
export function getRecruitInfo(factionId: string): RecruitInfo | null {
  const faction = getFactionById(factionId);
  if (!faction) {
    return null;
  }

  const territories = getTerritories().filter(t => t.factionId === factionId);
  const allTerritories = getTerritories();
  const legions = getLegions().filter(l => l.factionId === factionId);
  const samurais = getSamurais().filter(s => s.factionId === factionId);
  const specialProducts = getSpecialProducts();

  const calculation = calculateFactionData(
    faction,
    territories,
    allTerritories,
    legions,
    samurais,
    specialProducts
  );

  // 可招募数量 = 最大可招募上限 - 当前总士兵数
  const availableToRecruit = Math.max(0, calculation.maxRecruitableSoldiers - calculation.totalSoldiers);

  return {
    currentIdleSoldiers: faction.idleSoldiers,
    maxRecruitableSoldiers: calculation.maxRecruitableSoldiers,
    availableToRecruit,
  };
}

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
export function recruitSoldiers(request: RecruitRequest): RecruitResult {
  const { factionId, count } = request;

  // 验证招募数量
  if (count <= 0) {
    return {
      success: false,
      error: '招募数量必须大于0',
    };
  }

  if (!Number.isInteger(count)) {
    return {
      success: false,
      error: '招募数量必须为整数',
    };
  }

  // 获取势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  
  if (factionIndex === -1) {
    return {
      success: false,
      error: '势力不存在',
    };
  }

  const faction = factions[factionIndex];

  // 计算当前可招募数量
  const recruitInfo = getRecruitInfo(factionId);
  if (!recruitInfo) {
    return {
      success: false,
      error: '无法获取招募信息',
    };
  }

  // 验证招募数量不超过上限 (Requirement 4.3)
  if (count > recruitInfo.availableToRecruit) {
    return {
      success: false,
      error: `招募数量超过上限，当前最多可招募 ${recruitInfo.availableToRecruit} 人`,
    };
  }

  // 更新闲置士兵 (Requirement 4.4)
  factions[factionIndex].idleSoldiers += count;
  
  // 保存数据
  saveFactions(factions);

  // 重新计算招募信息
  const newRecruitInfo = getRecruitInfo(factionId);

  return {
    success: true,
    newIdleSoldiers: factions[factionIndex].idleSoldiers,
    newMaxRecruitableSoldiers: newRecruitInfo?.availableToRecruit ?? 0,
  };
}
