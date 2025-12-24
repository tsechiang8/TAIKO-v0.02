import { Router, Request, Response } from 'express';
import { login, logout, getCurrentUser, getAllFactionsForAdmin } from '../auth';
import { requireAuth, requireAdmin } from '../auth/middleware';

const router = Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({
      success: false,
      error: '请提供登录代码',
    });
    return;
  }

  const result = login(code);

  if (result.success) {
    res.json({
      success: true,
      data: {
        userType: result.userType,
        factionId: result.factionId,
        sessionId: result.sessionId,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: result.errorMessage,
    });
  }
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  if (req.sessionId) {
    logout(req.sessionId);
  }

  res.json({
    success: true,
    message: '已成功登出',
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * GET /api/auth/factions
 * 获取所有势力列表（仅管理员）
 */
router.get('/factions', requireAuth, requireAdmin, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  const factions = getAllFactionsForAdmin(req.sessionId);

  if (factions === null) {
    res.status(403).json({
      success: false,
      error: '无权访问',
    });
    return;
  }

  res.json({
    success: true,
    factions,
  });
});

export default router;
