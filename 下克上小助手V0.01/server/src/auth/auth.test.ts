/**
 * 认证与权限系统属性测试
 * Feature: gekokujo-assistant
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import {
  login,
  logout,
  getCurrentUser,
  validatePermission,
  isAdmin,
  isPlayer,
  getPlayerFactionId,
  clearAllSessions,
  getSessionCount,
} from './index';
import {
  saveFactions,
  saveGameState,
  getFactions,
} from '../storage';
import { FactionData, GameState } from '../types';

// 生成有效的势力代码（非空白字符）
const validCodeArbitrary = fc.stringMatching(/^[a-zA-Z0-9_]{4,20}$/);

// 测试用势力数据生成器
const factionArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,20}$/),
  lordName: fc.stringMatching(/^[a-zA-Z0-9\u4e00-\u9fa5]{1,10}$/),
  code: validCodeArbitrary,
  taxRate: fc.constantFrom(0.4, 0.6, 0.8),
  treasury: fc.nat(1000000),
  idleSoldiers: fc.nat(10000),
  rifles: fc.nat(1000),
  horses: fc.nat(1000),
  cannons: fc.nat(100),
  agriculturePoints: fc.nat(100),
  commercePoints: fc.nat(100),
  navyPoints: fc.nat(100),
  armamentPoints: fc.nat(100),
  industryKokudaka: fc.nat(100000),
  territoryIds: fc.array(fc.uuid(), { maxLength: 10 }),
  samuraiIds: fc.array(fc.uuid(), { maxLength: 20 }),
  legionIds: fc.array(fc.uuid(), { maxLength: 10 }),
  diplomacy: fc.constant([]),
  buffs: fc.constant([]),
}) as fc.Arbitrary<FactionData>;

// 确保势力代码唯一的生成器
const uniqueFactionsArbitrary = fc.array(factionArbitrary, { minLength: 2, maxLength: 5 })
  .map(factions => {
    // 确保每个势力有唯一的代码
    const usedCodes = new Set<string>();
    return factions.map((faction, index) => {
      let code = `faction_${index}_${faction.code}`;
      while (usedCodes.has(code)) {
        code = `${code}_${Math.random().toString(36).substring(7)}`;
      }
      usedCodes.add(code);
      return { ...faction, code };
    });
  });

/**
 * Property 1: 权限隔离
 * *For any* 玩家用户和任意势力数据，该玩家只能访问和修改其所属势力的数据，
 * 不能访问其他势力的数据。
 * **Validates: Requirements 1.3, 1.6**
 */
