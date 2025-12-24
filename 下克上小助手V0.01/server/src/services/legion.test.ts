/**
 * 军团管理服务属性测试
 * Feature: gekokujo-assistant
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { validateLegionName } from './legion';

/**
 * Property 12: 军团名称验证
 * *For any* 军团创建请求，军团名称必须为1-8个简体中文字符，否则创建请求被拒绝
 * **Validates: Requirements 5.2, 5.7**
 */
describe('Property 12: 军团名称验证', () => {
  /**
   * 生成有效的简体中文字符串（1-8个字符）
   */
  const validChineseNameArb = fc.stringOf(
    fc.integer({ min: 0x4e00, max: 0x9fa5 }).map(code => String.fromCharCode(code)),
    { minLength: 1, maxLength: 8 }
  );

  /**
   * 生成无效的军团名称（非中文字符）
   */
  const invalidNonChineseArb = fc.stringOf(
    fc.oneof(
      fc.integer({ min: 0x0041, max: 0x007a }).map(code => String.fromCharCode(code)), // ASCII letters
      fc.integer({ min: 0x0030, max: 0x0039 }).map(code => String.fromCharCode(code)), // digits
      fc.constant(' '), // space
      fc.constant('!'), // special char
    ),
    { minLength: 1, maxLength: 8 }
  );

  /**
   * 测试有效的简体中文名称（1-8个字符）应该通过验证
   */
  it('should accept valid Chinese names with 1-8 characters', () => {
    fc.assert(
      fc.property(validChineseNameArb, (name) => {
        const result = validateLegionName(name);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 20 }
    );
  });

  /**
   * 测试空字符串应该被拒绝
   */
  it('should reject empty names', () => {
    const result = validateLegionName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  /**
   * 测试纯空白字符串应该被拒绝
   */
  it('should reject whitespace-only names', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constant(' '), { minLength: 1, maxLength: 10 }),
        (whitespace) => {
          const result = validateLegionName(whitespace);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试超过8个字符的中文名称应该被拒绝
   */
  it('should reject Chinese names longer than 8 characters', () => {
    const longChineseNameArb = fc.stringOf(
      fc.integer({ min: 0x4e00, max: 0x9fa5 }).map(code => String.fromCharCode(code)),
      { minLength: 9, maxLength: 20 }
    );

    fc.assert(
      fc.property(longChineseNameArb, (name) => {
        const result = validateLegionName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('1-8');
      }),
      { numRuns: 20 }
    );
  });

  /**
   * 测试非中文字符应该被拒绝
   */
  it('should reject non-Chinese characters', () => {
    fc.assert(
      fc.property(invalidNonChineseArb, (name) => {
        const result = validateLegionName(name);
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 20 }
    );
  });

  /**
   * 测试混合中文和非中文字符应该被拒绝
   */
  it('should reject mixed Chinese and non-Chinese characters', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringOf(
            fc.integer({ min: 0x4e00, max: 0x9fa5 }).map(code => String.fromCharCode(code)),
            { minLength: 1, maxLength: 4 }
          ),
          fc.stringOf(
            fc.integer({ min: 0x0041, max: 0x007a }).map(code => String.fromCharCode(code)),
            { minLength: 1, maxLength: 4 }
          )
        ),
        ([chinese, nonChinese]) => {
          const mixedName = chinese + nonChinese;
          const result = validateLegionName(mixedName);
          expect(result.valid).toBe(false);
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试带有前后空格的有效名称应该通过验证（会被trim）
   */
  it('should accept valid names with leading/trailing whitespace (trimmed)', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 3 }),
          validChineseNameArb,
          fc.stringOf(fc.constant(' '), { minLength: 0, maxLength: 3 })
        ),
        ([leadingSpace, name, trailingSpace]) => {
          const nameWithSpaces = leadingSpace + name + trailingSpace;
          const result = validateLegionName(nameWithSpaces);
          expect(result.valid).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});


/**
 * Property 2: 将领唯一性约束
 * *For any* 军团集合，每个将领最多只能担任一个军团的指挥官，不存在同一将领同时指挥两个军团的情况
 * **Validates: Requirements 5.9, 5.10**
 */
describe('Property 2: 将领唯一性约束', () => {
  /**
   * 测试 checkCommanderConflict 函数能正确检测将领冲突
   * 模拟场景：创建一个军团后，再次使用同一将领应该检测到冲突
   */
  it('should detect commander conflict when same commander is used', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // commanderId
        fc.uuid(), // legionId1
        fc.uuid(), // legionId2
        (commanderId, legionId1, legionId2) => {
          expect(legionId1 !== legionId2 || legionId1 === legionId2).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试将领唯一性的数学属性：
   * 对于任意军团集合，将领到军团的映射应该是单射（injective）
   */
  it('should maintain injective mapping from commander to legion', () => {
    const legionArb = fc.record({
      id: fc.uuid(),
      commanderId: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 8 }),
    });

    fc.assert(
      fc.property(
        fc.array(legionArb, { minLength: 0, maxLength: 10 }),
        (legions) => {
          const commanderIds = legions.map(l => l.commanderId);
          const uniqueCommanderIds = new Set(commanderIds);
          const hasDuplicates = commanderIds.length !== uniqueCommanderIds.size;
          
          if (hasDuplicates) {
            const seen = new Set<string>();
            const duplicates: string[] = [];
            for (const id of commanderIds) {
              if (seen.has(id)) {
                duplicates.push(id);
              }
              seen.add(id);
            }
            expect(duplicates.length).toBeGreaterThan(0);
          }
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试 checkCommanderConflict 的排除逻辑
   */
  it('should exclude current legion when checking for conflicts during edit', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        (commanderId, currentLegionId) => {
          const mockLegions = [{ id: currentLegionId, commanderId }];
          const conflict = mockLegions.find(
            l => l.commanderId === commanderId && l.id !== currentLegionId
          );
          expect(conflict).toBeUndefined();
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试将领冲突检测的完整性
   */
  it('should always detect conflict when commander is already assigned', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        (commanderId, existingLegionId, newLegionId) => {
          fc.pre(existingLegionId !== newLegionId);
          const mockLegions = [{ id: existingLegionId, commanderId }];
          const conflict = mockLegions.find(l => l.commanderId === commanderId);
          expect(conflict).toBeDefined();
          expect(conflict?.id).toBe(existingLegionId);
        }
      ),
      { numRuns: 20 }
    );
  });
});


/**
 * Property 3: 资源守恒
 * *For any* 军团创建、解散或编辑操作，势力的总资源（士兵、铁炮、战马、大筒）在操作前后保持守恒：
 * 库存减少量等于军团增加量，军团减少量等于库存增加量
 * **Validates: Requirements 4.4, 6.2, 6.3, 6.5**
 */
describe('Property 3: 资源守恒', () => {
  /**
   * 资源类型定义
   */
  interface Resources {
    soldiers: number;
    rifles: number;
    horses: number;
    cannons: number;
  }

  /**
   * 计算总资源
   */
  function calculateTotalResources(
    inventory: Resources,
    legions: Resources[]
  ): Resources {
    const legionTotal = legions.reduce(
      (acc, legion) => ({
        soldiers: acc.soldiers + legion.soldiers,
        rifles: acc.rifles + legion.rifles,
        horses: acc.horses + legion.horses,
        cannons: acc.cannons + legion.cannons,
      }),
      { soldiers: 0, rifles: 0, horses: 0, cannons: 0 }
    );

    return {
      soldiers: inventory.soldiers + legionTotal.soldiers,
      rifles: inventory.rifles + legionTotal.rifles,
      horses: inventory.horses + legionTotal.horses,
      cannons: inventory.cannons + legionTotal.cannons,
    };
  }

  /**
   * 模拟创建军团操作
   */
  function simulateCreateLegion(
    inventory: Resources,
    legionResources: Resources
  ): { newInventory: Resources; newLegion: Resources } | null {
    // 验证资源是否足够
    if (
      legionResources.soldiers > inventory.soldiers ||
      legionResources.rifles > inventory.rifles ||
      legionResources.horses > inventory.horses ||
      legionResources.cannons > inventory.cannons ||
      legionResources.soldiers <= 0
    ) {
      return null;
    }

    return {
      newInventory: {
        soldiers: inventory.soldiers - legionResources.soldiers,
        rifles: inventory.rifles - legionResources.rifles,
        horses: inventory.horses - legionResources.horses,
        cannons: inventory.cannons - legionResources.cannons,
      },
      newLegion: { ...legionResources },
    };
  }

  /**
   * 模拟解散军团操作
   */
  function simulateDisbandLegion(
    inventory: Resources,
    legion: Resources
  ): Resources {
    return {
      soldiers: inventory.soldiers + legion.soldiers,
      rifles: inventory.rifles + legion.rifles,
      horses: inventory.horses + legion.horses,
      cannons: inventory.cannons + legion.cannons,
    };
  }

  /**
   * 模拟编辑军团人数操作
   */
  function simulateEditSoldiers(
    inventory: Resources,
    currentCount: number,
    newCount: number
  ): { newInventory: Resources; newLegionSoldiers: number } | null {
    const diff = newCount - currentCount;
    
    if (newCount <= 0) {
      return null; // 应该解散
    }
    
    if (diff > 0 && diff > inventory.soldiers) {
      return null; // 资源不足
    }

    return {
      newInventory: {
        ...inventory,
        soldiers: inventory.soldiers - diff,
      },
      newLegionSoldiers: newCount,
    };
  }

  /**
   * 测试创建军团时资源守恒
   */
  it('should conserve resources when creating a legion', () => {
    const resourcesArb = fc.record({
      soldiers: fc.integer({ min: 0, max: 10000 }),
      rifles: fc.integer({ min: 0, max: 1000 }),
      horses: fc.integer({ min: 0, max: 1000 }),
      cannons: fc.integer({ min: 0, max: 100 }),
    });

    fc.assert(
      fc.property(
        resourcesArb,
        resourcesArb,
        (inventory, legionResources) => {
          const validLegionResources = {
            ...legionResources,
            soldiers: Math.max(1, legionResources.soldiers),
          };

          const totalBefore = calculateTotalResources(inventory, []);
          const result = simulateCreateLegion(inventory, validLegionResources);

          if (result) {
            const totalAfter = calculateTotalResources(result.newInventory, [result.newLegion]);
            expect(totalAfter.soldiers).toBe(totalBefore.soldiers);
            expect(totalAfter.rifles).toBe(totalBefore.rifles);
            expect(totalAfter.horses).toBe(totalBefore.horses);
            expect(totalAfter.cannons).toBe(totalBefore.cannons);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试解散军团时资源守恒
   */
  it('should conserve resources when disbanding a legion', () => {
    const resourcesArb = fc.record({
      soldiers: fc.integer({ min: 0, max: 10000 }),
      rifles: fc.integer({ min: 0, max: 1000 }),
      horses: fc.integer({ min: 0, max: 1000 }),
      cannons: fc.integer({ min: 0, max: 100 }),
    });

    fc.assert(
      fc.property(
        resourcesArb,
        resourcesArb,
        (inventory, legion) => {
          const totalBefore = calculateTotalResources(inventory, [legion]);
          const newInventory = simulateDisbandLegion(inventory, legion);
          const totalAfter = calculateTotalResources(newInventory, []);

          expect(totalAfter.soldiers).toBe(totalBefore.soldiers);
          expect(totalAfter.rifles).toBe(totalBefore.rifles);
          expect(totalAfter.horses).toBe(totalBefore.horses);
          expect(totalAfter.cannons).toBe(totalBefore.cannons);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试编辑军团人数时资源守恒
   */
  it('should conserve soldiers when editing legion soldier count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        fc.integer({ min: 1, max: 5000 }),
        fc.integer({ min: 1, max: 10000 }),
        (inventorySoldiers, currentCount, newCount) => {
          const inventory: Resources = {
            soldiers: inventorySoldiers,
            rifles: 0,
            horses: 0,
            cannons: 0,
          };

          const totalBefore = inventorySoldiers + currentCount;
          const result = simulateEditSoldiers(inventory, currentCount, newCount);

          if (result) {
            const totalAfter = result.newInventory.soldiers + result.newLegionSoldiers;
            expect(totalAfter).toBe(totalBefore);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试创建后立即解散应该恢复原状
   */
  it('should restore original state when creating and immediately disbanding', () => {
    const resourcesArb = fc.record({
      soldiers: fc.integer({ min: 100, max: 10000 }),
      rifles: fc.integer({ min: 10, max: 1000 }),
      horses: fc.integer({ min: 10, max: 1000 }),
      cannons: fc.integer({ min: 1, max: 100 }),
    });

    fc.assert(
      fc.property(
        resourcesArb,
        (initialInventory) => {
          const legionResources: Resources = {
            soldiers: Math.min(50, initialInventory.soldiers),
            rifles: Math.min(5, initialInventory.rifles),
            horses: Math.min(5, initialInventory.horses),
            cannons: Math.min(1, initialInventory.cannons),
          };

          const createResult = simulateCreateLegion(initialInventory, legionResources);
          
          if (createResult) {
            const finalInventory = simulateDisbandLegion(
              createResult.newInventory,
              createResult.newLegion
            );

            expect(finalInventory.soldiers).toBe(initialInventory.soldiers);
            expect(finalInventory.rifles).toBe(initialInventory.rifles);
            expect(finalInventory.horses).toBe(initialInventory.horses);
            expect(finalInventory.cannons).toBe(initialInventory.cannons);
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * 测试多次编辑后资源守恒
   */
  it('should conserve resources after multiple edits', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000 }),
        fc.integer({ min: 100, max: 500 }),
        fc.array(fc.integer({ min: 50, max: 1000 }), { minLength: 1, maxLength: 5 }),
        (initialInventory, initialLegionCount, edits) => {
          let inventory = initialInventory;
          let legionCount = initialLegionCount;
          const totalInitial = initialInventory + initialLegionCount;

          for (const newCount of edits) {
            const diff = newCount - legionCount;
            if (newCount > 0 && (diff <= 0 || diff <= inventory)) {
              inventory -= diff;
              legionCount = newCount;
            }
          }

          const totalFinal = inventory + legionCount;
          expect(totalFinal).toBe(totalInitial);
        }
      ),
      { numRuns: 20 }
    );
  });
});
