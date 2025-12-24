/**
 * 错误报告路由
 * Requirements: 14.1-14.9
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth/middleware';
import {
  createManualErrorReport,
  createAutomaticErrorReport,
  getErrorReports,
  markErrorReportResolved,
  deleteErrorReport,
  getErrorReportById,
  recordPlayerOperation,
  getRecentOperations,
} from '../services/error-report';
import { getPlayerFactionId } from '../auth';
import { getFactionBasicInfo } from '../services/faction';

const router = Router();

/**
 * POST /api/error-reports/manual
 * 玩家手动报告错误
 * Requirements: 14.1, 14.2, 14.3
 */
router.post('/manual', requireAuth, (req: Request, res: Response) => {
  if (!req.user || !req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const { errorMessage } = req.body;
  const factionId = req.user.factionId || getPlayerFactionId(req.sessionId);

  if (!factionId) {
    res.status(400).json({ success: false, error: '无法确定势力ID' });
    return;
  }

  const factionInfo = getFactionBasicInfo(factionId);
  const playerName = factionInfo?.lordName || '未知玩家';

  const report = createManualErrorReport(
    req.sessionId,
    playerName,
    factionId,
    errorMessage
  );

  res.json({
    success: true,
    data: report,
    message: '错误报告已提交',
  });
});

/**
 * POST /api/error-reports/automatic
 * 自动报告错误（系统调用）
 * Requirements: 14.4, 14.5
 */
router.post('/automatic', requireAuth, (req: Request, res: Response) => {
  if (!req.user || !req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const { errorMessage } = req.body;

  if (!errorMessage) {
    res.status(400).json({ success: false, error: '请提供错误信息' });
    return;
  }

  const factionId = req.user.factionId || getPlayerFactionId(req.sessionId);

  if (!factionId) {
    res.status(400).json({ success: false, error: '无法确定势力ID' });
    return;
  }

  const factionInfo = getFactionBasicInfo(factionId);
  const playerName = factionInfo?.lordName || '未知玩家';

  const report = createAutomaticErrorReport(
    req.sessionId,
    playerName,
    factionId,
    errorMessage
  );

  res.json({
    success: true,
    data: report,
    message: '错误报告已自动提交',
  });
});

/**
 * GET /api/error-reports
 * 获取错误报告列表（管理员）
 * Requirements: 14.6, 14.8
 */
router.get('/', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { factionId, startTime, endTime, resolved } = req.query;

  const filter: {
    factionId?: string;
    startTime?: string;
    endTime?: string;
    resolved?: boolean;
  } = {};

  if (typeof factionId === 'string') filter.factionId = factionId;
  if (typeof startTime === 'string') filter.startTime = startTime;
  if (typeof endTime === 'string') filter.endTime = endTime;
  if (resolved === 'true') filter.resolved = true;
  if (resolved === 'false') filter.resolved = false;

  const reports = getErrorReports(Object.keys(filter).length > 0 ? filter : undefined);

  res.json({
    success: true,
    data: reports,
  });
});

/**
 * GET /api/error-reports/:reportId
 * 获取单个错误报告详情（管理员）
 */
router.get('/:reportId', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { reportId } = req.params;
  const report = getErrorReportById(reportId);

  if (!report) {
    res.status(404).json({ success: false, error: '错误报告不存在' });
    return;
  }

  res.json({
    success: true,
    data: report,
  });
});

/**
 * PUT /api/error-reports/:reportId/resolve
 * 标记错误报告为已处理（管理员）
 * Requirements: 14.9
 */
router.put('/:reportId/resolve', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { reportId } = req.params;
  const success = markErrorReportResolved(reportId);

  if (!success) {
    res.status(404).json({ success: false, error: '错误报告不存在' });
    return;
  }

  res.json({
    success: true,
    message: '已标记为已处理',
  });
});

/**
 * DELETE /api/error-reports/:reportId
 * 删除错误报告（管理员）
 */
router.delete('/:reportId', requireAuth, requireAdmin, (req: Request, res: Response) => {
  const { reportId } = req.params;
  const success = deleteErrorReport(reportId);

  if (!success) {
    res.status(404).json({ success: false, error: '错误报告不存在' });
    return;
  }

  res.json({
    success: true,
    message: '错误报告已删除',
  });
});

/**
 * GET /api/error-reports/player/recent-operations
 * 获取当前玩家最近操作记录
 */
router.get('/player/recent-operations', requireAuth, (req: Request, res: Response) => {
  if (!req.user || !req.sessionId) {
    res.status(401).json({ success: false, error: '未认证' });
    return;
  }

  const factionId = req.user.factionId || getPlayerFactionId(req.sessionId);

  if (!factionId) {
    res.status(400).json({ success: false, error: '无法确定势力ID' });
    return;
  }

  const operations = getRecentOperations(factionId);

  res.json({
    success: true,
    data: operations,
  });
});

export default router;
