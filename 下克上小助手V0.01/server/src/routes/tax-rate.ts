/**
 * 税率更改路由
 */

import { Router, Request, Response } from 'express';
import { requireAuth, checkGameLock } from '../auth/middleware';
import { getTaxRateInfo, changeTaxRate } from '../services/tax-rate';

const router = Router();

/**
 * GET /api/tax-rate/info
 * 获取税率信息
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

  const result = getTaxRateInfo(factionId);
  if (result.success) {
    res.json({ success: true, data: result.data });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

/**
 * POST /api/tax-rate/change
 * 更改税率
 */
router.post('/change', requireAuth, checkGameLock, (req: Request, res: Response) => {
  let factionId = req.body.factionId as string | undefined;
  
  if (req.user?.type === 'player') {
    factionId = req.user.factionId;
  }
  
  if (!factionId) {
    res.status(400).json({ success: false, error: '无法获取势力信息' });
    return;
  }

  const { taxRate } = req.body;
  if (typeof taxRate !== 'number') {
    res.status(400).json({ success: false, error: '请提供有效的税率' });
    return;
  }

  const result = changeTaxRate(factionId, taxRate);
  if (result.success) {
    res.json({
      success: true,
      data: { newTaxRate: result.newTaxRate },
    });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});

export default router;
