"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.getCurrentUser = getCurrentUser;
exports.validatePermission = validatePermission;
exports.isAdmin = isAdmin;
exports.isPlayer = isPlayer;
exports.getPlayerFactionId = getPlayerFactionId;
exports.isSessionValid = isSessionValid;
exports.getAllFactionsForAdmin = getAllFactionsForAdmin;
exports.clearAllSessions = clearAllSessions;
exports.getSessionCount = getSessionCount;
const uuid_1 = require("uuid");
const storage_1 = require("../storage");
const sessions = new Map();
// 会话过期时间（24小时）
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;
/**
 * 清理过期会话
 */
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.lastAccessedAt.getTime() > SESSION_EXPIRY_MS) {
            sessions.delete(sessionId);
        }
    }
}
/**
 * 验证登录代码并创建会话
 * @param code 登录代码
 * @returns 认证结果
 */
function login(code) {
    // 清理过期会话
    cleanupExpiredSessions();
    if (!code || code.trim() === '') {
        return {
            success: false,
            userType: 'player',
            errorMessage: '请输入登录代码',
        };
    }
    const trimmedCode = code.trim();
    const gameState = (0, storage_1.getGameState)();
    console.log('Login attempt with code:', trimmedCode);
    console.log('Game state adminCode:', gameState.adminCode);
    console.log('Code match:', trimmedCode === gameState.adminCode);
    // 检查是否为管理员代码
    if (trimmedCode === gameState.adminCode) {
        console.log('Admin login successful');
        const sessionId = (0, uuid_1.v4)();
        const user = {
            type: 'admin',
        };
        sessions.set(sessionId, {
            id: sessionId,
            user,
            createdAt: new Date(),
            lastAccessedAt: new Date(),
        });
        return {
            success: true,
            userType: 'admin',
            sessionId,
        };
    }
    // 检查是否为势力代码
    const faction = (0, storage_1.getFactionByCode)(trimmedCode);
    if (faction) {
        const sessionId = (0, uuid_1.v4)();
        const user = {
            type: 'player',
            factionId: faction.id,
            factionName: faction.name,
        };
        sessions.set(sessionId, {
            id: sessionId,
            user,
            createdAt: new Date(),
            lastAccessedAt: new Date(),
        });
        return {
            success: true,
            userType: 'player',
            factionId: faction.id,
            sessionId,
        };
    }
    // 无效代码
    return {
        success: false,
        userType: 'player',
        errorMessage: '无效的登录代码',
    };
}
/**
 * 登出并销毁会话
 * @param sessionId 会话ID
 */
function logout(sessionId) {
    sessions.delete(sessionId);
}
/**
 * 获取当前用户
 * @param sessionId 会话ID
 * @returns 用户信息或null
 */
function getCurrentUser(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
        return null;
    }
    // 检查会话是否过期
    if (Date.now() - session.lastAccessedAt.getTime() > SESSION_EXPIRY_MS) {
        sessions.delete(sessionId);
        return null;
    }
    // 更新最后访问时间
    session.lastAccessedAt = new Date();
    return session.user;
}
/**
 * 验证用户是否有权限执行操作
 * @param sessionId 会话ID
 * @param action 操作类型
 * @param resourceFactionId 资源所属势力ID（可选）
 * @returns 是否有权限
 */
function validatePermission(sessionId, action, resourceFactionId) {
    const user = getCurrentUser(sessionId);
    if (!user) {
        return false;
    }
    // 管理员拥有所有权限
    if (user.type === 'admin') {
        return true;
    }
    // 玩家权限检查
    if (user.type === 'player') {
        // 如果操作涉及特定势力资源，检查是否为该玩家的势力
        if (resourceFactionId && user.factionId !== resourceFactionId) {
            return false;
        }
        // 玩家不能执行管理员专属操作
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
        if (adminOnlyActions.includes(action)) {
            return false;
        }
        return true;
    }
    return false;
}
/**
 * 检查用户是否为管理员
 * @param sessionId 会话ID
 * @returns 是否为管理员
 */
function isAdmin(sessionId) {
    const user = getCurrentUser(sessionId);
    return user?.type === 'admin';
}
/**
 * 检查用户是否为玩家
 * @param sessionId 会话ID
 * @returns 是否为玩家
 */
function isPlayer(sessionId) {
    const user = getCurrentUser(sessionId);
    return user?.type === 'player';
}
/**
 * 获取玩家所属势力ID
 * @param sessionId 会话ID
 * @returns 势力ID或undefined
 */
function getPlayerFactionId(sessionId) {
    const user = getCurrentUser(sessionId);
    if (user?.type === 'player') {
        return user.factionId;
    }
    return undefined;
}
/**
 * 验证会话是否有效
 * @param sessionId 会话ID
 * @returns 是否有效
 */
function isSessionValid(sessionId) {
    return getCurrentUser(sessionId) !== null;
}
/**
 * 获取所有势力列表（用于管理员查看）
 * @param sessionId 会话ID
 * @returns 势力列表或null（无权限）
 */
function getAllFactionsForAdmin(sessionId) {
    if (!isAdmin(sessionId)) {
        return null;
    }
    const factions = (0, storage_1.getFactions)();
    return factions.map(f => ({
        id: f.id,
        name: f.name,
        lordName: f.lordName,
        code: f.code,
    }));
}
// 导出会话清理函数（用于测试）
function clearAllSessions() {
    sessions.clear();
}
// 导出获取会话数量（用于测试）
function getSessionCount() {
    return sessions.size;
}
//# sourceMappingURL=index.js.map