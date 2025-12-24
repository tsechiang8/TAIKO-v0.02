/**
 * 势力数据服务
 * 提供势力数据的获取、更新等功能
 */

import {
  FactionData,
  Territory,
  Samurai,
  Legion,
  SpecialProduct,
  Buff,
  DiplomacyRelation,
} from '../types';
import {
  getFactions,
  saveFactions,
  getFactionById,
  getTerritories,
  getSamurais,
  getLegions,
  getSpecialProducts,
} from '../storage';
import {
  calculateFactionData,
  FactionCalculationResult,
  ARMAMENT_LEVELS,
} from '../calculation';

/**
 * 完整的势力仪表盘数据
 */
export interface FactionDashboardData {
  // 基础信息
  id: string;
  name: string;
  lordName: string;
  taxRate: number;
  treasury: number;

  // 计算属性
  surfaceKokudaka: number;
  income: number;
  armyLevel: string;
  armyLevelNumber: number;

  // 武库数据
  rifles: number;
  horses: number;
  cannons: number;

  // 士兵数据
  totalSoldiers: number;
  idleSoldiers: number;
  maxRecruitableSoldiers: number;
  legionSoldiers: number;
  soldierMaintenanceRatio: number;

  // 投资点数
  agriculturePoints: number;
  commercePoints: number;
  navyPoints: number;
  armamentPoints: number;

  // 增益列表（最多10个）
  buffs: Buff[];

  // 详细计算数据
  territoryKokudaka: number;
  specialProductKokudaka: number;
  integrationBonus: number;
  industryKokudaka: number;
  bonusCoefficient: number;
  growthRate: number;

  // 维护费明细
  maintenanceCost: {
    infantryCost: number;      // 步卒维护费
    horseCost: number;         // 战马维护费
    rifleCost: number;         // 铁炮维护费
    cannonCost: number;        // 大筒维护费
    legionExtraCost: number;   // 军团额外费用
    samuraiSalary: number;     // 武士俸禄
    subtotal: number;          // 小计（修正前）
    armamentModifier: number;  // 武备等级修正系数
    total: number;             // 总维护费（修正后）
  };

  // 关联数据
  territories: Territory[];
  samurais: Samurai[];
  legions: Legion[];
  diplomacy: DiplomacyRelation[];
}

/**
 * 势力列表项（管理员用）
 */
export interface FactionListItem {
  id: string;
  name: string;
  lordName: string;
  code: string;
  taxRate: number;
  surfaceKokudaka: number;
  totalSoldiers: number;
}

/**
 * 获取势力完整仪表盘数据
 * @param factionId 势力ID
 * @returns 势力仪表盘数据或null
 */
export function getFactionDashboard(factionId: string): FactionDashboardData | null {
  const faction = getFactionById(factionId);
  if (!faction) {
    return null;
  }

  // 获取关联数据
  const allTerritories = getTerritories();
  const allSamurais = getSamurais();
  const allLegions = getLegions();
  const specialProducts = getSpecialProducts();

  // 筛选该势力的数据
  const territories = allTerritories.filter(t => t.factionId === factionId);
  const samurais = allSamurais.filter(s => s.factionId === factionId);
  const legions = allLegions.filter(l => l.factionId === factionId);

  // 计算势力数据
  const calculation = calculateFactionData(
    faction,
    territories,
    allTerritories,
    legions,
    samurais,
    specialProducts
  );

  // 构建仪表盘数据
  return {
    // 基础信息
    id: faction.id,
    name: faction.name,
    lordName: faction.lordName,
    taxRate: faction.taxRate,
    treasury: faction.treasury,

    // 计算属性
    surfaceKokudaka: calculation.surfaceKokudaka,
    income: calculation.income,
    armyLevel: calculation.armamentLevel.name,
    armyLevelNumber: calculation.armamentLevel.level,

    // 武库数据（库存）
    rifles: faction.rifles,
    horses: faction.horses,
    cannons: faction.cannons,

    // 士兵数据
    totalSoldiers: calculation.totalSoldiers,
    idleSoldiers: faction.idleSoldiers,
    maxRecruitableSoldiers: calculation.maxRecruitableSoldiers,
    legionSoldiers: calculation.legionSoldiers,
    soldierMaintenanceRatio: calculation.soldierMaintenanceRatio,

    // 投资点数
    agriculturePoints: faction.agriculturePoints,
    commercePoints: faction.commercePoints,
    navyPoints: faction.navyPoints,
    armamentPoints: faction.armamentPoints,

    // 增益列表（最多10个）
    buffs: faction.buffs.slice(0, 10),

    // 详细计算数据
    territoryKokudaka: calculation.territoryKokudaka,
    specialProductKokudaka: calculation.specialProductKokudaka,
    integrationBonus: calculation.integrationBonus,
    industryKokudaka: faction.industryKokudaka,
    bonusCoefficient: calculation.bonusCoefficient,
    growthRate: calculation.growthRate,

    // 维护费明细
    maintenanceCost: calculation.maintenanceCost,

    // 关联数据
    territories,
    samurais,
    legions,
    diplomacy: faction.diplomacy,
  };
}

/**
 * 获取所有势力列表（管理员用）
 * @returns 势力列表
 */
export function getAllFactionsList(): FactionListItem[] {
  const factions = getFactions();
  const allTerritories = getTerritories();
  const allLegions = getLegions();
  const allSamurais = getSamurais();
  const specialProducts = getSpecialProducts();

  return factions.map(faction => {
    const territories = allTerritories.filter(t => t.factionId === faction.id);
    const legions = allLegions.filter(l => l.factionId === faction.id);
    const samurais = allSamurais.filter(s => s.factionId === faction.id);

    const calculation = calculateFactionData(
      faction,
      territories,
      allTerritories,
      legions,
      samurais,
      specialProducts
    );

    return {
      id: faction.id,
      name: faction.name,
      lordName: faction.lordName,
      code: faction.code,
      taxRate: faction.taxRate,
      surfaceKokudaka: calculation.surfaceKokudaka,
      totalSoldiers: calculation.totalSoldiers,
    };
  });
}

/**
 * 更新势力代码
 * @param factionId 势力ID
 * @param newCode 新代码
 * @returns 是否成功
 */
export function updateFactionCode(factionId: string, newCode: string): { success: boolean; error?: string } {
  if (!newCode || newCode.trim() === '') {
    return { success: false, error: '代码不能为空' };
  }

  const trimmedCode = newCode.trim();
  const factions = getFactions();
  
  // 检查代码是否已被使用
  const existingFaction = factions.find(f => f.code === trimmedCode && f.id !== factionId);
  if (existingFaction) {
    return { success: false, error: '该代码已被其他势力使用' };
  }

  // 查找并更新势力
  const factionIndex = factions.findIndex(f => f.id === factionId);
  if (factionIndex === -1) {
    return { success: false, error: '势力不存在' };
  }

  factions[factionIndex].code = trimmedCode;
  saveFactions(factions);

  return { success: true };
}

/**
 * 获取势力基础信息（用于验证等场景）
 * @param factionId 势力ID
 * @returns 势力基础信息或null
 */
export function getFactionBasicInfo(factionId: string): { id: string; name: string; lordName: string } | null {
  const faction = getFactionById(factionId);
  if (!faction) {
    return null;
  }

  return {
    id: faction.id,
    name: faction.name,
    lordName: faction.lordName,
  };
}

/**
 * 检查势力是否存在
 * @param factionId 势力ID
 * @returns 是否存在
 */
export function factionExists(factionId: string): boolean {
  return getFactionById(factionId) !== undefined;
}
