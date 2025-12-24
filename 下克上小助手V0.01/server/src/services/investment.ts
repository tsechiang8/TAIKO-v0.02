/**
 * 投资服务
 * 实现四大投资子系统：农业、商业、水军、武备
 */

import { Samurai, FactionData } from '../types';
import {
  getFactionById,
  saveFactions,
  getFactions,
  getSamurais,
  saveSamurais,
} from '../storage';

// 投资类型
export type InvestmentType = 'agriculture' | 'commerce' | 'navy' | 'armament';

// 投资结果类型
export type InvestmentOutcome = 'critical_success' | 'success' | 'failure';

// 投资请求
export interface InvestmentRequest {
  factionId: string;
  samuraiId: string;
  type: InvestmentType;
  targetTerritoryId?: string; // 商业系统需要
  amount?: number; // 商业系统投入资金
}

// 投资结果
export interface InvestmentResult {
  success: boolean;
  outcome: InvestmentOutcome;
  pointsGained: number;
  newPoints: number;
  newLevel: string;
  message: string;
  roll: number; // D100结果
  successRate: number;
  error?: string;
}

// 投资预览
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

// 投资配置
export interface InvestmentConfig {
  attributeKey: 'civilValue' | 'martialValue'; // 使用的武士属性
  attributeName: string;
  baseCost: number; // 基础花费（石高）
  basePoints: number; // 基础点数
  pointsKey: 'agriculturePoints' | 'commercePoints' | 'navyPoints' | 'armamentPoints';
}

// 四大投资系统配置
export const INVESTMENT_CONFIGS: Record<InvestmentType, InvestmentConfig> = {
  agriculture: {
    attributeKey: 'civilValue', // 文治
    attributeName: '文治',
    baseCost: 5000,
    basePoints: 5,
    pointsKey: 'agriculturePoints',
  },
  commerce: {
    attributeKey: 'civilValue', // 智略（使用文治代替）
    attributeName: '智略',
    baseCost: 0, // 商业系统特殊，由玩家指定投入金额
    basePoints: 0, // 商业系统特殊判定
    pointsKey: 'commercePoints',
  },
  navy: {
    attributeKey: 'martialValue', // 武功
    attributeName: '武功',
    baseCost: 8000,
    basePoints: 4,
    pointsKey: 'navyPoints',
  },
  armament: {
    attributeKey: 'martialValue', // 武勇（使用武功代替）
    attributeName: '武勇',
    baseCost: 4000,
    basePoints: 6,
    pointsKey: 'armamentPoints',
  },
};

// 农业等级表
export const AGRICULTURE_LEVELS = [
  { level: 0, name: '荒废', minPoints: 0, maxPoints: 0, growthBonus: -0.01, kokudakaBonus: -0.05 },
  { level: 1, name: '开垦', minPoints: 1, maxPoints: 15, growthBonus: 0, kokudakaBonus: 0 },
  { level: 2, name: '井田', minPoints: 16, maxPoints: 30, growthBonus: 0.005, kokudakaBonus: 0 },
  { level: 3, name: '检地', minPoints: 31, maxPoints: 50, growthBonus: 0.01, kokudakaBonus: 0.02 },
  { level: 4, name: '治水', minPoints: 51, maxPoints: 70, growthBonus: 0.015, kokudakaBonus: 0.04 },
  { level: 5, name: '丰饶', minPoints: 71, maxPoints: 85, growthBonus: 0.02, kokudakaBonus: 0.06 },
  { level: 6, name: '天府', minPoints: 86, maxPoints: 99, growthBonus: 0.025, kokudakaBonus: 0.08 },
  { level: 7, name: '瑞穗', minPoints: 100, maxPoints: 100, growthBonus: 0.03, kokudakaBonus: 0.10 },
] as const;