describe('Property 1: 权限隔离', () => {
  beforeEach(() => {
    clearAllSessions();
    // 设置默认管理员代码
    saveGameState({
      currentYear: 1,
      isLocked: false,
      adminCode: 'admin',
    });
  });

  afterEach(() => {
    clearAllSessions();
    // 清理测试数据
    saveFactions([]);
  });

  it('should allow player to access only their own faction data', () => {
    fc.assert(
      fc.property(
        uniqueFactionsArbitrary,
        (factions) => {
          // 保存测试势力
          saveFactions(factions);

          // 为第一个势力登录
          const playerFaction = factions[0];
          const loginResult = login(playerFaction.code);

          expect(loginResult.success).toBe(true);
          expect(loginResult.userType).toBe('player');
          expect(loginResult.factionId).toBe(playerFaction.id);

          if (!loginResult.sessionId) {
            throw new Error('Session ID should be present');
          }

          // 验证玩家可以访问自己势力的数据
          const hasOwnAccess = validatePermission(
            loginResult.sessionId,
            'view_faction',
            playerFaction.id
          );
          expect(hasOwnAccess).toBe(true);

          // 验证玩家不能访问其他势力的数据
          for (let i = 1; i < factions.length; i++) {
            const otherFaction = factions[i];
            const hasOtherAccess = validatePermission(
              loginResult.sessionId,
              'view_faction',
              otherFaction.id
            );
            expect(hasOtherAccess).toBe(false);
          }

          // 清理会话
          logout(loginResult.sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow admin to access all faction data', () => {
    fc.assert(
      fc.property(
        uniqueFactionsArbitrary,
        (factions) => {
          // 保存测试势力
          saveFactions(factions);

          // 管理员登录
          const loginResult = login('admin');

          expect(loginResult.success).toBe(true);
          expect(loginResult.userType).toBe('admin');

          if (!loginResult.sessionId) {
            throw new Error('Session ID should be present');
          }

          // 验证管理员可以访问所有势力的数据
          for (const faction of factions) {
            const hasAccess = validatePermission(
              loginResult.sessionId,
              'view_faction',
              faction.id
            );
            expect(hasAccess).toBe(true);
          }

          // 清理会话
          logout(loginResult.sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should prevent player from executing admin-only actions', () => {
    const adminOnlyActions = [
      'manage_all_factions',
      'manage_territories',
      'manage_special_products',
      'advance_year',
      'lock_game',
      'unlock_game',
      'rollback',
      'view_all_error_reports',
      'import_data',
    ];

    fc.assert(
      fc.property(
        factionArbitrary,
        fc.constantFrom(...adminOnlyActions),
        (faction, action) => {
          // 保存测试势力
          saveFactions([faction]);

          // 玩家登录
          const loginResult = login(faction.code);

          expect(loginResult.success).toBe(true);

          if (!loginResult.sessionId) {
            throw new Error('Session ID should be present');
          }

          // 验证玩家不能执行管理员专属操作
          const hasPermission = validatePermission(loginResult.sessionId, action);
          expect(hasPermission).toBe(false);

          // 清理会话
          logout(loginResult.sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow admin to execute all actions', () => {
    const allActions = [
      'manage_all_factions',
      'manage_territories',
      'manage_special_products',
      'advance_year',
      'lock_game',
      'unlock_game',
      'rollback',
      'view_all_error_reports',
      'import_data',
      'view_faction',
      'edit_faction',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...allActions),
        (action) => {
          // 管理员登录
          const loginResult = login('admin');

          expect(loginResult.success).toBe(true);

          if (!loginResult.sessionId) {
            throw new Error('Session ID should be present');
          }

          // 验证管理员可以执行所有操作
          const hasPermission = validatePermission(loginResult.sessionId, action);
          expect(hasPermission).toBe(true);

          // 清理会话
          logout(loginResult.sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid login codes', () => {
    fc.assert(
      fc.property(
        uniqueFactionsArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        (factions, randomCode) => {
          // 保存测试势力
          saveFactions(factions);

          // 确保随机代码不是有效代码
          const validCodes = new Set(['admin', ...factions.map(f => f.code)]);
          if (validCodes.has(randomCode)) {
            return; // 跳过这个测试用例
          }

          // 尝试使用无效代码登录
          const loginResult = login(randomCode);

          expect(loginResult.success).toBe(false);
          expect(loginResult.errorMessage).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly identify user type after login', () => {
    fc.assert(
      fc.property(
        factionArbitrary,
        (faction) => {
          // 保存测试势力
          saveFactions([faction]);

          // 玩家登录
          const playerLogin = login(faction.code);
          expect(playerLogin.success).toBe(true);
          
          if (playerLogin.sessionId) {
            expect(isPlayer(playerLogin.sessionId)).toBe(true);
            expect(isAdmin(playerLogin.sessionId)).toBe(false);
            expect(getPlayerFactionId(playerLogin.sessionId)).toBe(faction.id);
            logout(playerLogin.sessionId);
          }

          // 管理员登录
          const adminLogin = login('admin');
          expect(adminLogin.success).toBe(true);
          
          if (adminLogin.sessionId) {
            expect(isAdmin(adminLogin.sessionId)).toBe(true);
            expect(isPlayer(adminLogin.sessionId)).toBe(false);
            expect(getPlayerFactionId(adminLogin.sessionId)).toBeUndefined();
            logout(adminLogin.sessionId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should invalidate session after logout', () => {
    fc.assert(
      fc.property(
        factionArbitrary,
        (faction) => {
          // 保存测试势力
          saveFactions([faction]);

          // 登录
          const loginResult = login(faction.code);
          expect(loginResult.success).toBe(true);

          if (!loginResult.sessionId) {
            throw new Error('Session ID should be present');
          }

          // 验证会话有效
          expect(getCurrentUser(loginResult.sessionId)).not.toBeNull();

          // 登出
          logout(loginResult.sessionId);

          // 验证会话已失效
          expect(getCurrentUser(loginResult.sessionId)).toBeNull();
          expect(validatePermission(loginResult.sessionId, 'view_faction', faction.id)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain session isolation between different users', () => {
    fc.assert(
      fc.property(
        uniqueFactionsArbitrary.filter(factions => factions.length >= 2),
        (factions) => {
          // 保存测试势力
          saveFactions(factions);

          // 两个不同玩家登录
          const player1Login = login(factions[0].code);
          const player2Login = login(factions[1].code);

          expect(player1Login.success).toBe(true);
          expect(player2Login.success).toBe(true);

          if (!player1Login.sessionId || !player2Login.sessionId) {
            throw new Error('Session IDs should be present');
          }

          // 验证玩家1只能访问自己的势力
          expect(validatePermission(player1Login.sessionId, 'view_faction', factions[0].id)).toBe(true);
          expect(validatePermission(player1Login.sessionId, 'view_faction', factions[1].id)).toBe(false);

          // 验证玩家2只能访问自己的势力
          expect(validatePermission(player2Login.sessionId, 'view_faction', factions[1].id)).toBe(true);
          expect(validatePermission(player2Login.sessionId, 'view_faction', factions[0].id)).toBe(false);

          // 清理会话
          logout(player1Login.sessionId);
          logout(player2Login.sessionId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
