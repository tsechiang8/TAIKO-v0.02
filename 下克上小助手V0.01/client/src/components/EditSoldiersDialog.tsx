/**
 * 编辑军团人数弹窗组件
 * Requirements: 6.3, 6.4, 12.5-12.8
 */

import { useState, useEffect, useCallback } from 'react';
import { Legion } from '../types';
import { clampValue } from './RecruitDialog';
import './EditSoldiersDialog.css';

interface EditSoldiersDialogProps {
  isOpen: boolean;
  legion: Legion | null;
  maxIdleSoldiers: number;
  onConfirm: (legionId: string, newCount: number) => void;
  onDisband: (legionId: string) => void;
  onCancel: () => void;
}

export function EditSoldiersDialog({
  isOpen,
  legion,
  maxIdleSoldiers,
  onConfirm,
  onDisband,
  onCancel,
}: EditSoldiersDialogProps) {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('0');
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);

  // 计算最大值 = 当前人数 + 库存闲置士兵
  const maxValue = legion ? legion.soldierCount + maxIdleSoldiers : 0;

  // 重置状态
  useEffect(() => {
    if (isOpen && legion) {
      setCount(legion.soldierCount);
      setInputValue(legion.soldierCount.toString());
      setShowDisbandConfirm(false);
    }
  }, [isOpen, legion]);

  // 处理滑条变化
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxValue);
    setCount(value);
    setInputValue(value.toString());
  }, [maxValue]);

  // 处理输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setCount(clampValue(parsed, 0, maxValue));
    }
  }, [maxValue]);

  // 处理输入失焦
  const handleInputBlur = useCallback(() => {
    const parsed = parseInt(inputValue, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxValue);
    setCount(clamped);
    setInputValue(clamped.toString());
  }, [inputValue, maxValue]);

  // 处理确认
  const handleConfirm = useCallback(() => {
    if (!legion) return;
    
    // 如果人数为0，询问是否解散 (Requirement 6.4)
    if (count === 0) {
      setShowDisbandConfirm(true);
      return;
    }
    
    onConfirm(legion.id, count);
  }, [legion, count, onConfirm]);

  // 处理解散确认
  const handleDisbandConfirm = useCallback(() => {
    if (!legion) return;
    onDisband(legion.id);
  }, [legion, onDisband]);

  // 处理解散取消
  const handleDisbandCancel = useCallback(() => {
    setShowDisbandConfirm(false);
  }, []);

  if (!isOpen || !legion) return null;

  const diff = count - legion.soldierCount;

  return (
    <>
      <div className="edit-soldiers-overlay" onClick={onCancel}>
        <div className="edit-soldiers-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="edit-soldiers-header">
            <h3>编辑人数 - {legion.name}</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          
          <div className="edit-soldiers-content">
            <div className="info-section">
              <div className="info-row">
                <span className="label">当前人数:</span>
                <span className="value">{legion.soldierCount.toLocaleString('zh-CN')} 人</span>
              </div>
              <div className="info-row">
                <span className="label">库存闲置士兵:</span>
                <span className="value">{maxIdleSoldiers.toLocaleString('zh-CN')} 人</span>
              </div>
              <div className="info-row">
                <span className="label">可调整范围:</span>
                <span className="value">0 - {maxValue.toLocaleString('zh-CN')} 人</span>
              </div>
            </div>

            <div className="input-section">
              <label>新人数:</label>
              <input
                type="range"
                min={0}
                max={maxValue}
                value={count}
                onChange={handleSliderChange}
              />
              <div className="number-input-wrapper">
                <input
                  type="number"
                  min={0}
                  max={maxValue}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                />
                <span className="unit">人</span>
              </div>
            </div>

            <div className="preview-section">
              {diff > 0 && (
                <div className="preview-item increase">
                  <span>从库存调入:</span>
                  <span>+{diff.toLocaleString('zh-CN')} 人</span>
                </div>
              )}
              {diff < 0 && (
                <div className="preview-item decrease">
                  <span>返还库存:</span>
                  <span>{Math.abs(diff).toLocaleString('zh-CN')} 人</span>
                </div>
              )}
              {diff === 0 && (
                <div className="preview-item unchanged">
                  <span>人数未变化</span>
                </div>
              )}
            </div>

            {count === 0 && (
              <div className="warning-section">
                ⚠️ 人数为0将解散军团
              </div>
            )}
          </div>

          <div className="edit-soldiers-footer">
            <button className="cancel-btn" onClick={onCancel}>取消</button>
            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={diff === 0}
            >
              {count === 0 ? '解散军团' : '确认修改'}
            </button>
          </div>
        </div>
      </div>

      {/* 解散确认弹窗 */}
      {showDisbandConfirm && (
        <div className="disband-confirm-overlay" onClick={handleDisbandCancel}>
          <div className="disband-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="disband-confirm-header">
              <h3>⚠️ 确认解散</h3>
            </div>
            <div className="disband-confirm-content">
              <p>确定要解散军团「<strong>{legion.name}</strong>」吗？</p>
              <p>军团资源将返还库存：</p>
              <ul>
                <li>士兵: {legion.soldierCount.toLocaleString('zh-CN')} 人</li>
                <li>铁炮: {legion.rifles}</li>
                <li>战马: {legion.horses}</li>
                <li>大筒: {legion.cannons}</li>
              </ul>
              <p className="warning-text">此操作不可撤销！</p>
            </div>
            <div className="disband-confirm-footer">
              <button className="cancel-btn" onClick={handleDisbandCancel}>取消</button>
              <button className="danger-btn" onClick={handleDisbandConfirm}>确认解散</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EditSoldiersDialog;
