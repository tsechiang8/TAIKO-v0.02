/**
 * 士兵招募弹窗组件
 * Requirements: 4.1-4.5, 12.5-12.8
 * 
 * - 滑动条+数字输入框组合 (12.5)
 * - 双向联动 (12.6)
 * - 边界限制: 小于0自动变为0 (12.7)
 * - 边界限制: 大于最大值自动变为最大值 (12.8)
 */

import { useState, useEffect, useCallback } from 'react';
import './RecruitDialog.css';

interface RecruitDialogProps {
  isOpen: boolean;
  maxValue: number;
  currentIdleSoldiers: number;
  onConfirm: (count: number) => void;
  onCancel: () => void;
}

/**
 * 限制数值在边界范围内
 * Property 13: 数值输入边界
 * - 输入值小于0时自动变为0 (Requirement 12.7)
 * - 输入值大于最大值时自动变为最大值 (Requirement 12.8)
 */
export function clampValue(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function RecruitDialog({
  isOpen,
  maxValue,
  currentIdleSoldiers,
  onConfirm,
  onCancel,
}: RecruitDialogProps) {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState('0');

  // 重置状态当弹窗打开时
  useEffect(() => {
    if (isOpen) {
      setCount(0);
      setInputValue('0');
    }
  }, [isOpen]);

  // 处理滑动条变化 - 双向联动 (Requirement 12.6)
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = clampValue(parseInt(e.target.value, 10) || 0, 0, maxValue);
    setCount(newValue);
    setInputValue(newValue.toString());
  }, [maxValue]);

  // 处理数字输入框变化 - 双向联动 (Requirement 12.6)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setInputValue(rawValue);
    
    // 解析数值并应用边界限制 (Requirements 12.7, 12.8)
    const parsedValue = parseInt(rawValue, 10);
    if (!isNaN(parsedValue)) {
      const clampedValue = clampValue(parsedValue, 0, maxValue);
      setCount(clampedValue);
    }
  }, [maxValue]);

  // 输入框失去焦点时应用边界限制
  const handleInputBlur = useCallback(() => {
    const parsedValue = parseInt(inputValue, 10);
    if (isNaN(parsedValue) || parsedValue < 0) {
      // 小于0自动变为0 (Requirement 12.7)
      setCount(0);
      setInputValue('0');
    } else if (parsedValue > maxValue) {
      // 大于最大值自动变为最大值 (Requirement 12.8)
      setCount(maxValue);
      setInputValue(maxValue.toString());
    } else {
      setCount(parsedValue);
      setInputValue(parsedValue.toString());
    }
  }, [inputValue, maxValue]);

  // 处理确认
  const handleConfirm = useCallback(() => {
    if (count > 0) {
      onConfirm(count);
    }
  }, [count, onConfirm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="recruit-dialog-overlay" onClick={onCancel}>
      <div className="recruit-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="recruit-dialog-header">
          <h3>招募士兵</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="recruit-dialog-content">
          <div className="recruit-info">
            <div className="info-row">
              <span className="label">当前闲置士兵:</span>
              <span className="value">{currentIdleSoldiers.toLocaleString('zh-CN')} 人</span>
            </div>
            <div className="info-row">
              <span className="label">可招募上限:</span>
              <span className="value">{maxValue.toLocaleString('zh-CN')} 人</span>
            </div>
          </div>

          <div className="recruit-input-group">
            <label htmlFor="recruit-count">招募数量:</label>
            
            {/* 滑动条 (Requirement 12.5) */}
            <input
              type="range"
              id="recruit-slider"
              className="recruit-slider"
              min={0}
              max={maxValue}
              value={count}
              onChange={handleSliderChange}
              disabled={maxValue === 0}
            />
            
            {/* 数字输入框 (Requirement 12.5) */}
            <div className="number-input-wrapper">
              <input
                type="number"
                id="recruit-count"
                className="recruit-number-input"
                min={0}
                max={maxValue}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                disabled={maxValue === 0}
              />
              <span className="unit">人</span>
            </div>
          </div>

          {maxValue === 0 && (
            <div className="recruit-warning">
              当前无法招募更多士兵，已达到招募上限
            </div>
          )}

          <div className="recruit-preview">
            <span>招募后闲置士兵: </span>
            <span className="preview-value">
              {(currentIdleSoldiers + count).toLocaleString('zh-CN')} 人
            </span>
          </div>
        </div>

        <div className="recruit-dialog-footer">
          <button className="cancel-btn" onClick={onCancel}>
            取消
          </button>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={count === 0 || maxValue === 0}
          >
            确认招募
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecruitDialog;
