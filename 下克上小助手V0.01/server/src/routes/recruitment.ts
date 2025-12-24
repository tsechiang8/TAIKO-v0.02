/**
 * 士兵招募路由
 * Requirements: 4.1-4.5
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireFactionAccess, factionIdFromParams, checkGameLock } from '../auth/middleware';
import { getRecruitInfo, recruitSoldiers } from '../services/recruitment';
import { getPlayerFactionId } from '../auth';

const router = Router();

/**
 * GET /api/recruitment/info
 * 获取当前玩家势力的招募信息
 */
router.get('/info', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  // 获取玩家势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    // 管理员需要指定势力ID
    factionId = req.query.factionId as string;
    if (!factionId) {
      res.status(400).json({
        success: false,
        error: '管理员需要指定势力ID',
      });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({
      success: false,
      error: '未找到所属势力',
    });
    return;
  }

  const recruitInfo = getRecruitInfo(factionId);
  if (!recruitInfo) {
    res.status(404).json({
      success: false,
      error: '无法获取招募信息',
    });
    return;
  }

  res.json({
    success: true,
    data: recruitInfo,
  });
});

/**
 * POST /api/recruitment/recruit
 * 执行士兵招募
 */
router.post('/recruit', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  const { count, factionId: requestFactionId } = req.body;

  // 验证招募数量
  if (count === undefined || count === null) {
    res.status(400).json({
      success: false,
      error: '请提供招募数量',
    });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    // 管理员可以为任意势力招募
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({
        success: false,
        error: '管理员需要指定势力ID',
      });
      return;
    }
  } else {
    // 玩家只能为自己的势力招募
    factionId = getPlayerFactionId(req.sessionId);
    
    // 如果请求中指定了势力ID，验证是否为自己的势力
    if (requestFactionId && requestFactionId !== factionId) {
      res.status(403).json({
        success: false,
        error: '无权为其他势力招募士兵',
      });
      return;
    }
  }

  if (!factionId) {
    res.status(404).json({
      success: false,
      error: '未找到所属势力',
    });
    return;
  }

  // 执行招募
  const result = recruitSoldiers({
    factionId,
    count: Number(count),
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      newIdleSoldiers: result.newIdleSoldiers,
      newMaxRecruitableSoldiers: result.newMaxRecruitableSoldiers,
    },
    message: `成功招募 ${count} 名士兵`,
  });
});

export default router;
