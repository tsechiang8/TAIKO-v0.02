import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  getFactions,
  saveFactions,
  getTerritories,
  saveTerritories,
  getSamurais,
  saveSamurais,
  getLegions,
  saveLegions,
  getSpecialProducts,
  saveSpecialProducts,
  getGameState,
  saveGameState,
  createSnapshot,
  restoreFromSnapshot,
  getAllData,
} from './index';
import { FactionData, Territory, Samurai, Legion, SpecialProduct, GameState } from '../types';

// 测试数据目录
const TEST_DATA_DIR = path.join(__dirname, '../../data');
const TEST_SNAPSHOTS_DIR = path.join(TEST_DATA_DIR, 'snapshots');

// 清理测试数据
function cleanupTestData(): void {
  const files = [
    'factions.json',
    'territories.json',
    'samurais.json',
    'legions.json',
    'special-products.json',
    'game-state.json',
    'operation-records.json',
    'error-reports.json',
  ];

  for (const file of files) {
    const filePath = path.join(TEST_DATA_DIR, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // 清理快照
  if (fs.existsSync(TEST_SNAPSHOTS_DIR)) {
    const snapshotFiles = fs.readdirSync(TEST_SNAPSHOTS_DIR);
    for (const file of snapshotFiles) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(TEST_SNAPSHOTS_DIR, file));
      }
    }
  }
}

// 生成器：势力数据
const factionArbitrary: fc.Arbitrary<FactionData> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  lordName: fc.string({ minLength: 1, maxLength: 10 }),
  code: fc.string({ minLength: 4, maxLength: 20 }),
  taxRate: fc.constantFrom(0.4, 0.6, 0.8),
  treasury: fc.integer({ min: 0, max: 1000000 }),
  idleSoldiers: fc.integer({ min: 0, max: 100000 }),
  rifles: fc.integer({ min: 0, max: 10000 }),
  horses: fc.integer({ min: 0, max: 10000 }),
  cannons: fc.integer({ min: 0, max: 1000 }),
  agriculturePoints: fc.integer({ min: 0, max: 100 }),
  commercePoints: fc.integer({ min: 0, max: 100 }),
  navyPoints: fc.integer({ min: 0, max: 100 }),
  armamentPoints: fc.integer({ min: 0, max: 100 }),
  industryKokudaka: fc.integer({ min: 0, max: 100000 }),
  territoryIds: fc.array(fc.uuid(), { maxLength: 10 }),
  samuraiIds: fc.array(fc.uuid(), { maxLength: 20 }),
  legionIds: fc.array(fc.uuid(), { maxLength: 10 }),
  diplomacy: fc.array(
    fc.record({
      targetFactionId: fc.uuid(),
      targetFactionName: fc.string({ minLength: 1, maxLength: 20 }),
      relation: fc.constantFrom('alliance', 'hostile', 'neutral'),
    }),
    { maxLength: 5 }
  ),
  buffs: fc.array(
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 20 }),
      effect: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    { maxLength: 5 }
  ),
});

// 生成器：领地数据
const territoryArbitrary: fc.Arbitrary<Territory> = fc.record({
  id: fc.uuid(),
  provinceName: fc.string({ minLength: 1, maxLength: 10 }),
  districtName: fc.string({ minLength: 1, maxLength: 10 }),
  castleName: fc.string({ minLength: 1, maxLength: 10 }),
  castleLevel: fc.integer({ min: 1, max: 7 }),
  baseKokudaka: fc.integer({ min: 1000, max: 100000 }),
  specialProduct1: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  specialProduct2: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  specialProduct3: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  developableProduct: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  factionId: fc.option(fc.uuid(), { nil: undefined }),
  garrisonLegionId: fc.option(fc.uuid(), { nil: undefined }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// 生成器：武士数据
const samuraiArbitrary: fc.Arbitrary<Samurai> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 10 }),
  type: fc.constantFrom('warrior', 'strategist') as fc.Arbitrary<'warrior' | 'strategist'>,
  martialValue: fc.integer({ min: 1, max: 100 }),
  civilValue: fc.integer({ min: 1, max: 100 }),
  factionId: fc.uuid(),
  isIdle: fc.boolean(),
  actionPoints: fc.integer({ min: 0, max: 2 }),
  currentLegionId: fc.option(fc.uuid(), { nil: undefined }),
});

