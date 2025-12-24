import { Request, Response, NextFunction } from 'express';
import { getCurrentUser, isAdmin, getPlayerFactionId, validatePermission } from './index';
import { User } from '../types';
import { getGameState } from '../storage';

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionId?: string;
    }
  }
}

/**
 * 从请求中提取会话ID
 * 支持从Authorization header或cookie中获取
 */
function extractSessionId(req: Request): string | undefined {
  // 从Authorization header获取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从cookie获取
  const sessionCookie = req.cookies?.sessionId;
  if (sessionCookie) {
    return sessionCookie;
  }

  // 从query参数获取（用于某些特殊场景）
  const querySession = req.query.sessionId;
  if (typeof querySession === 'string') {
    return querySession;
  }

  return undefined;
}

/**
 * 认证中间件 - 验证用户身份
 * 如果认证失败，返回401错误
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionId = extractSessionId(req);

  if (!sessionId) {
    res.status(401).json({
      success: false,
      error: '未提供认证信息',
    });
    return;
  }

  const user = getCurrentUser(sessionId);
  if (!user) {
    res.status(401).json({
      success: false,
      error: '会话已过期或无效',
    });
    return;
  }

  // 将用户信息附加到请求对象
  req.user = user;
  req.sessionId = sessionId;
  next();
}

/**
 * 管理员权限中间件
 * 必须在requireAuth之后使用
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  if (!isAdmin(req.sessionId)) {
    res.status(403).json({
      success: false,
      error: '需要管理员权限',
    });
    return;
  }

  next();
}

/**
 * 玩家权限中间件 - 确保用户是玩家
 * 必须在requireAuth之后使用
 */
export function requirePlayer(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  if (req.user.type !== 'player') {
    res.status(403).json({
      success: false,
      error: '此操作仅限玩家',
    });
    return;
  }

  next();
}

/**
 * 势力数据隔离中间件
 * 确保玩家只能访问自己势力的数据
 * 管理员可以访问所有数据
 * @param factionIdExtractor 从请求中提取势力ID的函数
 */
export function requireFactionAccess(
  factionIdExtractor: (req: Request) => string | undefined
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.sessionId) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    // 管理员可以访问所有势力数据
    if (req.user.type === 'admin') {
      next();
      return;
    }

    // 玩家只能访问自己势力的数据
    const requestedFactionId = factionIdExtractor(req);
    const playerFactionId = getPlayerFactionId(req.sessionId);

    if (requestedFactionId && requestedFactionId !== playerFactionId) {
      res.status(403).json({
        success: false,
        error: '无权访问其他势力的数据',
      });
      return;
    }

    next();
  };
}

/**
 * 游戏锁定检查中间件
 * 当游戏被锁定时，阻止玩家的修改操作
 * 管理员不受影响
 */
export function checkGameLock(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  // 管理员不受锁定影响
  if (req.user.type === 'admin') {
    next();
    return;
  }

  // 检查游戏是否被锁定
  const gameState = getGameState();
  if (gameState.isLocked) {
    res.status(403).json({
      success: false,
      error: '游戏已被锁定，请等待管理员解锁',
    });
    return;
  }

  next();
}

/**
 * 权限验证中间件工厂
 * @param action 操作类型
 * @param resourceFactionIdExtractor 从请求中提取资源势力ID的函数（可选）
 */
export function requirePermission(
  action: string,
  resourceFactionIdExtractor?: (req: Request) => string | undefined
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.sessionId) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const resourceFactionId = resourceFactionIdExtractor?.(req);
    const hasPermission = validatePermission(req.sessionId, action, resourceFactionId);

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: '无权执行此操作',
      });
      return;
    }

    next();
  };
}

/**
 * 可选认证中间件
 * 如果提供了认证信息则验证，否则继续（用于公开接口）
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionId = extractSessionId(req);

  if (sessionId) {
    const user = getCurrentUser(sessionId);
    if (user) {
      req.user = user;
      req.sessionId = sessionId;
    }
  }

  next();
}

// 常用的势力ID提取器
export const factionIdFromParams = (req: Request): string | undefined => req.params.factionId;
export const factionIdFromBody = (req: Request): string | undefined => req.body?.factionId;
export const factionIdFromQuery = (req: Request): string | undefined => 
  typeof req.query.factionId === 'string' ? req.query.factionId : undefined;
