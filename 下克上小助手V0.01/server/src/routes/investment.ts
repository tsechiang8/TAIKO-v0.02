/**
 * 投资系统路由
 * Requirements: 7.1-7.8
 */

import { Router, Request, Response } from 'express';
import { requireAuth, checkGameLock } from '../auth/middleware';
import { getPlayerFactionId } from '../auth';
import {
  getInvestmentPreview,
  executeInvestment,
  getInvestmentStatus,
  getAvailableSamuraisForInvestment,
  InvestmentType,
  INVESTMENT_CONFIGS,
  AGRICULTURE_LEVELS,
  COMMERCE_LEVELS,
  NAVY_LEVELS,
  ARMAMENT_LEVELS,
} from '../services/investment';

const router = Router();

/**
 * GET /api/investment/status
 * 获取势力的投资状态
 */
router.get('/status', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
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

  const status = getInvestmentStatus(factionId);
  if (!status) {
    res.status(404).json({
      success: false,
      error: '无法获取投资状态',
    });
    return;
  }

  res.json({
    success: true,
    data: status,
  });
});

/**
 * GET /api/investment/samurais
 * 获取可执行投资的武士列表
 */
router.get('/samurais', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
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

  const samurais = getAvailableSamuraisForInvestment(factionId);

  res.json({
    success: true,
    data: samurais,
  });
});

/**
 * POST /api/investment/preview
 * 获取投资预览
 */
router.post('/preview', requireAuth, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  const { type, samuraiId, amount, factionId: requestFactionId } = req.body;

  // 验证投资类型
  if (!type || !['agriculture', 'commerce', 'navy', 'armament'].includes(type)) {
    res.status(400).json({
      success: false,
      error: '无效的投资类型',
    });
    return;
  }

  // 验证武士ID
  if (!samuraiId) {
    res.status(400).json({
      success: false,
      error: '请选择执行投资的武士',
    });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({
        success: false,
        error: '管理员需要指定势力ID',
      });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
    
    if (requestFactionId && requestFactionId !== factionId) {
      res.status(403).json({
        success: false,
        error: '无权为其他势力执行投资',
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

  const preview = getInvestmentPreview({
    factionId,
    samuraiId,
    type: type as InvestmentType,
    amount: type === 'commerce' ? Number(amount) : undefined,
  });

  res.json({
    success: true,
    data: preview,
  });
});

/**
 * POST /api/investment/execute
 * 执行投资
 */
router.post('/execute', requireAuth, checkGameLock, (req: Request, res: Response) => {
  if (!req.sessionId) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  const { type, samuraiId, amount, factionId: requestFactionId } = req.body;

  // 验证投资类型
  if (!type || !['agriculture', 'commerce', 'navy', 'armament'].includes(type)) {
    res.status(400).json({
      success: false,
      error: '无效的投资类型',
    });
    return;
  }

  // 验证武士ID
  if (!samuraiId) {
    res.status(400).json({
      success: false,
      error: '请选择执行投资的武士',
    });
    return;
  }

  // 获取势力ID
  let factionId: string | undefined;
  
  if (req.user?.type === 'admin') {
    factionId = requestFactionId;
    if (!factionId) {
      res.status(400).json({
        success: false,
        error: '管理员需要指定势力ID',
      });
      return;
    }
  } else {
    factionId = getPlayerFactionId(req.sessionId);
    
    if (requestFactionId && requestFactionId !== factionId) {
      res.status(403).json({
        success: false,
        error: '无权为其他势力执行投资',
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

  // 执行投资
  const result = executeInvestment({
    factionId,
    samuraiId,
    type: type as InvestmentType,
    amount: type === 'commerce' ? Number(amount) : undefined,
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
    data: result,
  });
});

/**
 * GET /api/investment/levels
 * 获取所有投资等级表
 */
router.get('/levels', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      agriculture: AGRICULTURE_LEVELS,
      commerce: COMMERCE_LEVELS,
      navy: NAVY_LEVELS,
      armament: ARMAMENT_LEVELS,
    },
  });
});

/**
 * GET /api/investment/configs
 * 获取投资配置
 */
router.get('/configs', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: INVESTMENT_CONFIGS,
  });
});

export default router;
