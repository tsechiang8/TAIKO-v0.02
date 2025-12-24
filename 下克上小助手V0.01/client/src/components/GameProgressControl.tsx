/**
 * 游戏进程控制组件
 * Requirements: 9.1-9.7
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getGameStatusSummary,
  advanceYear,
  lockGame,
  unlockGame,
  getAccountingLogs,
  addAccountingLog,
  deleteAccountingLog,
  getRollbackableOperations,
  rollbackToOperation,
  getAdminFactions,
  GameStatusSummary,
  AccountingLog,
  OperationRecord,
  YearEndSettlement,
  FactionCodeInfo,
} from '../api';
import './GameProgressControl.css';

type ProgressTab = 'control' | 'accounting' | 'operations';

export function GameProgressControl() {
  const [activeTab, setActiveTab] = useState<ProgressTab>('control');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 游戏状态
  const [gameStatus, setGameStatus] = useState<GameStatusSummary | null>(null);
  
  // 记账日志
  const [accountingLogs, setAccountingLogs] = useState<AccountingLog[]>([]);
  const [factions, setFactions] = useState<FactionCodeInfo[]>([]);
  const [logFilter, setLogFilter] = useState<{ year?: number; factionId?: string }>({});
  
  // 操作记录
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  
  // 弹窗状态
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [showSettlementResult, setShowSettlementResult] = useState(false);
  const [settlementResult, setSettlementResult] = useState<YearEndSettlement | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationRecord | null>(null);

  // 新日志表单
  const [newLog, setNewLog] = useState({
    year: 1,
    factionId: '',
    content: '',
    shouldCalculate: false,
  });

  // 加载游戏状态
  const loadGameStatus = useCallback(async () => {
    const response = await getGameStatusSummary();
    if (response.success && response.data) {
      setGameStatus(response.data);
      setNewLog(prev => ({ ...prev, year: response.data!.currentYear }));
    }
  }, []);

  // 加载势力列表
  const loadFactions = useCallback(async () => {
    const response = await getAdminFactions();
    if (response.success && response.data) {
      setFactions(response.data);
    }
  }, []);

  // 加载记账日志
  const loadAccountingLogs = useCallback(async () => {
    const response = await getAccountingLogs(logFilter);
    if (response.success && response.data) {
      setAccountingLogs(response.data);
    }
  }, [logFilter]);

  // 加载操作记录
  const loadOperations = useCallback(async () => {
    const response = await getRollbackableOperations(20);
    if (response.success && response.data) {
      setOperations(response.data);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadGameStatus();
    loadFactions();
  }, [loadGameStatus, loadFactions]);

  // 切换标签时加载数据
  useEffect(() => {
    if (activeTab === 'accounting') {
      loadAccountingLogs();
    } else if (activeTab === 'operations') {
      loadOperations();
    }
  }, [activeTab, loadAccountingLogs, loadOperations]);

  // 下一年结算
  const handleAdvanceYear = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await advanceYear();
      if (response.success && response.data) {
        setSettlementResult(response.data);
        setShowAdvanceConfirm(false);
        setShowSettlementResult(true);
        await loadGameStatus();
      } else {
        setError(response.error || '结算失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 锁定/解锁游戏
  const handleToggleLock = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = gameStatus?.isLocked ? await unlockGame() : await lockGame();
      if (response.success) {
        await loadGameStatus();
      } else {
        setError(response.error || '操作失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加记账日志
  const handleAddLog = async () => {
    if (!newLog.factionId || !newLog.content.trim()) {
      setError('请填写完整信息');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await addAccountingLog(newLog);
      if (response.success) {
        setShowAddLog(false);
        setNewLog({ year: gameStatus?.currentYear || 1, factionId: '', content: '', shouldCalculate: false });
        await loadAccountingLogs();
      } else {
        setError(response.error || '添加失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除记账日志
  const handleDeleteLog = async (logId: string) => {
    if (!confirm('确定要删除这条日志吗？')) return;
    setLoading(true);
    try {
      const response = await deleteAccountingLog(logId);
      if (response.success) {
        await loadAccountingLogs();
      } else {
        setError(response.error || '删除失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 回溯操作
  const handleRollback = async () => {
    if (!selectedOperation) return;
    setLoading(true);
    setError(null);
    try {
      const response = await rollbackToOperation(selectedOperation.id);
      if (response.success) {
        setShowRollbackConfirm(false);
        setSelectedOperation(null);
        await loadGameStatus();
        await loadOperations();
        alert('数据已回溯');
      } else {
        setError(response.error || '回溯失败');
      }
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 格式化操作类型
  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'advance_year': '年度结算',
      'lock_game': '锁定游戏',
      'unlock_game': '解锁游戏',
      'rollback': '数据回溯',
      'create_legion': '创建军团',
      'disband_legion': '解散军团',
      'recruit': '招募士兵',
      'investment': '执行投资',
    };
    return actionMap[action] || action;
  };

  const tabs: { key: ProgressTab; label: string }[] = [
    { key: 'control', label: '进程控制' },
    { key: 'accounting', label: '记账推演' },
    { key: 'operations', label: '操作记录' },
  ];

  return (
    <div className="game-progress-control">
      <nav className="progress-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {error && <div className="error-message">{error}</div>}

      <div className="progress-content">
        {activeTab === 'control' && (
          <div className="control-panel">
            <div className="status-card">
              <h3>游戏状态</h3>
              {gameStatus ? (
                <div className="status-info">
                  <div className="status-item">
                    <span className="label">当前年份</span>
                    <span className="value">第 {gameStatus.currentYear} 年</span>
                  </div>
                  <div className="status-item">
                    <span className="label">游戏状态</span>
                    <span className={`value ${gameStatus.isLocked ? 'locked' : 'unlocked'}`}>
                      {gameStatus.isLocked ? '已锁定' : '进行中'}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="label">势力数量</span>
                    <span className="value">{gameStatus.factionCount}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">领地数量</span>
                    <span className="value">{gameStatus.totalTerritories}</span>
                  </div>
                  <div className="status-item">
                    <span className="label">军团数量</span>
                    <span className="value">{gameStatus.totalLegions}</span>
                  </div>
                </div>
              ) : (
                <p>加载中...</p>
              )}
            </div>

            <div className="control-actions">
              <button
                className={`action-btn ${gameStatus?.isLocked ? 'unlock' : 'lock'}`}
                onClick={handleToggleLock}
                disabled={loading}
              >
                {gameStatus?.isLocked ? '解锁游戏' : '锁定游戏'}
              </button>
              <button
                className="action-btn advance"
                onClick={() => setShowAdvanceConfirm(true)}
                disabled={loading || gameStatus?.isLocked}
              >
                下一年
              </button>
            </div>
          </div>
        )}

        {activeTab === 'accounting' && (
          <div className="accounting-panel">
            <div className="accounting-header">
              <div className="filter-row">
                <select
                  value={logFilter.year ?? ''}
                  onChange={(e) => setLogFilter(prev => ({
                    ...prev,
                    year: e.target.value ? Number(e.target.value) : undefined
                  }))}
                >
                  <option value="">全部年份</option>
                  {Array.from({ length: gameStatus?.currentYear || 1 }, (_, i) => i + 1).map(year => (
                    <option key={year} value={year}>第 {year} 年</option>
                  ))}
                </select>
                <select
                  value={logFilter.factionId ?? ''}
                  onChange={(e) => setLogFilter(prev => ({
                    ...prev,
                    factionId: e.target.value || undefined
                  }))}
                >
                  <option value="">全部势力</option>
                  {factions.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <button className="add-btn" onClick={() => setShowAddLog(true)}>
                  添加日志
                </button>
              </div>
            </div>

            <div className="accounting-list">
              {accountingLogs.length === 0 ? (
                <p className="empty-message">暂无记账日志</p>
              ) : (
                accountingLogs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-header">
                      <span className="log-year">第 {log.year} 年</span>
                      <span className="log-faction">{log.factionName}</span>
                      <span className={`log-calc ${log.shouldCalculate ? 'yes' : 'no'}`}>
                        {log.shouldCalculate ? '需计算' : '仅记录'}
                      </span>
                    </div>
                    <div className="log-content">{log.content}</div>
                    <div className="log-footer">
                      <span className="log-time">{formatTime(log.timestamp)}</span>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteLog(log.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="operations-panel">
            <h3>可回溯的操作记录（最近20条）</h3>
            <div className="operations-list">
              {operations.length === 0 ? (
                <p className="empty-message">暂无操作记录</p>
              ) : (
                operations.map(op => (
                  <div key={op.id} className={`operation-item ${op.hasSnapshot ? 'has-snapshot' : ''}`}>
                    <div className="op-header">
                      <span className="op-action">{formatAction(op.action)}</span>
                      <span className="op-user">{op.userType === 'admin' ? '管理员' : '玩家'}</span>
                    </div>
                    <div className="op-time">{formatTime(op.timestamp)}</div>
                    {op.hasSnapshot && (
                      <button
                        className="rollback-btn"
                        onClick={() => {
                          setSelectedOperation(op);
                          setShowRollbackConfirm(true);
                        }}
                      >
                        跳转至此
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 下一年确认弹窗 */}
      {showAdvanceConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>确认进入下一年？</h3>
            <p>将执行以下操作：</p>
            <ul>
              <li>扣除所有势力的维护费</li>
              <li>根据自然增长率更新领地石高</li>
              <li>重置所有武士的行动力</li>
              <li>创建数据快照</li>
            </ul>
            <div className="modal-actions">
              <button onClick={() => setShowAdvanceConfirm(false)}>取消</button>
              <button className="confirm" onClick={handleAdvanceYear} disabled={loading}>
                {loading ? '处理中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 结算结果弹窗 */}
      {showSettlementResult && settlementResult && (
        <div className="modal-overlay">
          <div className="modal settlement-modal">
            <h3>第 {settlementResult.year} 年结算完成</h3>
            <div className="settlement-results">
              {settlementResult.factionSettlements.map(fs => (
                <div key={fs.factionId} className="faction-settlement">
                  <h4>{fs.factionName}</h4>
                  <div className="settlement-detail">
                    <span>维护费：{fs.maintenanceCost.toLocaleString()} 石</span>
                    <span>库存变化：{fs.previousTreasury.toLocaleString()} → {fs.newTreasury.toLocaleString()}</span>
                    <span>石高增长：{fs.totalKokudakaGrowth >= 0 ? '+' : ''}{fs.totalKokudakaGrowth.toLocaleString()}</span>
                    <span>武士重置：{fs.samuraisReset} 人</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowSettlementResult(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* 添加日志弹窗 */}
      {showAddLog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>添加记账日志</h3>
            <div className="form-group">
              <label>年份</label>
              <select
                value={newLog.year}
                onChange={(e) => setNewLog(prev => ({ ...prev, year: Number(e.target.value) }))}
              >
                {Array.from({ length: gameStatus?.currentYear || 1 }, (_, i) => i + 1).map(year => (
                  <option key={year} value={year}>第 {year} 年</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>势力</label>
              <select
                value={newLog.factionId}
                onChange={(e) => setNewLog(prev => ({ ...prev, factionId: e.target.value }))}
              >
                <option value="">请选择势力</option>
                {factions.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>内容</label>
              <textarea
                value={newLog.content}
                onChange={(e) => setNewLog(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入记账内容..."
                rows={4}
              />
            </div>
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={newLog.shouldCalculate}
                  onChange={(e) => setNewLog(prev => ({ ...prev, shouldCalculate: e.target.checked }))}
                />
                需要计算
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddLog(false)}>取消</button>
              <button className="confirm" onClick={handleAddLog} disabled={loading}>
                {loading ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回溯确认弹窗 */}
      {showRollbackConfirm && selectedOperation && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>确认回溯数据？</h3>
            <p>将数据回溯到以下操作完成时的状态：</p>
            <div className="rollback-info">
              <p><strong>操作：</strong>{formatAction(selectedOperation.action)}</p>
              <p><strong>时间：</strong>{formatTime(selectedOperation.timestamp)}</p>
            </div>
            <p className="warning">此操作不可撤销，请谨慎操作！</p>
            <div className="modal-actions">
              <button onClick={() => {
                setShowRollbackConfirm(false);
                setSelectedOperation(null);
              }}>取消</button>
              <button className="danger" onClick={handleRollback} disabled={loading}>
                {loading ? '处理中...' : '确认回溯'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameProgressControl;
