/**
 * 前端类型定义
 */

// 用户类型
export interface User {
  type: 'admin' | 'player';
  factionId?: string;
  factionName?: string;
}

// 认证结果
export interface AuthResult {
  success: boolean;
  userType: 'admin' | 'player';
  factionId?: string;
  sessionId?: string;
  error?: string;
}

// 领地
export interface Territory {
  id: string;
  provinceName: string;
  districtName: string;
  castleName: string;
  castleLevel: number;
  baseKokudaka: number;
  provinceTotalKokudaka?: number; // 令制国总石高（用于计算整合奖励门槛）
  specialProduct1?: string;
  specialProduct2?: string;
  specialProduct3?: string;
  developableProduct?: string;
  factionId?: string;
  garrisonLegionId?: string;
  description?: string;
}

// 武士
export interface Samurai {
  id: string;
  name: string;
  age?: number;
  type: 'warrior' | 'strategist';
  martialValue: number;
  civilValue: number;
  factionId: string;
  isIdle: boolean;
  actionPoints: number;
  currentLegionId?: string;
}

// 军团
export interface Legion {
  id: string;
  name: string;
  commanderId: string;
  commanderName: string;
  soldierCount: number;
  rifles: number;
  horses: number;
  cannons: number;
  locationId: string;
  locationName: string;
  factionId: string;
}

// 外交关系
export interface DiplomacyRelation {
  targetFactionId: string;
  targetFactionName: string;
  relation: string;
}

// 增益
export interface Buff {
  name: string;
  effect: string;
}

// 维护费明细
export interface MaintenanceCost {
  infantryCost: number;      // 步卒维护费
  horseCost: number;         // 战马维护费
  rifleCost: number;         // 铁炮维护费
  cannonCost: number;        // 大筒维护费
  legionExtraCost: number;   // 军团额外费用
  samuraiSalary: number;     // 武士俸禄
  subtotal: number;          // 小计（修正前）
  armamentModifier: number;  // 武备等级修正系数
  total: number;             // 总维护费（修正后）
}

// 势力仪表盘数据
export interface FactionDashboardData {
  id: string;
  name: string;
  lordName: string;
  taxRate: number;
  treasury: number;
  surfaceKokudaka: number;
  income: number;
  armyLevel: string;
  armyLevelNumber: number;
  rifles: number;
  horses: number;
  cannons: number;
  totalSoldiers: number;
  idleSoldiers: number;
  maxRecruitableSoldiers: number;
  legionSoldiers: number;
  soldierMaintenanceRatio: number;
  agriculturePoints: number;
  commercePoints: number;
  navyPoints: number;
  armamentPoints: number;
  buffs: Buff[];
  territoryKokudaka: number;
  specialProductKokudaka: number;
  integrationBonus: number;
  industryKokudaka: number;
  bonusCoefficient: number;
  growthRate: number;
  maintenanceCost: MaintenanceCost;
  territories: Territory[];
  samurais: Samurai[];
  legions: Legion[];
  diplomacy: DiplomacyRelation[];
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
