/**
 * 势力数据路由
 * 提供势力数据的API接口
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin, requireFactionAccess, factionIdFromParams } from '../auth/middleware';
import {
  getFactionDashboard,
  getAllFactionsList,
  updateFactionCode,
  getFactionBasicInfo,
} from '../services/faction';
import { getPlayerFactionId, isAdmin } from '../auth';

const router = Router();

/**
 * GET /api/factions
 * 获取所有势力列表（仅管理员）
 */
router.get('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const factions = getAllFactionsList();

  res.json({
    success: true,
    factions,
  });
});

/**
 * GET /api/factions/me
 * 获取当前玩家的势力数据
 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  // 管理员没有"自己的势力"
  if (req.user?.type === 'admin') {
    res.status(400).json({
      success: false,
      error: '管理员没有所属势力，请使用 /api/factions/:factionId 访问特定势力',
    });
    return;
  }

  const factionId = getPlayerFactionId(req.sessionId);
  if (!factionId) {
    res.status(404).json({
      success: false,
      error: '未找到所属势力',
    });
    return;
  }

  const dashboard = getFactionDashboard(factionId);
  if (!dashboard) {
    res.status(404).json({
      success: false,
      error: '势力数据不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: dashboard,
  });
});

/**
 * GET /api/factions/:factionId
 * 获取指定势力的完整数据
 * 玩家只能访问自己的势力，管理员可以访问所有势力
 */
router.get(
  '/:factionId',
  requireAuth,
  requireFactionAccess(factionIdFromParams),
  (req: Request, res: Response) => {
    const { factionId } = req.params;

    const dashboard = getFactionDashboard(factionId);
    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: '势力不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: dashboard,
    });
  }
);

/**
 * GET /api/factions/:factionId/basic
 * 获取势力基础信息（名称、家主等）
 */
router.get(
  '/:factionId/basic',
  requireAuth,
  requireFactionAccess(factionIdFromParams),
  (req: Request, res: Response) => {
    const { factionId } = req.params;

    const basicInfo = getFactionBasicInfo(factionId);
    if (!basicInfo) {
      res.status(404).json({
        success: false,
        error: '势力不存在',
      });
      return;
    }

    res.json({
      success: true,
      data: basicInfo,
    });
  }
);

/**
 * PUT /api/factions/:factionId/code
 * 更新势力代码（仅管理员）
 */
router.put(
  '/:factionId/code',
  requireAuth,
  requireAdmin,
  (req: Request, res: Response) => {
    const { factionId } = req.params;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: '请提供新代码',
      });
      return;
    }

    const result = updateFactionCode(factionId, code);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      message: '代码更新成功',
    });
  }
);

export default router;
