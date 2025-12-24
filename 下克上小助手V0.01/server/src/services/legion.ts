/**
 * 军团管理服务
 * Requirements: 5.1-5.10, 6.1-6.6
 */

import { v4 as uuidv4 } from 'uuid';
import {
  getFactions,
  saveFactions,
  getLegions,
  saveLegions,
  getSamurais,
  saveSamurais,
  getTerritories,
} from '../storage';
import { Legion, Samurai, FactionData, Territory } from '../types';

/**
 * 验证军团名称是否符合规范
 * Requirement 5.2: 军团名称为1-8个简体中文字符
 * @param name 军团名称
 * @returns 验证结果
 */
export function validateLegionName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: '军团名称不能为空' };
  }

  const trimmedName = name.trim();
  
  // 检查是否为1-8个简体中文字符
  // 简体中文字符范围：\u4e00-\u9fa5
  const chineseRegex = /^[\u4e00-\u9fa5]{1,8}$/;
  
  if (!chineseRegex.test(trimmedName)) {
    return { valid: false, error: '军团名称必须为1-8个简体中文字符' };
  }

  return { valid: true };
}

/**
 * 检查将领是否已经指挥其他军团
 * Requirement 5.9, 5.10: 将领唯一性约束
 * @param samuraiId 武士ID
 * @param excludeLegionId 排除的军团ID（用于编辑时）
 * @returns 冲突的军团信息或null
 */
