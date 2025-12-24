/**
 * 管理员数据管理路由
 * Requirements: 8.1-8.5
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import {
  // 郡国管理
  getAllTerritories,
  searchTerritories,
  getTerritoryById,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  TerritorySearchParams,
  // 势力代码管理
  getAllFactionCodes,
  getAllFactionsFull,
  updateFactionCodeAdmin,
  createFaction,
  updateFactionInfo,
  deleteFaction,
  // 军团一览
  getAllLegionsOverview,
  adminUpdateLegion,
  adminDeleteLegion,
  // 特产管理
  getAllSpecialProducts,
  getSpecialProductByName,
  createSpecialProduct,
  updateSpecialProduct,
  deleteSpecialProduct,
  // 武士管理
  getFactionSamurais,
  createSamurai,
  updateSamurai,
  deleteSamurai,
  // 辅助函数
  getFactionOptions,
  getTerritoryOptions,
} from '../services/admin';

const router = Router();

// 所有管理员路由都需要认证和管理员权限
router.use(requireAuth, requireAdmin);

// ============ 郡国数据管理 API (Requirements: 8.1) ============

/**
 * GET /api/admin/territories
 * 获取所有郡国数据，支持搜索筛选
 */
router.get('/territories', (req: Request, res: Response) => {
  const params: TerritorySearchParams = {};

  if (req.query.provinceName) {
    params.provinceName = req.query.provinceName as string;
  }
  if (req.query.districtName) {
    params.districtName = req.query.districtName as string;
  }
  if (req.query.factionId !== undefined) {
    params.factionId = req.query.factionId as string;
  }
  if (req.query.hasSpecialProduct !== undefined) {
    params.hasSpecialProduct = req.query.hasSpecialProduct === 'true';
  }
  if (req.query.minKokudaka) {
    params.minKokudaka = Number(req.query.minKokudaka);
  }
  if (req.query.maxKokudaka) {
    params.maxKokudaka = Number(req.query.maxKokudaka);
  }

  const hasFilters = Object.keys(params).length > 0;
  const territories = hasFilters ? searchTerritories(params) : getAllTerritories();

  res.json({
    success: true,
    data: territories,
    total: territories.length,
  });
});

/**
 * GET /api/admin/territories/:id
 * 获取单个郡国数据
 */
router.get('/territories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const territory = getTerritoryById(id);

  if (!territory) {
    res.status(404).json({
      success: false,
      error: '郡国不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: territory,
  });
});

/**
 * POST /api/admin/territories
 * 创建郡国
 */
router.post('/territories', (req: Request, res: Response) => {
  const result = createTerritory(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.territory,
    message: '郡国创建成功',
  });
});

/**
 * PUT /api/admin/territories/:id
 * 更新郡国数据
 */
router.put('/territories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = updateTerritory(id, req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: result.territory,
    message: '郡国更新成功',
  });
});

/**
 * DELETE /api/admin/territories/:id
 * 删除郡国
 */
router.delete('/territories/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = deleteTerritory(id);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: '郡国删除成功',
  });
});


// ============ 势力代码管理 API (Requirements: 8.2) ============

/**
 * GET /api/admin/factions
 * 获取所有势力代码信息
 */
router.get('/factions', (req: Request, res: Response) => {
  const factions = getAllFactionCodes();

  res.json({
    success: true,
    data: factions,
  });
});

/**
 * GET /api/admin/factions/full
 * 获取所有势力完整信息
 */
router.get('/factions/full', (req: Request, res: Response) => {
  const factions = getAllFactionsFull();

  res.json({
    success: true,
    data: factions,
  });
});

/**
 * POST /api/admin/factions
 * 创建新势力
 */
router.post('/factions', (req: Request, res: Response) => {
  const { name, lordName, code, taxRate } = req.body;

  if (!name || !lordName || !code) {
    res.status(400).json({
      success: false,
      error: '势力名称、家主姓名和代码为必填项',
    });
    return;
  }

  const result = createFaction({ name, lordName, code, taxRate });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.faction,
    message: '势力创建成功',
  });
});

/**
 * PUT /api/admin/factions/:factionId
 * 更新势力基础信息
 */
router.put('/factions/:factionId', (req: Request, res: Response) => {
  const { factionId } = req.params;
  const result = updateFactionInfo(factionId, req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: result.faction,
    message: '势力信息更新成功',
  });
});

/**
 * PUT /api/admin/factions/:factionId/code
 * 更新势力代码
 */
router.put('/factions/:factionId/code', (req: Request, res: Response) => {
  const { factionId } = req.params;
  const { code } = req.body;

  if (!code) {
    res.status(400).json({
      success: false,
      error: '请提供新代码',
    });
    return;
  }

  const result = updateFactionCodeAdmin(factionId, code);

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
});

