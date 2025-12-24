/**
 * 数据导入路由
 * Requirements: 10.1-10.4
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import {
  importData,
  getImportTemplate,
  ImportType,
  parseTerritoryData,
  parseLegionData,
  parseFactionData,
  parseSpecialProductData,
} from '../services/import';

const router = Router();

// 所有导入路由都需要认证和管理员权限
router.use(requireAuth, requireAdmin);

const VALID_IMPORT_TYPES = ['territory', 'legion', 'faction', 'specialProduct'];

/**
 * GET /api/import/template/:type
 * 获取导入模板（表头）
 * Requirements: 10.3
 */
router.get('/template/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  
  if (!VALID_IMPORT_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      error: '无效的导入类型，支持: territory, legion, faction, specialProduct',
    });
    return;
  }

  const template = getImportTemplate(type as ImportType);

  res.json({
    success: true,
    data: {
      type,
      template,
      description: getTypeDescription(type as ImportType),
    },
  });
});

/**
 * POST /api/import/preview/:type
 * 预览导入数据（解析但不保存）
 * Requirements: 10.2
 */
router.post('/preview/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const { text } = req.body;

  if (!VALID_IMPORT_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      error: '无效的导入类型，支持: territory, legion, faction, specialProduct',
    });
    return;
  }

  if (!text || typeof text !== 'string') {
    res.status(400).json({
      success: false,
      error: '请提供要导入的文本数据',
    });
    return;
  }

  let parseResult;
  switch (type) {
    case 'territory':
      parseResult = parseTerritoryData(text);
      break;
    case 'legion':
      parseResult = parseLegionData(text);
      break;
    case 'faction':
      parseResult = parseFactionData(text);
      break;
    case 'specialProduct':
      parseResult = parseSpecialProductData(text);
      break;
    default:
      res.status(400).json({
        success: false,
        error: '无效的导入类型',
      });
      return;
  }

  res.json({
    success: parseResult.success,
    data: {
      type,
      rowCount: parseResult.data.length,
      preview: parseResult.data.slice(0, 10), // 只返回前10条预览
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    },
  });
});

/**
 * POST /api/import/:type
 * 执行数据导入
 * Requirements: 10.1-10.4
 */
router.post('/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const { text, overwrite = true } = req.body;

  if (!VALID_IMPORT_TYPES.includes(type)) {
    res.status(400).json({
      success: false,
      error: '无效的导入类型，支持: territory, legion, faction, specialProduct',
    });
    return;
  }

  if (!text || typeof text !== 'string') {
    res.status(400).json({
      success: false,
      error: '请提供要导入的文本数据',
    });
    return;
  }

  const result = importData(type as ImportType, text, overwrite);

  if (!result.success && result.imported === 0) {
    res.status(400).json({
      success: false,
      error: '导入失败',
      details: {
        imported: result.imported,
        errors: result.errors,
        warnings: result.warnings,
      },
    });
    return;
  }

  res.json({
    success: result.success,
    message: result.success 
      ? `成功导入 ${result.imported} 条数据`
      : `部分导入成功，共导入 ${result.imported} 条数据`,
    data: {
      imported: result.imported,
      errors: result.errors,
      warnings: result.warnings,
    },
  });
});

/**
 * 获取导入类型描述
 */
function getTypeDescription(type: ImportType): string {
  switch (type) {
    case 'territory':
      return '郡国数据导入：令制国、郡名、城池名称、城池等级、基础石高、特产1-3、可发展特产、势力名称、描述';
    case 'legion':
      return '军团数据导入：势力名称、军团名称、将领姓名、士兵数量、铁炮、战马、大筒、驻扎位置';
    case 'faction':
      return '势力数据导入：势力名称、家主姓名、登录代码、税率、金库、闲置士兵、铁炮、战马、大筒、农业/商业/水军/武备点数、产业石高';
    case 'specialProduct':
      return '特产数据导入：特产名称、年产石高、年产战马、兵力加成、石高加成（百分比）、其他效果';
    default:
      return '';
  }
}

export default router;
