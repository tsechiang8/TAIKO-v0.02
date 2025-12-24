/**
 * 投资面板组件
 * Requirements: 7.1-7.4
 */

import { useState, useEffect } from 'react';
import {
  getInvestmentStatus,
  getAvailableSamuraisForInvestment,
  getInvestmentPreview,
  executeInvestment,
  InvestmentType,
  InvestmentStatus,
  InvestmentPreview,
  InvestmentResult,
} from '../api';
import { Samurai } from '../types';
import './InvestmentPanel.css';

interface InvestmentPanelProps {
  factionId?: string;
  onInvestmentComplete?: () => void;
}

// 投资类型配置
const INVESTMENT_TYPES: { type: InvestmentType; name: string; description: string }[] = [
  { type: 'agriculture', name: '农业', description: '文治属性，5000石/次，5点基础' },
  { type: 'commerce', name: '商业', description: '智略属性，自定义投入金额' },
  { type: 'navy', name: '水军', description: '武功属性，8000石/次，4点基础' },
  { type: 'armament', name: '武备', description: '武勇属性，4000石/次，6点基础' },
];

export function InvestmentPanel({ factionId, onInvestmentComplete }: InvestmentPanelProps) {
  const [status, setStatus] = useState<InvestmentStatus | null>(null);
  const [samurais, setSamurais] = useState<Samurai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 投资表单状态
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null);
  const [selectedSamurai, setSelectedSamurai] = useState<string>('');
  const [commerceAmount, setCommerceAmount] = useState<number>(1000);
  const [preview, setPreview] = useState<InvestmentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 确认弹窗状态
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 结果弹窗状态
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [factionId]);

  useEffect(() => {
    // 当选择改变时，获取预览
    if (selectedType && selectedSamurai) {
      loadPreview();
    } else {
      setPreview(null);
    }
  }, [selectedType, selectedSamurai, commerceAmount]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [statusRes, samuraisRes] = await Promise.all([
        getInvestmentStatus(factionId),
        getAvailableSamuraisForInvestment(factionId),
      ]);

      if (statusRes.success && statusRes.data) {
        setStatus(statusRes.data);
      } else {
        setError(statusRes.error || '获取投资状态失败');
      }

      if (samuraisRes.success && samuraisRes.data) {
        setSamurais(samuraisRes.data);
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview() {
    if (!selectedType || !selectedSamurai) return;

    setPreviewLoading(true);
    try {
      const amount = selectedType === 'commerce' ? commerceAmount : undefined;
      const response = await getInvestmentPreview(selectedType, selectedSamurai, amount, factionId);
      if (response.success && response.data) {
        setPreview(response.data);
      }
    } catch (err) {
      console.error('获取预览失败:', err);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleExecuteInvestment() {
    if (!selectedType || !selectedSamurai || !preview?.canExecute) return;

    setExecuting(true);
    try {
      const amount = selectedType === 'commerce' ? commerceAmount : undefined;
      const response = await executeInvestment(selectedType, selectedSamurai, amount, factionId);
      
      if (response.success && response.data) {
        setResult(response.data);
        setShowResultDialog(true);
        setShowConfirmDialog(false);
        // 刷新数据
        await loadData();
        onInvestmentComplete?.();
      } else {
        alert(response.error || '投资执行失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setExecuting(false);
    }
  }

  if (loading) {
    return (
      <div className="investment-panel loading">
        <p>加载中...</p>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="investment-panel error">
        <p>{error || '数据加载失败'}</p>
        <button onClick={loadData}>重试</button>
      </div>
    );
  }

  return (
    <div className="investment-panel">
      {/* 当前状态 */}
      <div className="investment-status">
        <h3>投资状态</h3>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">库存</span>
            <span className="value">{status.treasury.toLocaleString()} 石</span>
          </div>
          <div className="status-item">
            <span className="label">农业</span>
            <span className="value">{status.agriculturePoints}点 ({status.agricultureLevel})</span>
          </div>
          <div className="status-item">
            <span className="label">商业</span>
            <span className="value">{status.commercePoints}点 ({status.commerceLevel})</span>
          </div>
          <div className="status-item">
            <span className="label">水军</span>
            <span className="value">{status.navyPoints}点 ({status.navyLevel})</span>
          </div>
          <div className="status-item">
            <span className="label">武备</span>
            <span className="value">{status.armamentPoints}点 ({status.armamentLevel})</span>
          </div>
        </div>
      </div>

      {/* 投资选择 */}
      <div className="investment-form">
        <h3>执行投资</h3>
        
        {/* 投资类型选择 */}
        <div className="form-group">
          <label>投资项目</label>
          <div className="type-buttons">
            {INVESTMENT_TYPES.map(({ type, name, description }) => (
              <button
                key={type}
                className={`type-btn ${selectedType === type ? 'selected' : ''}`}
                onClick={() => setSelectedType(type)}
                title={description}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* 武士选择 */}
        <div className="form-group">
          <label>执行武士</label>
          {samurais.length === 0 ? (
            <p className="no-samurai">没有可用的武士（行动力不足）</p>
          ) : (
            <select
              value={selectedSamurai}
              onChange={(e) => setSelectedSamurai(e.target.value)}
            >
              <option value="">请选择武士</option>
              {samurais.map((samurai) => (
                <option key={samurai.id} value={samurai.id}>
                  {samurai.name} (武功:{samurai.martialValue} 文治:{samurai.civilValue} 行动力:{samurai.actionPoints})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* 商业系统金额输入 */}
        {selectedType === 'commerce' && (
          <div className="form-group">
            <label>投入金额</label>
            <div className="amount-input">
              <input
                type="range"
                min={1000}
                max={Math.min(status.treasury, 100000)}
                step={1000}
                value={commerceAmount}
                onChange={(e) => setCommerceAmount(Number(e.target.value))}
              />
              <input
                type="number"
                min={1000}
                max={status.treasury}
                step={1000}
                value={commerceAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCommerceAmount(Math.max(1000, Math.min(status.treasury, val)));
                }}
              />
              <span className="unit">石</span>
            </div>
          </div>
        )}

        {/* 预览信息 */}
        {preview && (
          <div className="investment-preview">
            <h4>预计效果</h4>
            {preview.canExecute ? (
              <div className="preview-content">
                <div className="preview-row">
                  <span>使用属性</span>
                  <span>{preview.attributeName}: {preview.samuraiAttribute}</span>
                </div>
                <div className="preview-row">
                  <span>成功率</span>
                  <span className="success-rate">{(preview.successRate * 100).toFixed(0)}%</span>
                </div>
                <div className="preview-row">
                  <span>修正系数</span>
                  <span>{preview.modifierCoefficient.toFixed(2)}</span>
                </div>
                <div className="preview-row">
                  <span>花费</span>
                  <span>{preview.cost.toLocaleString()} 石</span>
                </div>
                <div className="preview-outcomes">
                  <div className="outcome critical">
                    <span className="outcome-label">大成功 (&lt;5)</span>
                    <span className="outcome-value">+{preview.expectedPointsOnCritical}点</span>
                  </div>
                  <div className="outcome success">
                    <span className="outcome-label">成功</span>
                    <span className="outcome-value">+{preview.expectedPointsOnSuccess}点</span>
                  </div>
                  <div className="outcome failure">
                    <span className="outcome-label">失败</span>
                    <span className="outcome-value">+{preview.expectedPointsOnFailure}点</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="preview-error">
                <p>{preview.error}</p>
              </div>
            )}
          </div>
        )}

        {/* 执行按钮 */}
        <button
          className="execute-btn"
          disabled={!selectedType || !selectedSamurai || !preview?.canExecute || previewLoading}
          onClick={() => setShowConfirmDialog(true)}
        >
          执行投资
        </button>
      </div>

      {/* 确认弹窗 */}
      {showConfirmDialog && preview && (
        <div className="dialog-overlay">
          <div className="dialog confirm-dialog">
            <h3>确认投资</h3>
            <p>
              确定要执行 <strong>{INVESTMENT_TYPES.find(t => t.type === selectedType)?.name}</strong> 投资吗？
            </p>
            <p>花费: {preview.cost.toLocaleString()} 石</p>
            <p>成功率: {(preview.successRate * 100).toFixed(0)}%</p>
            <div className="dialog-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmDialog(false)}
                disabled={executing}
              >
                取消
              </button>
              <button
                className="confirm-btn"
                onClick={handleExecuteInvestment}
                disabled={executing}
              >
                {executing ? '执行中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 结果弹窗 */}
      {showResultDialog && result && (
        <div className="dialog-overlay">
          <div className={`dialog result-dialog ${result.outcome}`}>
            <h3>
              {result.outcome === 'critical_success' && '🎉 大成功！'}
              {result.outcome === 'success' && '✅ 成功！'}
              {result.outcome === 'failure' && '❌ 失败'}
            </h3>
            <div className="result-content">
              <p className="roll-result">D100: {result.roll}</p>
              <p className="points-gained">
                {result.outcome !== 'failure' 
                  ? `获得 ${result.pointsGained} 点`
                  : '未获得点数'}
              </p>
              <p className="new-level">
                当前等级: {result.newLevel} ({result.newPoints}点)
              </p>
            </div>
            <button
              className="close-btn"
              onClick={() => {
                setShowResultDialog(false);
                setResult(null);
                // 重置表单
                setSelectedType(null);
                setSelectedSamurai('');
                setPreview(null);
              }}
            >
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestmentPanel;
