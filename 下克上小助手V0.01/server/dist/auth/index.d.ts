import { User, AuthResult } from '../types';
/**
 * 验证登录代码并创建会话
 * @param code 登录代码
 * @returns 认证结果
 */
export declare function login(code: string): AuthResult & {
    sessionId?: string;
};
/**
 * 登出并销毁会话
 * @param sessionId 会话ID
 */
export declare function logout(sessionId: string): void;
/**
 * 获取当前用户
 * @param sessionId 会话ID
 * @returns 用户信息或null
 */
export declare function getCurrentUser(sessionId: string): User | null;
/**
 * 验证用户是否有权限执行操作
 * @param sessionId 会话ID
 * @param action 操作类型
 * @param resourceFactionId 资源所属势力ID（可选）
 * @returns 是否有权限
 */
export declare function validatePermission(sessionId: string, action: string, resourceFactionId?: string): boolean;
/**
 * 检查用户是否为管理员
 * @param sessionId 会话ID
 * @returns 是否为管理员
 */
export declare function isAdmin(sessionId: string): boolean;
/**
 * 检查用户是否为玩家
 * @param sessionId 会话ID
 * @returns 是否为玩家
 */
export declare function isPlayer(sessionId: string): boolean;
/**
 * 获取玩家所属势力ID
 * @param sessionId 会话ID
 * @returns 势力ID或undefined
 */
export declare function getPlayerFactionId(sessionId: string): string | undefined;
/**
 * 验证会话是否有效
 * @param sessionId 会话ID
 * @returns 是否有效
 */
export declare function isSessionValid(sessionId: string): boolean;
/**
 * 获取所有势力列表（用于管理员查看）
 * @param sessionId 会话ID
 * @returns 势力列表或null（无权限）
 */
export declare function getAllFactionsForAdmin(sessionId: string): {
    id: string;
    name: string;
    lordName: string;
    code: string;
}[] | null;
export declare function clearAllSessions(): void;
export declare function getSessionCount(): number;
//# sourceMappingURL=index.d.ts.map