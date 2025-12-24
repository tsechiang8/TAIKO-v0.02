import { Request, Response, NextFunction } from 'express';
import { User } from '../types';
declare global {
    namespace Express {
        interface Request {
            user?: User;
            sessionId?: string;
        }
    }
}
/**
 * 认证中间件 - 验证用户身份
 * 如果认证失败，返回401错误
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * 管理员权限中间件
 * 必须在requireAuth之后使用
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
/**
 * 玩家权限中间件 - 确保用户是玩家
 * 必须在requireAuth之后使用
 */
export declare function requirePlayer(req: Request, res: Response, next: NextFunction): void;
/**
 * 势力数据隔离中间件
 * 确保玩家只能访问自己势力的数据
 * 管理员可以访问所有数据
 * @param factionIdExtractor 从请求中提取势力ID的函数
 */
export declare function requireFactionAccess(factionIdExtractor: (req: Request) => string | undefined): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 游戏锁定检查中间件
 * 当游戏被锁定时，阻止玩家的修改操作
 * 管理员不受影响
 */
export declare function checkGameLock(req: Request, res: Response, next: NextFunction): void;
/**
 * 权限验证中间件工厂
 * @param action 操作类型
 * @param resourceFactionIdExtractor 从请求中提取资源势力ID的函数（可选）
 */
export declare function requirePermission(action: string, resourceFactionIdExtractor?: (req: Request) => string | undefined): (req: Request, res: Response, next: NextFunction) => void;
/**
 * 可选认证中间件
 * 如果提供了认证信息则验证，否则继续（用于公开接口）
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
export declare const factionIdFromParams: (req: Request) => string | undefined;
export declare const factionIdFromBody: (req: Request) => string | undefined;
export declare const factionIdFromQuery: (req: Request) => string | undefined;
//# sourceMappingURL=middleware.d.ts.map