/**
 * 编辑军团装备弹窗组件
 * Requirements: 6.5, 6.6, 12.5-12.8
 */

import { useState, useEffect, useCallback } from 'react';
import { Legion } from '../types';
import { clampValue } from './RecruitDialog';
import './EditEquipmentDialog.css';

interface EditEquipmentDialogProps {
  isOpen: boolean;
  legion: Legion | null;
  maxRifles: number;
  maxHorses: number;
  maxCannons: number;
  onConfirm: (legionId: string, equipment: { rifles: number; horses: number; cannons: number }) => void;
  onCancel: () => void;
}

export function EditEquipmentDialog({
  isOpen,
  legion,
  maxRifles,
  maxHorses,
  maxCannons,
  onConfirm,
  onCancel,
}: EditEquipmentDialogProps) {
  const [rifles, setRifles] = useState(0);
  const [riflesInput, setRiflesInput] = useState('0');
  const [horses, setHorses] = useState(0);
  const [horsesInput, setHorsesInput] = useState('0');
  const [cannons, setCannons] = useState(0);
  const [cannonsInput, setCannonsInput] = useState('0');

  // 计算最大值 = 当前装备 + 库存
  const maxRiflesTotal = legion ? legion.rifles + maxRifles : 0;
  const maxHorsesTotal = legion ? legion.horses + maxHorses : 0;
  const maxCannonsTotal = legion ? legion.cannons + maxCannons : 0;

  // 重置状态
  useEffect(() => {
    if (isOpen && legion) {
      setRifles(legion.rifles);
      setRiflesInput(legion.rifles.toString());
      setHorses(legion.horses);
      setHorsesInput(legion.horses.toString());
      setCannons(legion.cannons);
      setCannonsInput(legion.cannons.toString());
    }
  }, [isOpen, legion]);

  // 铁炮处理
  const handleRiflesSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxRiflesTotal);
    setRifles(value);
    setRiflesInput(value.toString());
  }, [maxRiflesTotal]);

  const handleRiflesInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRiflesInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setRifles(clampValue(parsed, 0, maxRiflesTotal));
    }
  }, [maxRiflesTotal]);

  const handleRiflesInputBlur = useCallback(() => {
    const parsed = parseInt(riflesInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxRiflesTotal);
    setRifles(clamped);
    setRiflesInput(clamped.toString());
  }, [riflesInput, maxRiflesTotal]);

  // 战马处理
  const handleHorsesSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxHorsesTotal);
    setHorses(value);
    setHorsesInput(value.toString());
  }, [maxHorsesTotal]);

  const handleHorsesInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHorsesInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setHorses(clampValue(parsed, 0, maxHorsesTotal));
    }
  }, [maxHorsesTotal]);

  const handleHorsesInputBlur = useCallback(() => {
    const parsed = parseInt(horsesInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxHorsesTotal);
    setHorses(clamped);
    setHorsesInput(clamped.toString());
  }, [horsesInput, maxHorsesTotal]);

  // 大筒处理
  const handleCannonsSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxCannonsTotal);
    setCannons(value);
    setCannonsInput(value.toString());
  }, [maxCannonsTotal]);

  const handleCannonsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCannonsInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setCannons(clampValue(parsed, 0, maxCannonsTotal));
    }
  }, [maxCannonsTotal]);

  const handleCannonsInputBlur = useCallback(() => {
    const parsed = parseInt(cannonsInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxCannonsTotal);
    setCannons(clamped);
    setCannonsInput(clamped.toString());
  }, [cannonsInput, maxCannonsTotal]);

  // 处理确认
  const handleConfirm = useCallback(() => {
    if (!legion) return;
    onConfirm(legion.id, { rifles, horses, cannons });
  }, [legion, rifles, horses, cannons, onConfirm]);

  if (!isOpen || !legion) return null;

  const riflesDiff = rifles - legion.rifles;
  const horsesDiff = horses - legion.horses;
  const cannonsDiff = cannons - legion.cannons;
  const hasChanges = riflesDiff !== 0 || horsesDiff !== 0 || cannonsDiff !== 0;

  return (
    <div className="edit-equipment-overlay" onClick={onCancel}>
      <div className="edit-equipment-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="edit-equipment-header">
          <h3>编辑装备 - {legion.name}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>
        
        <div className="edit-equipment-content">
          {/* 铁炮 */}
          <div className="equipment-item">
            <div className="equipment-header">
              <span className="equipment-name">铁炮</span>
              <span className="equipment-info">
                当前: {legion.rifles} | 库存: {maxRifles}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxRiflesTotal}
              value={rifles}
              onChange={handleRiflesSliderChange}
            />
            <div className="number-input-wrapper">
              <input
                type="number"
                min={0}
                max={maxRiflesTotal}
                value={riflesInput}
                onChange={handleRiflesInputChange}
                onBlur={handleRiflesInputBlur}
              />
              {riflesDiff !== 0 && (
                <span className={`diff ${riflesDiff > 0 ? 'increase' : 'decrease'}`}>
                  {riflesDiff > 0 ? '+' : ''}{riflesDiff}
                </span>
              )}
            </div>
          </div>

          {/* 战马 */}
          <div className="equipment-item">
            <div className="equipment-header">
              <span className="equipment-name">战马</span>
              <span className="equipment-info">
                当前: {legion.horses} | 库存: {maxHorses}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxHorsesTotal}
              value={horses}
              onChange={handleHorsesSliderChange}
            />
            <div className="number-input-wrapper">
              <input
                type="number"
                min={0}
                max={maxHorsesTotal}
                value={horsesInput}
                onChange={handleHorsesInputChange}
                onBlur={handleHorsesInputBlur}
              />
              {horsesDiff !== 0 && (
                <span className={`diff ${horsesDiff > 0 ? 'increase' : 'decrease'}`}>
                  {horsesDiff > 0 ? '+' : ''}{horsesDiff}
                </span>
              )}
            </div>
          </div>

          {/* 大筒 */}
          <div className="equipment-item">
            <div className="equipment-header">
              <span className="equipment-name">大筒</span>
              <span className="equipment-info">
                当前: {legion.cannons} | 库存: {maxCannons}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxCannonsTotal}
              value={cannons}
              onChange={handleCannonsSliderChange}
            />
            <div className="number-input-wrapper">
              <input
                type="number"
                min={0}
                max={maxCannonsTotal}
                value={cannonsInput}
                onChange={handleCannonsInputChange}
                onBlur={handleCannonsInputBlur}
              />
              {cannonsDiff !== 0 && (
                <span className={`diff ${cannonsDiff > 0 ? 'increase' : 'decrease'}`}>
                  {cannonsDiff > 0 ? '+' : ''}{cannonsDiff}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="edit-equipment-footer">
          <button className="cancel-btn" onClick={onCancel}>取消</button>
          <button
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!hasChanges}
          >
            确认修改
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditEquipmentDialog;
