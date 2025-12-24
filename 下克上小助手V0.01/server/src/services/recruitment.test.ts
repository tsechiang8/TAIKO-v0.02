/**
 * 士兵招募服务属性测试
 * Feature: gekokujo-assistant
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * 限制数值在边界范围内
 * 这是从 client/src/components/RecruitDialog.tsx 中提取的纯函数
 * 用于属性测试验证
 */
function clampValue(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Property 13: 数值输入边界
 * *For any* 数值输入，输入值小于0时自动变为0，输入值大于最大值时自动变为最大值
 * **Validates: Requirements 12.7, 12.8**
 */
describe('Property 13: 数值输入边界', () => {
  /**
   * Requirement 12.7: 输入小于0时自动变为0
   */
  it('should clamp negative values to 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: -1 }),  // 负数输入
        fc.nat(1000000),  // 最大值 (非负)
        (negativeValue, maxValue) => {
          const result = clampValue(negativeValue, 0, maxValue);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Requirement 12.8: 输入大于最大值时自动变为最大值
   */
  it('should clamp values exceeding max to max', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),  // 最大值
        fc.integer({ min: 1, max: 1000000 }),  // 超出量
        (maxValue, excess) => {
          const inputValue = maxValue + excess;
          const result = clampValue(inputValue, 0, maxValue);
          expect(result).toBe(maxValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证在有效范围内的值保持不变
   */
  it('should preserve values within valid range', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),  // 最大值
        (maxValue) => {
          // 生成一个在 [0, maxValue] 范围内的值
          return fc.assert(
            fc.property(
              fc.integer({ min: 0, max: Math.max(0, maxValue) }),
              (validValue) => {
                const result = clampValue(validValue, 0, maxValue);
                expect(result).toBe(validValue);
              }
            ),
            { numRuns: 10 }  // 内层循环次数较少
          );
        }
      ),
      { numRuns: 10 }  // 外层循环次数较少
    );
  });

  /**
   * 验证结果始终在 [min, max] 范围内
   */
  it('should always return value within [min, max] range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 1000000 }),  // 任意输入值
        fc.nat(1000000),  // 最大值
        (inputValue, maxValue) => {
          const result = clampValue(inputValue, 0, maxValue);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(maxValue);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证边界值的正确处理
   */
  it('should handle boundary values correctly', () => {
    // 测试 min 边界
    expect(clampValue(0, 0, 100)).toBe(0);
    expect(clampValue(-1, 0, 100)).toBe(0);
    
    // 测试 max 边界
    expect(clampValue(100, 0, 100)).toBe(100);
    expect(clampValue(101, 0, 100)).toBe(100);
    
    // 测试中间值
    expect(clampValue(50, 0, 100)).toBe(50);
  });

  /**
   * 验证当 min = max 时的行为
   */
  it('should handle min equals max case', () => {
    fc.assert(
      fc.property(
        fc.nat(1000000),  // min = max 的值
        fc.integer({ min: -1000000, max: 1000000 }),  // 任意输入
        (boundary, inputValue) => {
          const result = clampValue(inputValue, boundary, boundary);
          expect(result).toBe(boundary);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 验证幂等性：对已经在范围内的值再次 clamp 结果不变
   */
  it('should be idempotent for values within range', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000, max: 1000000 }),
        fc.nat(1000000),
        (inputValue, maxValue) => {
          const firstClamp = clampValue(inputValue, 0, maxValue);
          const secondClamp = clampValue(firstClamp, 0, maxValue);
          expect(secondClamp).toBe(firstClamp);
        }
      ),
      { numRuns: 100 }
    );
  });
});