// 生成器：军团数据
const legionArbitrary: fc.Arbitrary<Legion> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 8 }),
  commanderId: fc.uuid(),
  commanderName: fc.string({ minLength: 1, maxLength: 10 }),
  soldierCount: fc.integer({ min: 1, max: 10000 }),
  rifles: fc.integer({ min: 0, max: 5000 }),
  horses: fc.integer({ min: 0, max: 3000 }),
  cannons: fc.integer({ min: 0, max: 100 }),
  locationId: fc.uuid(),
  locationName: fc.string({ minLength: 1, maxLength: 10 }),
  factionId: fc.uuid(),
});

// 生成器：特产数据
const specialProductArbitrary: fc.Arbitrary<SpecialProduct> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 10 }),
  annualKokudaka: fc.integer({ min: 0, max: 10000 }),
  annualHorses: fc.integer({ min: 0, max: 100 }),
  soldierCapacityBonus: fc.integer({ min: 0, max: 1000 }),
  kokudakaBonus: fc.float({ min: 0, max: 0.5 }),
  otherEffects: fc.string({ minLength: 0, maxLength: 100 }),
});

// 生成器：游戏状态
const gameStateArbitrary: fc.Arbitrary<GameState> = fc.record({
  currentYear: fc.integer({ min: 1, max: 100 }),
  isLocked: fc.boolean(),
  adminCode: fc.string({ minLength: 4, maxLength: 20 }),
});

describe('数据存储层', () => {
  beforeEach(() => {
    cleanupTestData();
  });

  afterEach(() => {
    cleanupTestData();
  });

  /**
   * **Feature: gekokujo-assistant, Property 10: 数据回溯一致性**
   * **Validates: Requirements 9.7**
   * 
   * *For any* 回溯操作，执行回溯后的系统状态必须与该操作记录完成时的快照状态完全一致。
   */
  it('Property 10: 数据回溯一致性 - 回溯后系统状态与快照状态一致', () => {
    fc.assert(
      fc.property(
        fc.array(factionArbitrary, { minLength: 0, maxLength: 3 }),
        fc.array(territoryArbitrary, { minLength: 0, maxLength: 5 }),
        fc.array(samuraiArbitrary, { minLength: 0, maxLength: 5 }),
        fc.array(legionArbitrary, { minLength: 0, maxLength: 3 }),
        fc.array(specialProductArbitrary, { minLength: 0, maxLength: 3 }),
        gameStateArbitrary,
        // 修改后的数据
        fc.array(factionArbitrary, { minLength: 0, maxLength: 3 }),
        fc.array(territoryArbitrary, { minLength: 0, maxLength: 5 }),
        (
          initialFactions,
          initialTerritories,
          initialSamurais,
          initialLegions,
          initialProducts,
          initialGameState,
          modifiedFactions,
          modifiedTerritories
        ) => {
          // 1. 保存初始数据
          saveFactions(initialFactions);
          saveTerritories(initialTerritories);
          saveSamurais(initialSamurais);
          saveLegions(initialLegions);
          saveSpecialProducts(initialProducts);
          saveGameState(initialGameState);

          // 2. 创建快照
          const snapshot = createSnapshot('test-operation-1');

          // 3. 修改数据（模拟后续操作）
          saveFactions(modifiedFactions);
          saveTerritories(modifiedTerritories);

          // 4. 执行回溯
          const restored = restoreFromSnapshot(snapshot.id);
          expect(restored).toBe(true);

          // 5. 验证回溯后的数据与快照一致
          const currentData = getAllData();

          // 深度比较所有数据
          expect(currentData.factions).toEqual(initialFactions);
          expect(currentData.territories).toEqual(initialTerritories);
          expect(currentData.samurais).toEqual(initialSamurais);
          expect(currentData.legions).toEqual(initialLegions);
          expect(currentData.specialProducts).toEqual(initialProducts);
          expect(currentData.gameState).toEqual(initialGameState);
        }
      ),
      { numRuns: 100 }
    );
  });
});
