// 核心数据类型定义

export interface Territory {
  id: string;
  provinceName: string; // 令制国
  districtName: string; // 郡名
  castleName: string;
  castleLevel: number; // 1-7
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

export interface Samurai {
  id: string;
  name: string;
  age?: number; // 年龄
  type: 'warrior' | 'strategist'; // 猛将/智将
  martialValue: number; // 武功
  civilValue: number; // 文治
  factionId: string;
  isIdle: boolean;
  actionPoints: number;
  currentLegionId?: string;
}

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

export interface DiplomacyRelation {
  targetFactionId: string;
  targetFactionName: string;
  relation: string;
}

export interface Buff {
  name: string;
  effect: string;
}

export interface SpecialProduct {
  name: string;
  annualKokudaka: number;
  annualHorses: number;
  soldierCapacityBonus: number;
  kokudakaBonus: number;
  otherEffects: string;
}

export interface FactionData {
  id: string;
  name: string;
  lordName: string;
  code: string;
  taxRate: number; // 0.4, 0.6, 0.8
  treasury: number;
  
  // 库存
  idleSoldiers: number;
  rifles: number;
  horses: number;
  cannons: number;
  
  // 投资点数
  agriculturePoints: number;
  commercePoints: number;
  navyPoints: number;
  armamentPoints: number;
  
  // 产业石高
  industryKokudaka: number;
  
  // 关联数据ID
  territoryIds: string[];
  samuraiIds: string[];
  legionIds: string[];
  
  // 外交和增益
  diplomacy: DiplomacyRelation[];
  buffs: Buff[];
}

export interface User {
  type: 'admin' | 'player';
  factionId?: string;
  factionName?: string;
}

export interface AuthResult {
  success: boolean;
  userType: 'admin' | 'player';
  factionId?: string;
  errorMessage?: string;
}

export interface OperationRecord {
  id: string;
  timestamp: string;
  userId: string;
  userType: 'admin' | 'player';
  factionId?: string;
  action: string;
  details: Record<string, unknown>;
  snapshotId?: string;
}

export interface ErrorReport {
  id: string;
  playerId: string;
  playerName: string;
  factionId: string;
  timestamp: string;
  errorType: 'manual' | 'automatic';
  errorMessage?: string;
  recentOperations: OperationRecord[];
  resolved: boolean;
}

export interface GameState {
  currentYear: number;
  isLocked: boolean;
  adminCode: string;
}

// 数据快照
export interface DataSnapshot {
  id: string;
  timestamp: string;
  operationId: string;
  data: {
    factions: FactionData[];
    territories: Territory[];
    samurais: Samurai[];
    legions: Legion[];
    specialProducts: SpecialProduct[];
    gameState: GameState;
  };
}
