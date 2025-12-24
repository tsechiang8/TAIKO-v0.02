/**
 * 装备购买路由
 */

import { Router, Request, Response } from 'express';
import { requireAuth, checkGameLock } from '../auth/middleware';
import { getPurchaseInfo, purchaseEquipment, EQUIPMENT_PRICES } from '../services/equipment-purchase';

const router = Router();

/**
 * GET /api/equipment/info
 * 获取购买装备信息
 */
router.get('/info', requireAuth, (req: Request, res: Response) => {
  let factionId = req.query.factionId as string | undefined;
  
  if (req.user?.type === 'player') {
    factionId = req.user.factionId;
  }
  
  if (!factionId) {
    res.status(400).json({ success: false, error: '无法获取势力信息' });
    return;
  }

  const result = getPurchaseInfo(factionId);
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * GET /api/equipment/prices
 * 获取装备价格
 */
router.get('/prices', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: EQUIPMENT_PRICES,
  });
});

/**
 * POST /api/equipment/purchase
 * 购买装备
 */
router.post('/purchase', requireAuth, checkGameLock, (req: Request, res: Response) => {
  let factionId = req.body.factionId as string | undefined;
  
  if (req.user?.type === 'player') {
    factionId = req.user.factionId;
  }
  
  if (!factionId) {
    res.status(400).json({ success: false, error: '无法获取势力信息' });
    return;
  }

  const { rifles = 0, horses = 0, cannons = 0 } = req.body;

  const result = purchaseEquipment(factionId, {
    rifles: Number(rifles),
    horses: Number(horses),
    cannons: Number(cannons),
  });

  if (result.success) {
    res.json({
      success: true,
      data: {
        totalCost: result.totalCost,
        newTreasury: result.newTreasury,
        newEquipment: result.newEquipment,
      },
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

export default router;