/**
 * DELETE /api/admin/factions/:factionId
 * 删除势力
 */
router.delete('/factions/:factionId', (req: Request, res: Response) => {
  const { factionId } = req.params;
  const result = deleteFaction(factionId);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: '势力删除成功',
  });
});

// ============ 全军团一览 API (Requirements: 8.3) ============

/**
 * GET /api/admin/legions
 * 获取所有军团一览
 */
router.get('/legions', (req: Request, res: Response) => {
  const legions = getAllLegionsOverview();

  res.json({
    success: true,
    data: legions,
    total: legions.length,
  });
});

/**
 * PUT /api/admin/legions/:legionId
 * 管理员编辑军团
 */
router.put('/legions/:legionId', (req: Request, res: Response) => {
  const { legionId } = req.params;
  const result = adminUpdateLegion(legionId, req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: result.legion,
    message: '军团更新成功',
  });
});

/**
 * DELETE /api/admin/legions/:legionId
 * 管理员删除军团
 */
router.delete('/legions/:legionId', (req: Request, res: Response) => {
  const { legionId } = req.params;
  const result = adminDeleteLegion(legionId);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: '军团删除成功',
  });
});

// ============ 特产系统配置 API (Requirements: 8.4) ============

/**
 * GET /api/admin/special-products
 * 获取所有特产
 */
router.get('/special-products', (req: Request, res: Response) => {
  const products = getAllSpecialProducts();

  res.json({
    success: true,
    data: products,
    total: products.length,
  });
});

/**
 * GET /api/admin/special-products/:name
 * 获取单个特产
 */
router.get('/special-products/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const product = getSpecialProductByName(decodeURIComponent(name));

  if (!product) {
    res.status(404).json({
      success: false,
      error: '特产不存在',
    });
    return;
  }

  res.json({
    success: true,
    data: product,
  });
});

/**
 * POST /api/admin/special-products
 * 创建特产
 */
router.post('/special-products', (req: Request, res: Response) => {
  const result = createSpecialProduct(req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.product,
    message: '特产创建成功',
  });
});

/**
 * PUT /api/admin/special-products/:name
 * 更新特产
 */
router.put('/special-products/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const result = updateSpecialProduct(decodeURIComponent(name), req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: result.product,
    message: '特产更新成功',
  });
});

/**
 * DELETE /api/admin/special-products/:name
 * 删除特产
 */
router.delete('/special-products/:name', (req: Request, res: Response) => {
  const { name } = req.params;
  const result = deleteSpecialProduct(decodeURIComponent(name));

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: '特产删除成功',
  });
});

// ============ 辅助 API ============

/**
 * GET /api/admin/options/factions
 * 获取势力选项列表（用于下拉选择）
 */
router.get('/options/factions', (req: Request, res: Response) => {
  const options = getFactionOptions();

  res.json({
    success: true,
    data: options,
  });
});

/**
 * GET /api/admin/options/territories
 * 获取领地选项列表（用于下拉选择）
 */
router.get('/options/territories', (req: Request, res: Response) => {
  const options = getTerritoryOptions();

  res.json({
    success: true,
    data: options,
  });
});

// ============ 武士管理 API ============

/**
 * GET /api/admin/factions/:factionId/samurais
 * 获取势力的所有武士
 */
router.get('/factions/:factionId/samurais', (req: Request, res: Response) => {
  const { factionId } = req.params;
  const samurais = getFactionSamurais(factionId);

  res.json({
    success: true,
    data: samurais,
  });
});

/**
 * POST /api/admin/samurais
 * 创建武士
 */
router.post('/samurais', (req: Request, res: Response) => {
  const { name, age, type, martialValue, civilValue, factionId } = req.body;

  if (!name || !factionId) {
    res.status(400).json({
      success: false,
      error: '武士姓名和所属势力为必填项',
    });
    return;
  }

  const result = createSamurai({
    name,
    age,
    type: type || 'warrior',
    martialValue: martialValue || 1,
    civilValue: civilValue || 1,
    factionId,
  });

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.status(201).json({
    success: true,
    data: result.samurai,
    message: '武士创建成功',
  });
});

/**
 * PUT /api/admin/samurais/:samuraiId
 * 更新武士
 */
router.put('/samurais/:samuraiId', (req: Request, res: Response) => {
  const { samuraiId } = req.params;
  const result = updateSamurai(samuraiId, req.body);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    data: result.samurai,
    message: '武士更新成功',
  });
});

/**
 * DELETE /api/admin/samurais/:samuraiId
 * 删除武士
 */
router.delete('/samurais/:samuraiId', (req: Request, res: Response) => {
  const { samuraiId } = req.params;
  const result = deleteSamurai(samuraiId);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
    });
    return;
  }

  res.json({
    success: true,
    message: '武士删除成功',
  });
});

export default router;
