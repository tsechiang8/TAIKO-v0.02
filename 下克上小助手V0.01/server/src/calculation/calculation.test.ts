/**
 * 核心计算引擎属性测试
 * Feature: gekokujo-assistant
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateSurfaceKokudaka,
  calculateIncome,
  calculateMaxRecruitableSoldiers,
  calculateSoldierMaintenanceRatio,
  getBonusCoefficient,
  getGrowthRate,
  calculateMaintenanceCost,
  getArmamentLevel,
  MAINTENANCE_RATIO_EFFECTS,
  ARMAMENT_LEVELS,
  TAX_RATE_SOLDIER_MULTIPLIERS,
} from './index';

/**
 * Property 4: 表面石高计算正确性
 * *For any* 势力数据，表面石高的计算结果必须等于：
 * 领地石高 × (1 + 加成系数) + 特产石高 + 领内财产 + 产业石高
 * **Validates: Requirements 2.3, 11.1**
 */
describe('Property 4: 表面石高计算正确性', () => {
  it('should correctly calculate surface kokudaka for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),  // territoryKokudaka: 0-1000000
        fc.double({ min: -0.5, max: 0.5, noNaN: true }),  // bonusCoefficient
        fc.nat(100000),   // specialProductKokudaka
        fc.nat(100000),   // integrationBonus
        fc.nat(100000),   // industryKokudaka
        (territoryKokudaka, bonusCoefficient, specialProductKokudaka, integrationBonus, industryKokudaka) => {
          const result = calculateSurfaceKokudaka({
            territoryKokudaka,
            bonusCoefficient,
            specialProductKokudaka,
            integrationBonus,
            industryKokudaka,
          });

          // 验证公式：领地石高 × (1 + 加成系数) + 特产石高 + 领内财产 + 产业石高
          const expected = 
            territoryKokudaka * (1 + bonusCoefficient) +
            specialProductKokudaka +
            integrationBonus +
            industryKokudaka;

          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return non-negative value when all inputs are non-negative and bonus >= -1', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),
        fc.double({ min: -1, max: 1, noNaN: true }),
        fc.nat(100000),
        fc.nat(100000),
        fc.nat(100000),
        (territoryKokudaka, bonusCoefficient, specialProductKokudaka, integrationBonus, industryKokudaka) => {
          const result = calculateSurfaceKokudaka({
            territoryKokudaka,
            bonusCoefficient,
            specialProductKokudaka,
            integrationBonus,
            industryKokudaka,
          });

          // 当加成系数 >= -1 时，结果应该 >= 0
          if (bonusCoefficient >= -1) {
            expect(result).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 5: 收入计算正确性
 * *For any* 势力数据，收入的计算结果必须等于：表面石高 × 税率 × 0.4
 * **Validates: Requirements 2.2, 11.2**
 */
describe('Property 5: 收入计算正确性', () => {
  it('should correctly calculate income as surfaceKokudaka × taxRate × 0.4', () => {
    fc.assert(
      fc.property(
        fc.nat(10000000),  // surfaceKokudaka: 0-10000000
        fc.constantFrom(0.4, 0.6, 0.8),  // valid tax rates
        (surfaceKokudaka, taxRate) => {
          const result = calculateIncome(surfaceKokudaka, taxRate);
          const expected = surfaceKokudaka * taxRate * 0.4;
          
          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return non-negative income for non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.nat(10000000),
        fc.constantFrom(0.4, 0.6, 0.8),
        (surfaceKokudaka, taxRate) => {
          const result = calculateIncome(surfaceKokudaka, taxRate);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should scale linearly with surface kokudaka', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),
        fc.constantFrom(0.4, 0.6, 0.8),
        fc.integer({ min: 2, max: 10 }),
        (surfaceKokudaka, taxRate, multiplier) => {
          const income1 = calculateIncome(surfaceKokudaka, taxRate);
          const income2 = calculateIncome(surfaceKokudaka * multiplier, taxRate);
          
          // Use tolerance of 5 decimal places for floating point comparison
          expect(income2).toBeCloseTo(income1 * multiplier, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: 士兵上限计算正确性
 * *For any* 势力数据和税率，士兵上限的计算结果必须符合公式：
 * 税率40%时为领地石高×230，税率60%时为领地石高×200，税率80%时为领地石高×180
 * **Validates: Requirements 11.3**
 */
describe('Property 6: 士兵上限计算正确性', () => {
  it('should correctly calculate max recruitable soldiers based on tax rate', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),  // territoryKokudaka: 0-100000
        fc.constantFrom(0.4, 0.6, 0.8),  // valid tax rates
        (territoryKokudaka, taxRate) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate);
          
          // 根据税率确定预期乘数
          const expectedMultiplier = TAX_RATE_SOLDIER_MULTIPLIERS[taxRate];
          const expected = Math.floor(territoryKokudaka * expectedMultiplier);
          
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use correct multiplier for each tax rate', () => {
    // 税率40%: ×230
    fc.assert(
      fc.property(
        fc.nat(100000),
        (territoryKokudaka) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, 0.4);
          expect(result).toBe(Math.floor(territoryKokudaka * 230));
        }
      ),
      { numRuns: 100 }
    );

    // 税率60%: ×200
    fc.assert(
      fc.property(
        fc.nat(100000),
        (territoryKokudaka) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, 0.6);
          expect(result).toBe(Math.floor(territoryKokudaka * 200));
        }
      ),
      { numRuns: 100 }
    );

    // 税率80%: ×180
    fc.assert(
      fc.property(
        fc.nat(100000),
        (territoryKokudaka) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, 0.8);
          expect(result).toBe(Math.floor(territoryKokudaka * 180));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return non-negative value for non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),
        fc.constantFrom(0.4, 0.6, 0.8),
        (territoryKokudaka, taxRate) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate);
          expect(result).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return integer values (floor)', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),
        fc.constantFrom(0.4, 0.6, 0.8),
        (territoryKokudaka, taxRate) => {
          const result = calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate);
          expect(Number.isInteger(result)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should add special product soldier bonus to the limit', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),
        fc.constantFrom(0.4, 0.6, 0.8),
        fc.nat(1000),  // specialProductSoldierBonus
        (territoryKokudaka, taxRate, bonus) => {
          const baseResult = calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate, 0);
          const resultWithBonus = calculateMaxRecruitableSoldiers(territoryKokudaka, taxRate, bonus);
          
          expect(resultWithBonus).toBe(baseResult + bonus);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Property 7: 士兵维持比区间效果
 * *For any* 士兵维持比值，系统返回的加成系数和自然增长率必须符合预定义的区间表
 * **Validates: Requirements 11.4**
 */
describe('Property 7: 士兵维持比区间效果', () => {
  it('should return correct bonus coefficient for any maintenance ratio', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        (maintenanceRatio) => {
          const result = getBonusCoefficient(maintenanceRatio);
          
          // 找到对应的区间
          const expectedEffect = MAINTENANCE_RATIO_EFFECTS.find(
            effect => maintenanceRatio >= effect.min && maintenanceRatio <= effect.max
          );
          
          if (expectedEffect) {
            expect(result).toBe(expectedEffect.bonusCoefficient);
          } else {
            // 超出范围时应返回最后一个区间的值
            expect(result).toBe(MAINTENANCE_RATIO_EFFECTS[MAINTENANCE_RATIO_EFFECTS.length - 1].bonusCoefficient);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct growth rate for any maintenance ratio', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1, noNaN: true }),
        (maintenanceRatio) => {
          const result = getGrowthRate(maintenanceRatio);
          
          // 找到对应的区间
          const expectedEffect = MAINTENANCE_RATIO_EFFECTS.find(
            effect => maintenanceRatio >= effect.min && maintenanceRatio <= effect.max
          );
          
          if (expectedEffect) {
            expect(result).toBe(expectedEffect.growthRate);
          } else {
            // 超出范围时应返回最后一个区间的值
            expect(result).toBe(MAINTENANCE_RATIO_EFFECTS[MAINTENANCE_RATIO_EFFECTS.length - 1].growthRate);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate maintenance ratio correctly', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),  // totalSoldiers
        fc.integer({ min: 1, max: 100000 }),  // maxRecruitableSoldiers (must be > 0)
        (totalSoldiers, maxRecruitableSoldiers) => {
          const result = calculateSoldierMaintenanceRatio(totalSoldiers, maxRecruitableSoldiers);
          const expected = Math.min(1, totalSoldiers / maxRecruitableSoldiers);
          
          expect(result).toBeCloseTo(expected, 10);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case when maxRecruitableSoldiers is 0', () => {
    fc.assert(
      fc.property(
        fc.nat(100000),  // totalSoldiers
        (totalSoldiers) => {
          const result = calculateSoldierMaintenanceRatio(totalSoldiers, 0);
          
          // 当上限为0时，有士兵返回1，无士兵返回0
          if (totalSoldiers > 0) {
            expect(result).toBe(1);
          } else {
            expect(result).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all interval boundaries are covered', () => {
    // 测试每个区间的边界值
    const testCases = [
      { ratio: 0, expectedBonus: 0.12, expectedGrowth: 0.03 },
      { ratio: 0.20, expectedBonus: 0.12, expectedGrowth: 0.03 },
      { ratio: 0.21, expectedBonus: 0.06, expectedGrowth: 0.01 },
      { ratio: 0.45, expectedBonus: 0.06, expectedGrowth: 0.01 },
      { ratio: 0.46, expectedBonus: 0, expectedGrowth: -0.01 },
      { ratio: 0.60, expectedBonus: 0, expectedGrowth: -0.01 },
      { ratio: 0.61, expectedBonus: -0.10, expectedGrowth: -0.02 },
      { ratio: 0.80, expectedBonus: -0.10, expectedGrowth: -0.02 },
      { ratio: 0.81, expectedBonus: -0.20, expectedGrowth: -0.04 },
      { ratio: 0.94, expectedBonus: -0.20, expectedGrowth: -0.04 },
      { ratio: 0.95, expectedBonus: -0.30, expectedGrowth: -0.08 },
      { ratio: 1.00, expectedBonus: -0.30, expectedGrowth: -0.08 },
    ];

    for (const { ratio, expectedBonus, expectedGrowth } of testCases) {
      expect(getBonusCoefficient(ratio)).toBe(expectedBonus);
      expect(getGrowthRate(ratio)).toBe(expectedGrowth);
    }
  });
});


/**
 * Property 9: 维护费计算正确性
 * *For any* 势力数据，年度维护费计算必须等于：
 * 步卒×4 + 战马×12 + 铁炮×3 + 大筒×8 + 军团士兵×4 + 武士数×2000，
 * 并应用武备等级的维护费修正
 * **Validates: Requirements 11.5, 11.6, 11.7**
 */
describe('Property 9: 维护费计算正确性', () => {
  it('should correctly calculate maintenance cost components', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),   // totalSoldiers
        fc.nat(5000),    // legionSoldiers (must be <= totalSoldiers)
        fc.nat(1000),    // horses
        fc.nat(1000),    // rifles
        fc.nat(100),     // cannons
        fc.nat(50),      // samuraiCount
        fc.integer({ min: 0, max: 100 }),  // armamentPoints
        (totalSoldiers, legionSoldiers, horses, rifles, cannons, samuraiCount, armamentPoints) => {
          // 确保军团士兵不超过总士兵
          const actualLegionSoldiers = Math.min(legionSoldiers, totalSoldiers);
          
          const result = calculateMaintenanceCost({
            totalSoldiers,
            legionSoldiers: actualLegionSoldiers,
            horses,
            rifles,
            cannons,
            samuraiCount,
            armamentPoints,
          });

          // 验证各项基础维护费
          expect(result.infantryCost).toBe(totalSoldiers * 4);
          expect(result.horseCost).toBe(horses * 12);
          expect(result.rifleCost).toBe(rifles * 3);
          expect(result.cannonCost).toBe(cannons * 8);  // 大筒维护费8石/门
          expect(result.legionExtraCost).toBe(actualLegionSoldiers * 4);
          expect(result.samuraiSalary).toBe(samuraiCount * 2000);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply armament level modifier correctly', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(5000),
        fc.nat(1000),
        fc.nat(1000),
        fc.nat(100),
        fc.nat(50),
        fc.integer({ min: 0, max: 100 }),
        (totalSoldiers, legionSoldiers, horses, rifles, cannons, samuraiCount, armamentPoints) => {
          const actualLegionSoldiers = Math.min(legionSoldiers, totalSoldiers);
          
          const result = calculateMaintenanceCost({
            totalSoldiers,
            legionSoldiers: actualLegionSoldiers,
            horses,
            rifles,
            cannons,
            samuraiCount,
            armamentPoints,
          });

          // 获取武备等级修正
          const armamentLevel = getArmamentLevel(armamentPoints);
          expect(result.armamentModifier).toBe(armamentLevel.maintenanceModifier);

          // 计算军事维护费小计
          const militaryCost = 
            result.infantryCost + 
            result.horseCost + 
            result.rifleCost + 
            result.cannonCost + 
            result.legionExtraCost;

          // 验证总费用 = 修正后军事维护费 + 武士俸禄
          const expectedTotal = militaryCost * (1 + armamentLevel.maintenanceModifier) + result.samuraiSalary;
          expect(result.total).toBeCloseTo(expectedTotal, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return non-negative total for non-negative inputs', () => {
    fc.assert(
      fc.property(
        fc.nat(10000),
        fc.nat(5000),
        fc.nat(1000),
        fc.nat(1000),
        fc.nat(100),
        fc.nat(50),
        fc.integer({ min: 0, max: 100 }),
        (totalSoldiers, legionSoldiers, horses, rifles, cannons, samuraiCount, armamentPoints) => {
          const actualLegionSoldiers = Math.min(legionSoldiers, totalSoldiers);
          
          const result = calculateMaintenanceCost({
            totalSoldiers,
            legionSoldiers: actualLegionSoldiers,
            horses,
            rifles,
            cannons,
            samuraiCount,
            armamentPoints,
          });

          expect(result.total).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify armament level lookup is correct', () => {
    // 测试武备等级边界
    const testCases = [
      { points: 0, expectedLevel: 0, expectedModifier: 0.20 },
      { points: 1, expectedLevel: 1, expectedModifier: 0 },
      { points: 15, expectedLevel: 1, expectedModifier: 0 },
      { points: 16, expectedLevel: 2, expectedModifier: -0.05 },
      { points: 30, expectedLevel: 2, expectedModifier: -0.05 },
      { points: 31, expectedLevel: 3, expectedModifier: -0.10 },
      { points: 50, expectedLevel: 3, expectedModifier: -0.10 },
      { points: 51, expectedLevel: 4, expectedModifier: -0.20 },
      { points: 70, expectedLevel: 4, expectedModifier: -0.20 },
      { points: 71, expectedLevel: 5, expectedModifier: -0.30 },
      { points: 85, expectedLevel: 5, expectedModifier: -0.30 },
      { points: 86, expectedLevel: 6, expectedModifier: -0.40 },
      { points: 99, expectedLevel: 6, expectedModifier: -0.40 },
      { points: 100, expectedLevel: 7, expectedModifier: -0.50 },
    ];

    for (const { points, expectedLevel, expectedModifier } of testCases) {
      const level = getArmamentLevel(points);
      expect(level.level).toBe(expectedLevel);
      expect(level.maintenanceModifier).toBe(expectedModifier);
    }
  });
});