// 商业等级表
export const COMMERCE_LEVELS = [
  { level: 0, name: '闭塞', minPoints: 0, maxPoints: 0 },
  { level: 1, name: '通商', minPoints: 1, maxPoints: 15 },
  { level: 2, name: '市集', minPoints: 16, maxPoints: 30 },
  { level: 3, name: '商会', minPoints: 31, maxPoints: 50 },
  { level: 4, name: '繁荣', minPoints: 51, maxPoints: 70 },
  { level: 5, name: '富庶', minPoints: 71, maxPoints: 85 },
  { level: 6, name: '商都', minPoints: 86, maxPoints: 99 },
  { level: 7, name: '天下之台所', minPoints: 100, maxPoints: 100 },
] as const;

// 水军等级表
export const NAVY_LEVELS = [
  { level: 0, name: '无', minPoints: 0, maxPoints: 0 },
  { level: 1, name: '渔船', minPoints: 1, maxPoints: 15 },
  { level: 2, name: '关船', minPoints: 16, maxPoints: 30 },
  { level: 3, name: '小早', minPoints: 31, maxPoints: 50 },
  { level: 4, name: '安宅船', minPoints: 51, maxPoints: 70 },
  { level: 5, name: '大安宅', minPoints: 71, maxPoints: 85 },
  { level: 6, name: '�的铁甲船', minPoints: 86, maxPoints: 99 },
  { level: 7, name: '日本丸', minPoints: 100, maxPoints: 100 },
] as const;

// 武备等级表（复用计算引擎中的定义）
export const ARMAMENT_LEVELS = [
  { level: 0, name: '朽坏', minPoints: 0, maxPoints: 0, maintenanceModifier: 0.20 },
  { level: 1, name: '普通', minPoints: 1, maxPoints: 15, maintenanceModifier: 0 },
  { level: 2, name: '整修', minPoints: 16, maxPoints: 30, maintenanceModifier: -0.05 },
  { level: 3, name: '精良', minPoints: 31, maxPoints: 50, maintenanceModifier: -0.10 },
  { level: 4, name: '军械', minPoints: 51, maxPoints: 70, maintenanceModifier: -0.20 },
  { level: 5, name: '严整', minPoints: 71, maxPoints: 85, maintenanceModifier: -0.30 },
  { level: 6, name: '兵法', minPoints: 86, maxPoints: 99, maintenanceModifier: -0.40 },
  { level: 7, name: '武库', minPoints: 100, maxPoints: 100, maintenanceModifier: -0.50 },
] as const;

/**
 * 计算投资成功率
 * 公式：50% + (武士属性 - 70)%，锁定在5%-95%范围内
 * @param samuraiAttribute 武士属性值
 * @returns 成功率（0.05-0.95）
 */
export function calculateSuccessRate(samuraiAttribute: number): number {
  const baseRate = 0.5 + (samuraiAttribute - 70) / 100;
  return Math.max(0.05, Math.min(0.95, baseRate));
}

/**
 * 计算修正系数
 * 公式：1 + (武士属性 - 70) × 1%
 * @param samuraiAttribute 武士属性值
 * @returns 修正系数
 */
export function calculateModifierCoefficient(samuraiAttribute: number): number {
  return 1 + (samuraiAttribute - 70) / 100;
}

/**
 * D100随机判定
 * @returns 1-100的随机数
 */
export function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

/**
 * 判定投资结果
 * 大成功: roll < 5
 * 成功: roll <= successRate * 100
 * 失败: roll > successRate * 100
 * @param roll D100结果
 * @param successRate 成功率（0-1）
 * @returns 投资结果类型
 */
export function determineOutcome(roll: number, successRate: number): InvestmentOutcome {
  if (roll < 5) {
    return 'critical_success';
  }
  if (roll <= successRate * 100) {
    return 'success';
  }
  return 'failure';
}

/**
 * 计算获得的点数
 * @param outcome 投资结果
 * @param basePoints 基础点数
 * @param modifierCoefficient 修正系数
 * @returns 获得的点数
 */
export function calculatePointsGained(
  outcome: InvestmentOutcome,
  basePoints: number,
  modifierCoefficient: number
): number {
  switch (outcome) {
    case 'critical_success':
      // 大成功：基础点数 × 2 × 修正系数
      return Math.floor(basePoints * 2 * modifierCoefficient);
    case 'success':
      // 成功：基础点数 × 修正系数
      return Math.floor(basePoints * modifierCoefficient);
    case 'failure':
      // 失败：0点
      return 0;
  }
}

