/**
 * 投资系统属性测试
 * Feature: gekokujo-assistant
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateSuccessRate,
  calculateModifierCoefficient,
  determineOutcome,
  calculatePointsGained,
  getInvestmentLevel,
  INVESTMENT_CONFIGS,
  AGRICULTURE_LEVELS,
  COMMERCE_LEVELS,
  NAVY_LEVELS,
  ARMAMENT_LEVELS,
} from './investment';

/**
 * Property 8: 投资判定正确性
 * *For any* 投资操作，成功率计算必须等于 50% + (武士属性 - 70)%，且锁定在5%-95%范围内；
 * 修正系数必须等于 1 + (武士属性 - 70) × 1%。
 * **Validates: Requirements 7.5, 7.6**
 */
describe('Property 8: 投资判定正确性', () => {
  describe('成功率计算', () => {
    it('should calculate success rate as 50% + (attribute - 70)%, clamped to 5%-95%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 150 }), // 武士属性值范围
          (samuraiAttribute) => {
            const result = calculateSuccessRate(samuraiAttribute);
            
            // 计算预期值：50% + (属性 - 70)%
            const rawRate = 0.5 + (samuraiAttribute - 70) / 100;
            const expected = Math.max(0.05, Math.min(0.95, rawRate));
            
            expect(result).toBeCloseTo(expected, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always return success rate between 5% and 95%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: 300 }), // 极端属性值测试
          (samuraiAttribute) => {
            const result = calculateSuccessRate(samuraiAttribute);
            
            expect(result).toBeGreaterThanOrEqual(0.05);
            expect(result).toBeLessThanOrEqual(0.95);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 50% for attribute value of 70', () => {
      const result = calculateSuccessRate(70);
      expect(result).toBe(0.5);
    });

    it('should return 5% (minimum) for very low attributes', () => {
      // 属性值 <= 25 时，成功率应该锁定在5%
      // 50% + (25 - 70)% = 50% - 45% = 5%
      expect(calculateSuccessRate(25)).toBe(0.05);
      expect(calculateSuccessRate(0)).toBe(0.05);
      expect(calculateSuccessRate(-10)).toBe(0.05);
    });

    it('should return 95% (maximum) for very high attributes', () => {
      // 属性值 >= 115 时，成功率应该锁定在95%
      // 50% + (115 - 70)% = 50% + 45% = 95%
      expect(calculateSuccessRate(115)).toBe(0.95);
      expect(calculateSuccessRate(150)).toBe(0.95);
      expect(calculateSuccessRate(200)).toBe(0.95);
    });
  });

  describe('修正系数计算', () => {
    it('should calculate modifier coefficient as 1 + (attribute - 70) × 1%', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 150 }),
          (samuraiAttribute) => {
            const result = calculateModifierCoefficient(samuraiAttribute);
            
            // 计算预期值：1 + (属性 - 70) × 1%
            const expected = 1 + (samuraiAttribute - 70) / 100;
            
            expect(result).toBeCloseTo(expected, 10);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 1.0 for attribute value of 70', () => {
      const result = calculateModifierCoefficient(70);
      expect(result).toBe(1.0);
    });

    it('should return values proportional to attribute difference from 70', () => {
      // 属性80: 1 + (80-70)/100 = 1.1
      expect(calculateModifierCoefficient(80)).toBeCloseTo(1.1, 10);
      // 属性60: 1 + (60-70)/100 = 0.9
      expect(calculateModifierCoefficient(60)).toBeCloseTo(0.9, 10);
      // 属性100: 1 + (100-70)/100 = 1.3
      expect(calculateModifierCoefficient(100)).toBeCloseTo(1.3, 10);
    });
  });

  describe('D100判定结果', () => {
    it('should return critical_success when roll < 5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 4 }), // roll < 5
          fc.double({ min: 0.05, max: 0.95, noNaN: true }), // any valid success rate
          (roll, successRate) => {
            const result = determineOutcome(roll, successRate);
            expect(result).toBe('critical_success');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return success when roll >= 5 and roll <= successRate * 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.10, max: 0.95, noNaN: true }), // success rate with room for non-critical success
          (successRate) => {
            // Generate a roll that is >= 5 and <= successRate * 100
            const minRoll = 5;
            const maxRoll = Math.floor(successRate * 100);
            
            if (maxRoll >= minRoll) {
              const roll = Math.floor(Math.random() * (maxRoll - minRoll + 1)) + minRoll;
              const result = determineOutcome(roll, successRate);
              expect(result).toBe('success');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return failure when roll > successRate * 100', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.05, max: 0.90, noNaN: true }), // success rate
          (successRate) => {
            // Generate a roll that is > successRate * 100
            const minRoll = Math.floor(successRate * 100) + 1;
            const roll = Math.min(100, minRoll + Math.floor(Math.random() * 10));
            
            const result = determineOutcome(roll, successRate);
            expect(result).toBe('failure');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('点数计算', () => {
    it('should calculate points correctly for each outcome', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // basePoints
          fc.double({ min: 0.5, max: 1.5, noNaN: true }), // modifierCoefficient
          (basePoints, modifierCoefficient) => {
            // 大成功：基础点数 × 2 × 修正系数
            const criticalPoints = calculatePointsGained('critical_success', basePoints, modifierCoefficient);
            expect(criticalPoints).toBe(Math.floor(basePoints * 2 * modifierCoefficient));

            // 成功：基础点数 × 修正系数
            const successPoints = calculatePointsGained('success', basePoints, modifierCoefficient);
            expect(successPoints).toBe(Math.floor(basePoints * modifierCoefficient));

            // 失败：0点
            const failurePoints = calculatePointsGained('failure', basePoints, modifierCoefficient);
            expect(failurePoints).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return non-negative points for all outcomes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }),
          fc.double({ min: 0, max: 2, noNaN: true }),
          fc.constantFrom('critical_success', 'success', 'failure') as fc.Arbitrary<'critical_success' | 'success' | 'failure'>,
          (basePoints, modifierCoefficient, outcome) => {
            const points = calculatePointsGained(outcome, basePoints, modifierCoefficient);
            expect(points).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('critical success should always give more or equal points than success', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }),
          fc.double({ min: 0.5, max: 1.5, noNaN: true }),
          (basePoints, modifierCoefficient) => {
            const criticalPoints = calculatePointsGained('critical_success', basePoints, modifierCoefficient);
            const successPoints = calculatePointsGained('success', basePoints, modifierCoefficient);
            
            expect(criticalPoints).toBeGreaterThanOrEqual(successPoints);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('投资等级查询', () => {
    it('should return correct level name for agriculture points', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (points) => {
            const level = getInvestmentLevel('agriculture', points);
            
            // 找到对应的等级
            const expectedLevel = AGRICULTURE_LEVELS.find(
              l => points >= l.minPoints && points <= l.maxPoints
            );
            
            if (expectedLevel) {
              expect(level).toBe(expectedLevel.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return correct level name for armament points', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (points) => {
            const level = getInvestmentLevel('armament', points);
            
            const expectedLevel = ARMAMENT_LEVELS.find(
              l => points >= l.minPoints && points <= l.maxPoints
            );
            
            if (expectedLevel) {
              expect(level).toBe(expectedLevel.name);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
