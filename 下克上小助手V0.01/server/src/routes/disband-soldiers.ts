/**
 * 解散士兵路由
 */

import { Router, Request, Response } from 'express';
import { requireAuth, checkGameLock } from '../auth/middleware';
import { disbandSoldiers, getDisbandInfo } from '../services/disband-soldiers';

const router = Router();

/**
 * GET /api/disband-soldiers/info
 * 获取解散士兵信息
 */
router.get('/info', requireAuth, (req: Request, res: Response) => {
  // 管理员可以通过 query 参数指定势力
  let factionId = req.query.factionId as string | undefined;
  
  // 玩家只能查看自己的势力
  if (req.user?.type === 'player') {
    factionId = req.user.factionId;
  }
  
  if (!factionId) {
    res.status(400).json({ success: false, error: '无法获取势力信息' });
    return;
  }

  const result = getDisbandInfo(factionId);
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/disband-soldiers
 * 解散士兵
 */
router.post('/', requireAuth, checkGameLock, (req: Request, res: Response) => {
  // 管理员可以通过 body 参数指定势力
  let factionId = req.body.factionId as string | undefined;
  
  // 玩家只能操作自己的势力
  if (req.user?.type === 'player') {
    factionId = req.user.factionId;
  }
  
  if (!factionId) {
    res.status(400).json({ success: false, error: '无法获取势力信息' });
    return;
  }

  const { count } = req.body;
  if (typeof count !== 'number' || count <= 0) {
    res.status(400).json({ success: false, error: '请提供有效的解散数量' });
    return;
  }

  const result = disbandSoldiers(factionId, count);
  if (result.success) {
    res.json({
      success: true,
      data: {
        newIdleSoldiers: result.newIdleSoldiers,
        newTreasury: result.newTreasury,
        totalCost: result.totalCost,
      },
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

export default router;
