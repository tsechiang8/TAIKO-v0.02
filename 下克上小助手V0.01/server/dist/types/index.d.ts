export interface Territory {
    id: string;
    provinceName: string;
    districtName: string;
    castleName: string;
    castleLevel: number;
    baseKokudaka: number;
    provinceTotalKokudaka?: number;
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
    age?: number;
    type: 'warrior' | 'strategist';
    martialValue: number;
    civilValue: number;
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
    taxRate: number;
    treasury: number;
    idleSoldiers: number;
    rifles: number;
    horses: number;
    cannons: number;
    agriculturePoints: number;
    commercePoints: number;
    navyPoints: number;
    armamentPoints: number;
    industryKokudaka: number;
    territoryIds: string[];
    samuraiIds: string[];
    legionIds: string[];
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
//# sourceMappingURL=index.d.ts.map