export function checkCommanderConflict(
  samuraiId: string,
  excludeLegionId?: string
): Legion | null {
  const legions = getLegions();
  return legions.find(
    l => l.commanderId === samuraiId && l.id !== excludeLegionId
  ) || null;
}

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
export function createLegion(
  request: CreateLegionRequest,
  forceReassign: boolean = false
): CreateLegionResult {
  const {
    factionId,
    name,
    commanderId,
    soldierCount,
    rifles,
    horses,
    cannons,
    locationId,
  } = request;

  // 1. 验证军团名称 (Requirement 5.2, 5.7)
  const nameValidation = validateLegionName(name);
  if (!nameValidation.valid) {
    return { success: false, error: nameValidation.error };
  }

  // 2. 验证势力存在
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }
  const faction = factions[factionIndex];

  // 3. 验证将领存在且属于该势力 (Requirement 5.3)
  const samurais = getSamurais();
  const samuraiIndex = samurais.findIndex(
    s => s.id === commanderId && s.factionId === factionId
  );
  if (samuraiIndex === -1) {
    return { success: false, error: '将领不存在或不属于该势力' };
  }
  const samurai = samurais[samuraiIndex];

  // 4. 检查将领冲突 (Requirement 5.9, 5.10)
  const conflictLegion = checkCommanderConflict(commanderId);
  if (conflictLegion && !forceReassign) {
    return {
      success: false,
      error: `将领 ${samurai.name} 已是军团「${conflictLegion.name}」的指挥官`,
      conflictLegion,
    };
  }

  // 5. 验证士兵数量 (Requirement 5.4)
  if (soldierCount <= 0) {
    return { success: false, error: '军团人数必须大于0' };
  }
  if (soldierCount > faction.idleSoldiers) {
    return {
      success: false,
      error: `闲置士兵不足，当前库存 ${faction.idleSoldiers} 人`,
    };
  }

  // 6. 验证装备数量 (Requirement 5.5)
  if (rifles < 0 || horses < 0 || cannons < 0) {
    return { success: false, error: '装备数量不能为负数' };
  }
  if (rifles > faction.rifles) {
    return {
      success: false,
      error: `铁炮不足，当前库存 ${faction.rifles}`,
    };
  }
  if (horses > faction.horses) {
    return {
      success: false,
      error: `战马不足，当前库存 ${faction.horses}`,
    };
  }
  if (cannons > faction.cannons) {
    return {
      success: false,
      error: `大筒不足，当前库存 ${faction.cannons}`,
    };
  }

  // 7. 验证位置 (Requirement 5.6)
  const territories = getTerritories();
  const location = territories.find(
    t => t.id === locationId && t.factionId === factionId
  );
  if (!location) {
    return { success: false, error: '位置不存在或不属于该势力' };
  }

  // 8. 如果强制重新分配，先解散原军团的将领
  if (conflictLegion && forceReassign) {
    const legions = getLegions();
    const conflictIndex = legions.findIndex(l => l.id === conflictLegion.id);
    if (conflictIndex !== -1) {
      // 将原军团资源返还
      const oldLegion = legions[conflictIndex];
      faction.idleSoldiers += oldLegion.soldierCount;
      faction.rifles += oldLegion.rifles;
      faction.horses += oldLegion.horses;
      faction.cannons += oldLegion.cannons;
      
      // 删除原军团
      legions.splice(conflictIndex, 1);
      saveLegions(legions);
      
      // 更新原将领状态
      const oldCommanderIndex = samurais.findIndex(s => s.id === oldLegion.commanderId);
      if (oldCommanderIndex !== -1) {
        samurais[oldCommanderIndex].currentLegionId = undefined;
        samurais[oldCommanderIndex].isIdle = true;
      }
    }
  }

  // 9. 创建新军团
  const newLegion: Legion = {
    id: uuidv4(),
    name: name.trim(),
    commanderId,
    commanderName: samurai.name,
    soldierCount,
    rifles,
    horses,
    cannons,
    locationId,
    locationName: location.districtName,
    factionId,
  };

  // 10. 扣除资源
  factions[factionIndex].idleSoldiers -= soldierCount;
  factions[factionIndex].rifles -= rifles;
  factions[factionIndex].horses -= horses;
  factions[factionIndex].cannons -= cannons;

  // 11. 更新将领状态
  samurais[samuraiIndex].currentLegionId = newLegion.id;
  samurais[samuraiIndex].isIdle = false;

  // 12. 更新势力的军团列表
  if (!factions[factionIndex].legionIds.includes(newLegion.id)) {
    factions[factionIndex].legionIds.push(newLegion.id);
  }

  // 13. 保存数据
  const legions = getLegions();
  legions.push(newLegion);
  saveLegions(legions);
  saveFactions(factions);
  saveSamurais(samurais);

  return { success: true, legion: newLegion };
}


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
export function disbandLegion(
  legionId: string,
  factionId: string
): DisbandLegionResult {
  // 1. 查找军团
  const legions = getLegions();
  const legionIndex = legions.findIndex(l => l.id === legionId);
  if (legionIndex === -1) {
    return { success: false, error: '军团不存在' };
  }

  const legion = legions[legionIndex];

  // 2. 验证权限
  if (legion.factionId !== factionId) {
    return { success: false, error: '无权操作该军团' };
  }

  // 3. 获取势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  // 4. 返还资源到库存 (Requirement 6.2)
  factions[factionIndex].idleSoldiers += legion.soldierCount;
  factions[factionIndex].rifles += legion.rifles;
  factions[factionIndex].horses += legion.horses;
  factions[factionIndex].cannons += legion.cannons;

  // 5. 更新将领状态
  const samurais = getSamurais();
  const samuraiIndex = samurais.findIndex(s => s.id === legion.commanderId);
  if (samuraiIndex !== -1) {
    samurais[samuraiIndex].currentLegionId = undefined;
    samurais[samuraiIndex].isIdle = true;
  }

  // 6. 从势力的军团列表中移除
  const legionIdIndex = factions[factionIndex].legionIds.indexOf(legionId);
  if (legionIdIndex !== -1) {
    factions[factionIndex].legionIds.splice(legionIdIndex, 1);
  }

  // 7. 删除军团
  legions.splice(legionIndex, 1);

  // 8. 保存数据
  saveLegions(legions);
  saveFactions(factions);
  saveSamurais(samurais);

  return {
    success: true,
    returnedResources: {
      soldiers: legion.soldierCount,
      rifles: legion.rifles,
      horses: legion.horses,
      cannons: legion.cannons,
    },
  };
}

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
export function updateLegionSoldiers(
  request: UpdateLegionSoldiersRequest
): UpdateLegionSoldiersResult {
  const { legionId, factionId, newCount } = request;

  // 1. 查找军团
  const legions = getLegions();
  const legionIndex = legions.findIndex(l => l.id === legionId);
  if (legionIndex === -1) {
    return { success: false, error: '军团不存在' };
  }

  const legion = legions[legionIndex];

  // 2. 验证权限
  if (legion.factionId !== factionId) {
    return { success: false, error: '无权操作该军团' };
  }

  // 3. 检查是否需要解散 (Requirement 6.4)
  if (newCount <= 0) {
    return {
      success: false,
      error: '人数不能为0或负数',
      shouldDisband: true,
    };
  }

  // 4. 获取势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  const faction = factions[factionIndex];
  const currentCount = legion.soldierCount;
  const diff = newCount - currentCount;

  // 5. 验证资源 (Requirement 6.3)
  if (diff > 0) {
    // 增加人数，需要从库存扣除
    if (diff > faction.idleSoldiers) {
      return {
        success: false,
        error: `闲置士兵不足，当前库存 ${faction.idleSoldiers} 人，需要 ${diff} 人`,
      };
    }
    factions[factionIndex].idleSoldiers -= diff;
  } else if (diff < 0) {
    // 减少人数，返还到库存
    factions[factionIndex].idleSoldiers += Math.abs(diff);
  }

  // 6. 更新军团人数
  legions[legionIndex].soldierCount = newCount;

  // 7. 保存数据
  saveLegions(legions);
  saveFactions(factions);

  return {
    success: true,
    newSoldierCount: newCount,
    newIdleSoldiers: factions[factionIndex].idleSoldiers,
  };
}

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
export function updateLegionEquipment(
  request: UpdateLegionEquipmentRequest
): UpdateLegionEquipmentResult {
  const { legionId, factionId, rifles, horses, cannons } = request;

  // 1. 验证输入
  if (rifles < 0 || horses < 0 || cannons < 0) {
    return { success: false, error: '装备数量不能为负数' };
  }

  // 2. 查找军团
  const legions = getLegions();
  const legionIndex = legions.findIndex(l => l.id === legionId);
  if (legionIndex === -1) {
    return { success: false, error: '军团不存在' };
  }

  const legion = legions[legionIndex];

  // 3. 验证权限
  if (legion.factionId !== factionId) {
    return { success: false, error: '无权操作该军团' };
  }

  // 4. 获取势力数据
  const factions = getFactions();
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  const faction = factions[factionIndex];

  // 5. 计算差值
  const riflesDiff = rifles - legion.rifles;
  const horsesDiff = horses - legion.horses;
  const cannonsDiff = cannons - legion.cannons;

  // 6. 验证资源是否足够
  if (riflesDiff > 0 && riflesDiff > faction.rifles) {
    return {
      success: false,
      error: `铁炮不足，当前库存 ${faction.rifles}，需要 ${riflesDiff}`,
    };
  }
  if (horsesDiff > 0 && horsesDiff > faction.horses) {
    return {
      success: false,
      error: `战马不足，当前库存 ${faction.horses}，需要 ${horsesDiff}`,
    };
  }
  if (cannonsDiff > 0 && cannonsDiff > faction.cannons) {
    return {
      success: false,
      error: `大筒不足，当前库存 ${faction.cannons}，需要 ${cannonsDiff}`,
    };
  }

  // 7. 更新库存（增加装备则扣除库存，减少装备则返还库存）
  factions[factionIndex].rifles -= riflesDiff;
  factions[factionIndex].horses -= horsesDiff;
  factions[factionIndex].cannons -= cannonsDiff;

  // 8. 更新军团装备
  legions[legionIndex].rifles = rifles;
  legions[legionIndex].horses = horses;
  legions[legionIndex].cannons = cannons;

  // 9. 保存数据
  saveLegions(legions);
  saveFactions(factions);

  return {
    success: true,
    newEquipment: { rifles, horses, cannons },
    newInventory: {
      rifles: factions[factionIndex].rifles,
      horses: factions[factionIndex].horses,
      cannons: factions[factionIndex].cannons,
    },
  };
}

/**
 * 获取势力的可用将领列表（用于创建军团时选择）
 * @param factionId 势力ID
 * @returns 可用将领列表
 */
export function getAvailableCommanders(factionId: string): Samurai[] {
  const samurais = getSamurais();
  return samurais.filter(s => s.factionId === factionId);
}

/**
 * 获取军团详情
 * @param legionId 军团ID
 * @returns 军团详情或null
 */
export function getLegionById(legionId: string): Legion | null {
  const legions = getLegions();
  return legions.find(l => l.id === legionId) || null;
}

/**
 * 获取势力的所有军团
 * @param factionId 势力ID
 * @returns 军团列表
 */
export function getFactionLegions(factionId: string): Legion[] {
  const legions = getLegions();
  return legions.filter(l => l.factionId === factionId);
}
