/**
 * 解散士兵对话框组件
 */

import { useState, useEffect } from 'react';
import './DisbandSoldiersDialog.css';

interface DisbandSoldiersDialogProps {
  isOpen: boolean;
  maxValue: number;
  currentIdleSoldiers: number;
  treasury: number;
  costPerSoldier: number;
  onConfirm: (count: number) => void;
  onCancel: () => void;
}

export function DisbandSoldiersDialog({
  isOpen,
  maxValue,
  currentIdleSoldiers,
  treasury,
  costPerSoldier,
  onConfirm,
  onCancel,
}: DisbandSoldiersDialogProps) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setValue(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(0, Math.min(maxValue, Number(e.target.value) || 0));
    setValue(newValue);
  };

  const totalCost = value * costPerSoldier;

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3>解散士兵</h3>
        
        <div className="dialog-info">
          <div className="info-row">
            <span>当前闲置士兵：</span>
            <span>{currentIdleSoldiers.toLocaleString()}人</span>
          </div>
          <div className="info-row">
            <span>当前金库：</span>
            <span>{treasury.toLocaleString()}石</span>
          </div>
          <div className="info-row">
            <span>解散费用：</span>
            <span>{costPerSoldier}石/人</span>
          </div>
        </div>

        <div className="slider-group">
          <label>解散数量：{value.toLocaleString()}人</label>
          <input
            type="range"
            min={0}
            max={maxValue}
            value={value}
            onChange={handleSliderChange}
          />
          <input
            type="number"
            min={0}
            max={maxValue}
            value={value}
            onChange={handleInputChange}
          />
        </div>

        <div className="cost-preview">
          <span>总费用：</span>
          <span className="cost-value">{totalCost.toLocaleString()}石</span>
        </div>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel}>取消</button>
          <button 
            className="confirm-btn" 
            onClick={() => onConfirm(value)}
            disabled={value <= 0}
          >
            确认解散
          </button>
        </div>
      </div>
    </div>
  );
}

export default DisbandSoldiersDialog;