/**
 * 获取投资等级信息
 * @param type 投资类型
 * @param points 当前点数
 * @returns 等级名称
 */
export function getInvestmentLevel(type: InvestmentType, points: number): string {
  const levels = getLevelsForType(type);
  for (const level of levels) {
    if (points >= level.minPoints && points <= level.maxPoints) {
      return level.name;
    }
  }
  // 默认返回第一级
  return levels[1]?.name || levels[0].name;
}

/**
 * 获取投资类型对应的等级表
 */
function getLevelsForType(type: InvestmentType) {
  switch (type) {
    case 'agriculture':
      return AGRICULTURE_LEVELS;
    case 'commerce':
      return COMMERCE_LEVELS;
    case 'navy':
      return NAVY_LEVELS;
    case 'armament':
      return ARMAMENT_LEVELS;
  }
}

/**
 * 获取投资预览
 * @param request 投资请求
 * @returns 投资预览信息
 */
export function getInvestmentPreview(request: InvestmentRequest): InvestmentPreview {
  const config = INVESTMENT_CONFIGS[request.type];
  const faction = getFactionById(request.factionId);
  const samurais = getSamurais();
  const samurai = samurais.find(s => s.id === request.samuraiId);

  // 基础验证
  if (!faction) {
    return {
      successRate: 0,
      modifierCoefficient: 0,
      expectedPointsOnSuccess: 0,
      expectedPointsOnCritical: 0,
      expectedPointsOnFailure: 0,
      cost: 0,
      samuraiAttribute: 0,
      attributeName: config.attributeName,
      canExecute: false,
      error: '势力不存在',
    };
  }

  if (!samurai) {
    return {
      successRate: 0,
      modifierCoefficient: 0,
      expectedPointsOnSuccess: 0,
      expectedPointsOnCritical: 0,
      expectedPointsOnFailure: 0,
      cost: 0,
      samuraiAttribute: 0,
      attributeName: config.attributeName,
      canExecute: false,
      error: '武士不存在',
    };
  }

  if (samurai.factionId !== request.factionId) {
    return {
      successRate: 0,
      modifierCoefficient: 0,
      expectedPointsOnSuccess: 0,
      expectedPointsOnCritical: 0,
      expectedPointsOnFailure: 0,
      cost: 0,
      samuraiAttribute: 0,
      attributeName: config.attributeName,
      canExecute: false,
      error: '武士不属于该势力',
    };
  }

  if (samurai.actionPoints <= 0) {
    return {
      successRate: 0,
      modifierCoefficient: 0,
      expectedPointsOnSuccess: 0,
      expectedPointsOnCritical: 0,
      expectedPointsOnFailure: 0,
      cost: 0,
      samuraiAttribute: 0,
      attributeName: config.attributeName,
      canExecute: false,
      error: '武士行动力不足',
    };
  }

  // 获取武士属性
  const samuraiAttribute = samurai[config.attributeKey];
  
  // 计算成功率和修正系数
  const successRate = calculateSuccessRate(samuraiAttribute);
  const modifierCoefficient = calculateModifierCoefficient(samuraiAttribute);

  // 计算花费
  let cost = config.baseCost;
  if (request.type === 'commerce' && request.amount) {
    cost = request.amount;
  }

  // 检查资金是否足够
  if (faction.treasury < cost) {
    return {
      successRate,
      modifierCoefficient,
      expectedPointsOnSuccess: 0,
      expectedPointsOnCritical: 0,
      expectedPointsOnFailure: 0,
      cost,
      samuraiAttribute,
      attributeName: config.attributeName,
      canExecute: false,
      error: '资金不足',
    };
  }

  // 计算预期点数
  const basePoints = request.type === 'commerce' 
    ? Math.floor((request.amount || 0) / 1000) // 商业系统：每1000石1点
    : config.basePoints;

  const expectedPointsOnSuccess = Math.floor(basePoints * modifierCoefficient);
  const expectedPointsOnCritical = Math.floor(basePoints * 2 * modifierCoefficient);
  const expectedPointsOnFailure = 0;

  return {
    successRate,
    modifierCoefficient,
    expectedPointsOnSuccess,
    expectedPointsOnCritical,
    expectedPointsOnFailure,
    cost,
    samuraiAttribute,
    attributeName: config.attributeName,
    canExecute: true,
  };
}


