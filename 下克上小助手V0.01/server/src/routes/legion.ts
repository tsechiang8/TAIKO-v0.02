/**
 * 军团管理路由
 * Requirements: 5.1-5.10, 6.1-6.6
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireFactionAccess, factionIdFromParams, checkGameLock } from '../auth/middleware';
import {
  createLegion,
  disbandLegion,
  updateLegionSoldiers,
  updateLegionEquipment,
  getAvailableCommanders,
  getLegionById,
  getFactionLegions,
  validateLegionName,
  checkCommanderConflict,
} from '../services/legion';
import { getPlayerFactionId } from '../auth';
import { getTerritories } from '../storage';

const router = Router();

/**
 * GET /api/legions
 * 获取当前玩家势力的所有军团
 */
router.get('/', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = req.query.factionId as string;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  const legions = getFactionLegions(factionId);
  res.json({ success: true, data: legions });
});

/**
 * GET /api/legions/commanders
 * 获取可用将领列表
 */
router.get('/commanders', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = req.query.factionId as string;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  const commanders = getAvailableCommanders(factionId);
  res.json({ success: true, data: commanders });
});

/**
 * GET /api/legions/territories
 * 获取可用位置列表（势力拥有的领地）
 */
router.get('/territories', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = req.query.factionId as string;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  const territories = getTerritories().filter(t => t.factionId === factionId);
  res.json({ success: true, data: territories });
});

/**
 * GET /api/legions/:legionId
 * 获取军团详情
 */
router.get('/:legionId', requireAuth, (req: Request, res: Response) => {
  const { legionId } = req.params;
  
  const legion = getLegionById(legionId);
  if (!legion) {
    res.status(404).json({ success: false, error: '军团不存在' });
    return;
  }

  // 验证权限
  if (req.user?.type !== 'admin') {
    const factionId = getPlayerFactionId(req.sessionId!);
    if (legion.factionId !== factionId) {
      res.status(403).json({ success: false, error: '无权访问该军团' });
      return;
    }
  }

  res.json({ success: true, data: legion });
});

/**
 * POST /api/legions/validate-name
 * 验证军团名称
 */
router.post('/validate-name', requireAuth, (req: Request, res: Response) => {
  const { name } = req.body;
  
  if (!name) {
    res.status(400).json({ success: false, error: '请提供军团名称' });
    return;
  }

  const result = validateLegionName(name);
  res.json({ success: true, data: result });
});

/**
 * POST /api/legions/check-commander
 * 检查将领冲突
 */
router.post('/check-commander', requireAuth, (req: Request, res: Response) => {
  const { commanderId, excludeLegionId } = req.body;
  
  if (!commanderId) {
    res.status(400).json({ success: false, error: '请提供将领ID' });
    return;
  }

  const conflictLegion = checkCommanderConflict(commanderId, excludeLegionId);
  res.json({
    success: true,
    data: {
      hasConflict: !!conflictLegion,
      conflictLegion,
    },
  });
});

/**
 * POST /api/legions
 * 创建军团
 */
router.post('/', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const {
    name,
    commanderId,
    soldierCount,
    rifles = 0,
    horses = 0,
    cannons = 0,
    locationId,
    factionId: requestFactionId,
    forceReassign = false,
  } = req.body;

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
    if (requestFactionId && requestFactionId !== factionId) {
      res.status(403).json({ success: false, error: '无权为其他势力创建军团' });
      return;
    }
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  // 验证必填字段
  if (!name) {
    res.status(400).json({ success: false, error: '请提供军团名称' });
    return;
  }
  if (!commanderId) {
    res.status(400).json({ success: false, error: '请选择将领' });
    return;
  }
  if (!soldierCount || soldierCount <= 0) {
    res.status(400).json({ success: false, error: '军团人数必须大于0' });
    return;
  }
  if (!locationId) {
    res.status(400).json({ success: false, error: '请选择创建位置' });
    return;
  }

  // 创建军团
  const result = createLegion(
    {
      factionId,
      name,
      commanderId,
      soldierCount: Number(soldierCount),
      rifles: Number(rifles),
      horses: Number(horses),
      cannons: Number(cannons),
      locationId,
    },
    forceReassign
  );

  if (!result.success) {
    const statusCode = result.conflictLegion ? 409 : 400;
    res.status(statusCode).json({
      success: false,
      error: result.error,
      conflictLegion: result.conflictLegion,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.legion,
    message: `军团「${result.legion!.name}」创建成功`,
  });
});

/**
 * DELETE /api/legions/:legionId
 * 解散军团
 */
router.delete('/:legionId', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const { legionId } = req.params;
  const { factionId: requestFactionId } = req.body;

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  const result = disbandLegion(legionId, factionId);

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    data: { returnedResources: result.returnedResources },
    message: '军团已解散，资源已返还库存',
  });
});

/**
 * PATCH /api/legions/:legionId/soldiers
 * 编辑军团人数
 */
router.patch('/:legionId/soldiers', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const { legionId } = req.params;
  const { count, factionId: requestFactionId } = req.body;

  if (count === undefined || count === null) {
    res.status(400).json({ success: false, error: '请提供新的人数' });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  const result = updateLegionSoldiers({
    legionId,
    factionId,
    newCount: Number(count),
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
      shouldDisband: result.shouldDisband,
    });
    return;
  }

  res.json({
    success: true,
    data: {
      newSoldierCount: result.newSoldierCount,
      newIdleSoldiers: result.newIdleSoldiers,
    },
    message: '军团人数已更新',
  });
});

/**
 * PATCH /api/legions/:legionId/equipment
 * 编辑军团装备
 */
router.patch('/:legionId/equipment', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const { legionId } = req.params;
  const { rifles, horses, cannons, factionId: requestFactionId } = req.body;

  if (rifles === undefined && horses === undefined && cannons === undefined) {
    res.status(400).json({ success: false, error: '请提供要更新的装备数量' });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({ success: false, error: '管理员需要指定势力ID' });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
  }

  if (!factionId) {
    res.status(404).json({ success: false, error: '未找到所属势力' });
    return;
  }

  // 获取当前军团装备
  const legion = getLegionById(legionId);
  if (!legion) {
    res.status(404).json({ success: false, error: '军团不存在' });
    return;
  }

  const result = updateLegionEquipment({
    legionId,
    factionId,
    rifles: rifles !== undefined ? Number(rifles) : legion.rifles,
    horses: horses !== undefined ? Number(horses) : legion.horses,
    cannons: cannons !== undefined ? Number(cannons) : legion.cannons,
  });

  if (!result.success) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    data: {
      newEquipment: result.newEquipment,
      newInventory: result.newInventory,
    },
    message: '军团装备已更新',
  });
});

export default router;
