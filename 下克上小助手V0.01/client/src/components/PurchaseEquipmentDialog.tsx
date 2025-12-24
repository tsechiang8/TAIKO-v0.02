/**
 * 装备购买对话框组件
 * 价格：铁炮10石/挺、战马12石/匹、大筒450石/门
 */

import { useState, useEffect } from 'react';
import { EQUIPMENT_PRICES } from '../api';
import './PurchaseEquipmentDialog.css';

interface PurchaseEquipmentDialogProps {
  isOpen: boolean;
  treasury: number;
  onConfirm: (rifles: number, horses: number, cannons: number) => void;
  onCancel: () => void;
}

export function PurchaseEquipmentDialog({
  isOpen,
  treasury,
  onConfirm,
  onCancel,
}: PurchaseEquipmentDialogProps) {
  const [rifles, setRifles] = useState(0);
  const [horses, setHorses] = useState(0);
  const [cannons, setCannons] = useState(0);

  // 计算总价
  const totalCost = 
    rifles * EQUIPMENT_PRICES.rifles +
    horses * EQUIPMENT_PRICES.horses +
    cannons * EQUIPMENT_PRICES.cannons;

  // 计算各装备最大可购买数量
  const maxRifles = Math.floor(treasury / EQUIPMENT_PRICES.rifles);
  const maxHorses = Math.floor(treasury / EQUIPMENT_PRICES.horses);
  const maxCannons = Math.floor(treasury / EQUIPMENT_PRICES.cannons);

  // 计算剩余金库可购买的数量（考虑已选择的其他装备）
  const remainingTreasury = treasury - totalCost;
  const canAfford = totalCost <= treasury;

  useEffect(() => {
    if (isOpen) {
      setRifles(0);
      setHorses(0);
      setCannons(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (totalCost > 0 && canAfford) {
      onConfirm(rifles, horses, cannons);
    }
  };

  const handleRiflesChange = (value: number) => {
    const newValue = Math.max(0, Math.min(value, maxRifles));
    setRifles(newValue);
  };

  const handleHorsesChange = (value: number) => {
    const newValue = Math.max(0, Math.min(value, maxHorses));
    setHorses(newValue);
  };

  const handleCannonsChange = (value: number) => {
    const newValue = Math.max(0, Math.min(value, maxCannons));
    setCannons(newValue);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content purchase-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>购买装备</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="treasury-info">
            <span>当前金库：</span>
            <span className="treasury-value">{treasury.toLocaleString()}石</span>
          </div>

          {/* 铁炮 */}
          <div className="equipment-row">
            <div className="equipment-info">
              <span className="equipment-name">铁炮</span>
              <span className="equipment-price">{EQUIPMENT_PRICES.rifles}石/挺</span>
            </div>
            <div className="equipment-input">
              <input
                type="range"
                min="0"
                max={maxRifles}
                value={rifles}
                onChange={e => handleRiflesChange(Number(e.target.value))}
              />
              <input
                type="number"
                min="0"
                max={maxRifles}
                value={rifles}
                onChange={e => handleRiflesChange(Number(e.target.value))}
              />
              <span className="equipment-subtotal">
                = {(rifles * EQUIPMENT_PRICES.rifles).toLocaleString()}石
              </span>
            </div>
          </div>

          {/* 战马 */}
          <div className="equipment-row">
            <div className="equipment-info">
              <span className="equipment-name">战马</span>
              <span className="equipment-price">{EQUIPMENT_PRICES.horses}石/匹</span>
            </div>
            <div className="equipment-input">
              <input
                type="range"
                min="0"
                max={maxHorses}
                value={horses}
                onChange={e => handleHorsesChange(Number(e.target.value))}
              />
              <input
                type="number"
                min="0"
                max={maxHorses}
                value={horses}
                onChange={e => handleHorsesChange(Number(e.target.value))}
              />
              <span className="equipment-subtotal">
                = {(horses * EQUIPMENT_PRICES.horses).toLocaleString()}石
              </span>
            </div>
          </div>

          {/* 大筒 */}
          <div className="equipment-row">
            <div className="equipment-info">
              <span className="equipment-name">大筒</span>
              <span className="equipment-price">{EQUIPMENT_PRICES.cannons}石/门</span>
            </div>
            <div className="equipment-input">
              <input
                type="range"
                min="0"
                max={maxCannons}
                value={cannons}
                onChange={e => handleCannonsChange(Number(e.target.value))}
              />
              <input
                type="number"
                min="0"
                max={maxCannons}
                value={cannons}
                onChange={e => handleCannonsChange(Number(e.target.value))}
              />
              <span className="equipment-subtotal">
                = {(cannons * EQUIPMENT_PRICES.cannons).toLocaleString()}石
              </span>
            </div>
          </div>

          {/* 总价 */}
          <div className="total-section">
            <div className="total-row">
              <span>总价：</span>
              <span className={`total-value ${!canAfford ? 'over-budget' : ''}`}>
                {totalCost.toLocaleString()}石
              </span>
            </div>
            <div className="remaining-row">
              <span>购买后剩余：</span>
              <span className={`remaining-value ${remainingTreasury < 0 ? 'negative' : ''}`}>
                {remainingTreasury.toLocaleString()}石
              </span>
            </div>
          </div>

          {!canAfford && (
            <div className="error-message">金库不足！</div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>取消</button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={totalCost === 0 || !canAfford}
          >
            确认购买
          </button>
        </div>
      </div>
    </div>
  );
}

export default PurchaseEquipmentDialog;
