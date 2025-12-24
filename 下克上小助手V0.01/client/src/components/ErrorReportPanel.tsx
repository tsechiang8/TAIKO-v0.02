/**
 * 管理员错误报告管理面板
 * Requirements: 14.6, 14.7, 14.8, 14.9
 */

import { useState, useEffect } from 'react';
import {
  getErrorReports,
  markErrorReportResolved,
  deleteErrorReport,
  ErrorReportData,
  getFactionOptions,
} from '../api';
import './ErrorReportPanel.css';

export function ErrorReportPanel() {
  const [reports, setReports] = useState<ErrorReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ErrorReportData | null>(null);
  
  // 筛选条件
  const [filterFactionId, setFilterFactionId] = useState<string>('');
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [factionOptions, setFactionOptions] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadReports();
    loadFactionOptions();
  }, []);

  const loadFactionOptions = async () => {
    const response = await getFactionOptions();
    if (response.success && response.data) {
      setFactionOptions(response.data);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);

    const filter: { factionId?: string; resolved?: boolean } = {};
    if (filterFactionId) filter.factionId = filterFactionId;
    if (filterResolved === 'true') filter.resolved = true;
    if (filterResolved === 'false') filter.resolved = false;

    const response = await getErrorReports(Object.keys(filter).length > 0 ? filter : undefined);

    if (response.success && response.data) {
      setReports(response.data);
    } else {
      setError(response.error || '加载失败');
    }

    setLoading(false);
  };

  const handleMarkResolved = async (reportId: string) => {
    const response = await markErrorReportResolved(reportId);
    if (response.success) {
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport({ ...selectedReport, resolved: true });
      }
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('确定要删除这条错误报告吗？')) return;
    
    const response = await deleteErrorReport(reportId);
    if (response.success) {
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    }
  };

  const handleFilter = () => {
    loadReports();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getFactionName = (factionId: string) => {
    const faction = factionOptions.find(f => f.id === factionId);
    return faction?.name || factionId;
  };

  return (
    <div className="error-report-panel">
      <h2>错误报告管理</h2>

      {/* 筛选区域 */}
      <div className="error-report-filters">
        <select
          value={filterFactionId}
          onChange={e => setFilterFactionId(e.target.value)}
        >
          <option value="">所有势力</option>
          {factionOptions.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <select
          value={filterResolved}
          onChange={e => setFilterResolved(e.target.value)}
        >
          <option value="all">全部状态</option>
          <option value="false">未处理</option>
          <option value="true">已处理</option>
        </select>

        <button onClick={handleFilter}>筛选</button>
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="error-report-content">
        {/* 报告列表 */}
        <div className="error-report-list">
          {reports.length === 0 ? (
            <div className="no-reports">暂无错误报告</div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                className={`error-report-item ${selectedReport?.id === report.id ? 'selected' : ''} ${report.resolved ? 'resolved' : ''}`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="report-header">
                  <span className={`report-type ${report.errorType}`}>
                    {report.errorType === 'manual' ? '手动' : '自动'}
                  </span>
                  <span className={`report-status ${report.resolved ? 'resolved' : 'pending'}`}>
                    {report.resolved ? '已处理' : '待处理'}
                  </span>
                </div>
                <div className="report-info">
                  <span className="report-player">{report.playerName}</span>
                  <span className="report-faction">{getFactionName(report.factionId)}</span>
                </div>
                <div className="report-time">{formatTime(report.timestamp)}</div>
                {report.errorMessage && (
                  <div className="report-message-preview">
                    {report.errorMessage.substring(0, 50)}
                    {report.errorMessage.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 报告详情 */}
        {selectedReport && (
          <div className="error-report-detail">
            <h3>报告详情</h3>
            
            <div className="detail-section">
              <label>报告类型：</label>
              <span>{selectedReport.errorType === 'manual' ? '手动报告' : '自动报告'}</span>
            </div>

            <div className="detail-section">
              <label>状态：</label>
              <span className={selectedReport.resolved ? 'status-resolved' : 'status-pending'}>
                {selectedReport.resolved ? '已处理' : '待处理'}
              </span>
            </div>

            <div className="detail-section">
              <label>玩家：</label>
              <span>{selectedReport.playerName}</span>
            </div>

            <div className="detail-section">
              <label>势力：</label>
              <span>{getFactionName(selectedReport.factionId)}</span>
            </div>

            <div className="detail-section">
              <label>时间：</label>
              <span>{formatTime(selectedReport.timestamp)}</span>
            </div>

            {selectedReport.errorMessage && (
              <div className="detail-section">
                <label>错误描述：</label>
                <div className="error-description">{selectedReport.errorMessage}</div>
              </div>
            )}

            <div className="detail-section">
              <label>最近操作记录：</label>
              <div className="operations-list">
                {selectedReport.recentOperations.length === 0 ? (
                  <div className="no-operations">无操作记录</div>
                ) : (
                  selectedReport.recentOperations.map((op, index) => (
                    <div key={op.id || index} className="operation-item">
                      <div className="operation-time">{formatTime(op.timestamp)}</div>
                      <div className="operation-action">{op.action}</div>
                      <div className="operation-details">
                        {JSON.stringify(op.details, null, 2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="detail-actions">
              {!selectedReport.resolved && (
                <button
                  className="btn-resolve"
                  onClick={() => handleMarkResolved(selectedReport.id)}
                >
                  标记为已处理
                </button>
              )}
              <button
                className="btn-delete"
                onClick={() => handleDelete(selectedReport.id)}
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorReportPanel;