/**
 * 执行投资操作
 * @param request 投资请求
 * @param rollOverride 可选的骰子结果覆盖（用于测试）
 * @returns 投资结果
 */
export function executeInvestment(
  request: InvestmentRequest,
  rollOverride?: number
): InvestmentResult {
  const config = INVESTMENT_CONFIGS[request.type];
  
  // 获取预览以验证
  const preview = getInvestmentPreview(request);
  if (!preview.canExecute) {
    return {
      success: false,
      outcome: 'failure',
      pointsGained: 0,
      newPoints: 0,
      newLevel: '',
      message: preview.error || '无法执行投资',
      roll: 0,
      successRate: 0,
      error: preview.error,
    };
  }

  // 获取数据
  const factions = getFactions();
  const faction = factions.find(f => f.id === request.factionId);
  const samurais = getSamurais();
  const samurai = samurais.find(s => s.id === request.samuraiId);

  if (!faction || !samurai) {
    return {
      success: false,
      outcome: 'failure',
      pointsGained: 0,
      newPoints: 0,
      newLevel: '',
      message: '数据不存在',
      roll: 0,
      successRate: 0,
      error: '数据不存在',
    };
  }

  // 执行D100判定
  const roll = rollOverride !== undefined ? rollOverride : rollD100();
  const outcome = determineOutcome(roll, preview.successRate);

  // 计算获得的点数
  const basePoints = request.type === 'commerce'
    ? Math.floor((request.amount || 0) / 1000)
    : config.basePoints;
  const pointsGained = calculatePointsGained(outcome, basePoints, preview.modifierCoefficient);

  // 更新势力数据
  const currentPoints = faction[config.pointsKey];
  const newPoints = Math.min(100, currentPoints + pointsGained); // 点数上限100
  faction[config.pointsKey] = newPoints;
  faction.treasury -= preview.cost;

  // 更新武士行动力
  samurai.actionPoints -= 1;

  // 保存数据
  saveFactions(factions);
  saveSamurais(samurais);

  // 获取新等级
  const newLevel = getInvestmentLevel(request.type, newPoints);

  // 生成消息
  const outcomeMessages: Record<InvestmentOutcome, string> = {
    critical_success: `大成功！获得${pointsGained}点`,
    success: `成功！获得${pointsGained}点`,
    failure: '失败，未获得点数',
  };

  return {
    success: true,
    outcome,
    pointsGained,
    newPoints,
    newLevel,
    message: outcomeMessages[outcome],
    roll,
    successRate: preview.successRate,
  };
}

/**
 * 获取势力的投资状态
 * @param factionId 势力ID
 * @returns 投资状态信息
 */
export function getInvestmentStatus(factionId: string) {
  const faction = getFactionById(factionId);
  if (!faction) {
    return null;
  }

  return {
    treasury: faction.treasury,
    agriculturePoints: faction.agriculturePoints,
    agricultureLevel: getInvestmentLevel('agriculture', faction.agriculturePoints),
    commercePoints: faction.commercePoints,
    commerceLevel: getInvestmentLevel('commerce', faction.commercePoints),
    navyPoints: faction.navyPoints,
    navyLevel: getInvestmentLevel('navy', faction.navyPoints),
    armamentPoints: faction.armamentPoints,
    armamentLevel: getInvestmentLevel('armament', faction.armamentPoints),
  };
}

/**
 * 获取可执行投资的武士列表
 * @param factionId 势力ID
 * @returns 有行动力的武士列表
 */
export function getAvailableSamuraisForInvestment(factionId: string): Samurai[] {
  const samurais = getSamurais();
  return samurais.filter(s => s.factionId === factionId && s.actionPoints > 0);
}
