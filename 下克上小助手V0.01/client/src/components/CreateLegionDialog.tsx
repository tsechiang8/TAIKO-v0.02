/**
 * 军团创建弹窗组件
 * Requirements: 5.1-5.10, 12.5-12.8
 */

import { useState, useEffect, useCallback } from 'react';
import { Samurai, Territory, Legion } from '../types';
import { clampValue } from './RecruitDialog';
import './CreateLegionDialog.css';

interface CreateLegionDialogProps {
  isOpen: boolean;
  commanders: Samurai[];
  territories: Territory[];
  maxSoldiers: number;
  maxRifles: number;
  maxHorses: number;
  maxCannons: number;
  onConfirm: (data: CreateLegionData) => void;
  onCancel: () => void;
  onCheckConflict: (commanderId: string) => Promise<{ hasConflict: boolean; conflictLegion?: Legion }>;
}

export interface CreateLegionData {
  name: string;
  commanderId: string;
  soldierCount: number;
  rifles: number;
  horses: number;
  cannons: number;
  locationId: string;
  forceReassign?: boolean;
}

interface FormErrors {
  name?: string;
  commanderId?: string;
  soldierCount?: string;
  locationId?: string;
}

export function CreateLegionDialog({
  isOpen,
  commanders,
  territories,
  maxSoldiers,
  maxRifles,
  maxHorses,
  maxCannons,
  onConfirm,
  onCancel,
  onCheckConflict,
}: CreateLegionDialogProps) {
  // 表单状态
  const [name, setName] = useState('');
  const [commanderId, setCommanderId] = useState('');
  const [soldierCount, setSoldierCount] = useState(1);
  const [soldierInput, setSoldierInput] = useState('1');
  const [rifles, setRifles] = useState(0);
  const [riflesInput, setRiflesInput] = useState('0');
  const [horses, setHorses] = useState(0);
  const [horsesInput, setHorsesInput] = useState('0');
  const [cannons, setCannons] = useState(0);
  const [cannonsInput, setCannonsInput] = useState('0');
  const [locationId, setLocationId] = useState('');
  
  // 错误状态
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // 将领冲突状态
  const [conflictLegion, setConflictLegion] = useState<Legion | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // 重置表单
  useEffect(() => {
    if (isOpen) {
      setName('');
      setCommanderId('');
      setSoldierCount(1);
      setSoldierInput('1');
      setRifles(0);
      setRiflesInput('0');
      setHorses(0);
      setHorsesInput('0');
      setCannons(0);
      setCannonsInput('0');
      setLocationId('');
      setErrors({});
      setTouched({});
      setConflictLegion(null);
      setShowConflictDialog(false);
    }
  }, [isOpen]);

  // 验证军团名称 (Requirement 5.2, 5.7)
  const validateName = useCallback((value: string): string | undefined => {
    if (!value.trim()) {
      return '军团名称不能为空';
    }
    const chineseRegex = /^[\u4e00-\u9fa5]{1,8}$/;
    if (!chineseRegex.test(value.trim())) {
      return '军团名称必须为1-8个简体中文字符';
    }
    return undefined;
  }, []);

  // 处理名称变化
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  }, [touched.name, validateName]);

  // 处理名称失焦
  const handleNameBlur = useCallback(() => {
    setTouched(prev => ({ ...prev, name: true }));
    setErrors(prev => ({ ...prev, name: validateName(name) }));
  }, [name, validateName]);

  // 处理将领选择变化 (Requirement 5.9)
  const handleCommanderChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCommanderId(value);
    setTouched(prev => ({ ...prev, commanderId: true }));
    
    if (!value) {
      setErrors(prev => ({ ...prev, commanderId: '请选择将领' }));
      setConflictLegion(null);
      return;
    }
    
    setErrors(prev => ({ ...prev, commanderId: undefined }));
    
    // 检查将领冲突
    const result = await onCheckConflict(value);
    if (result.hasConflict && result.conflictLegion) {
      setConflictLegion(result.conflictLegion);
    } else {
      setConflictLegion(null);
    }
  }, [onCheckConflict]);


  // 处理士兵数量滑条变化
  const handleSoldierSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 1, 1, maxSoldiers);
    setSoldierCount(value);
    setSoldierInput(value.toString());
  }, [maxSoldiers]);

  // 处理士兵数量输入变化
  const handleSoldierInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSoldierInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setSoldierCount(clampValue(parsed, 1, maxSoldiers));
    }
  }, [maxSoldiers]);

  // 处理士兵数量输入失焦
  const handleSoldierInputBlur = useCallback(() => {
    const parsed = parseInt(soldierInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 1 : parsed, 1, maxSoldiers);
    setSoldierCount(clamped);
    setSoldierInput(clamped.toString());
  }, [soldierInput, maxSoldiers]);

  // 处理铁炮滑条变化
  const handleRiflesSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxRifles);
    setRifles(value);
    setRiflesInput(value.toString());
  }, [maxRifles]);

  // 处理铁炮输入变化
  const handleRiflesInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRiflesInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setRifles(clampValue(parsed, 0, maxRifles));
    }
  }, [maxRifles]);

  // 处理铁炮输入失焦
  const handleRiflesInputBlur = useCallback(() => {
    const parsed = parseInt(riflesInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxRifles);
    setRifles(clamped);
    setRiflesInput(clamped.toString());
  }, [riflesInput, maxRifles]);

  // 处理战马滑条变化
  const handleHorsesSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxHorses);
    setHorses(value);
    setHorsesInput(value.toString());
  }, [maxHorses]);

  // 处理战马输入变化
  const handleHorsesInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setHorsesInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setHorses(clampValue(parsed, 0, maxHorses));
    }
  }, [maxHorses]);

  // 处理战马输入失焦
  const handleHorsesInputBlur = useCallback(() => {
    const parsed = parseInt(horsesInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxHorses);
    setHorses(clamped);
    setHorsesInput(clamped.toString());
  }, [horsesInput, maxHorses]);

  // 处理大筒滑条变化
  const handleCannonsSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = clampValue(parseInt(e.target.value, 10) || 0, 0, maxCannons);
    setCannons(value);
    setCannonsInput(value.toString());
  }, [maxCannons]);

  // 处理大筒输入变化
  const handleCannonsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCannonsInput(e.target.value);
    const parsed = parseInt(e.target.value, 10);
    if (!isNaN(parsed)) {
      setCannons(clampValue(parsed, 0, maxCannons));
    }
  }, [maxCannons]);

  // 处理大筒输入失焦
  const handleCannonsInputBlur = useCallback(() => {
    const parsed = parseInt(cannonsInput, 10);
    const clamped = clampValue(isNaN(parsed) ? 0 : parsed, 0, maxCannons);
    setCannons(clamped);
    setCannonsInput(clamped.toString());
  }, [cannonsInput, maxCannons]);

  // 处理位置选择变化
  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocationId(value);
    setTouched(prev => ({ ...prev, locationId: true }));
    if (!value) {
      setErrors(prev => ({ ...prev, locationId: '请选择创建位置' }));
    } else {
      setErrors(prev => ({ ...prev, locationId: undefined }));
    }
  }, []);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    
    const nameError = validateName(name);
    if (nameError) newErrors.name = nameError;
    
    if (!commanderId) newErrors.commanderId = '请选择将领';
    if (soldierCount <= 0) newErrors.soldierCount = '军团人数必须大于0';
    if (!locationId) newErrors.locationId = '请选择创建位置';
    
    setErrors(newErrors);
    setTouched({ name: true, commanderId: true, soldierCount: true, locationId: true });
    
    return Object.keys(newErrors).length === 0;
  }, [name, commanderId, soldierCount, locationId, validateName]);

  // 处理提交
  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;
    
    // 如果有将领冲突，显示冲突对话框
    if (conflictLegion) {
      setShowConflictDialog(true);
      return;
    }
    
    onConfirm({
      name: name.trim(),
      commanderId,
      soldierCount,
      rifles,
      horses,
      cannons,
      locationId,
    });
  }, [validateForm, conflictLegion, name, commanderId, soldierCount, rifles, horses, cannons, locationId, onConfirm]);

  // 处理冲突确认（强制重新分配）
  const handleConflictConfirm = useCallback(() => {
    setShowConflictDialog(false);
    onConfirm({
      name: name.trim(),
      commanderId,
      soldierCount,
      rifles,
      horses,
      cannons,
      locationId,
      forceReassign: true,
    });
  }, [name, commanderId, soldierCount, rifles, horses, cannons, locationId, onConfirm]);

  // 处理冲突取消
  const handleConflictCancel = useCallback(() => {
    setShowConflictDialog(false);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="create-legion-overlay" onClick={onCancel}>
        <div className="create-legion-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="create-legion-header">
            <h3>建立军团</h3>
            <button className="close-btn" onClick={onCancel}>×</button>
          </div>
          
          <div className="create-legion-content">
            {/* 军团名称 (Requirement 5.2) */}
            <div className={`form-group ${errors.name && touched.name ? 'has-error' : ''}`}>
              <label htmlFor="legion-name">军团名称 *</label>
              <input
                type="text"
                id="legion-name"
                value={name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                placeholder="请输入1-8个简体中文字符"
                maxLength={8}
                className={errors.name && touched.name ? 'error-input' : ''}
              />
              {errors.name && touched.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            {/* 将领选择 (Requirement 5.3) */}
            <div className={`form-group ${errors.commanderId && touched.commanderId ? 'has-error' : ''}`}>
              <label htmlFor="commander">将领 *</label>
              <select
                id="commander"
                value={commanderId}
                onChange={handleCommanderChange}
                className={errors.commanderId && touched.commanderId ? 'error-input' : ''}
              >
                <option value="">请选择将领</option>
                {commanders.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.type === 'warrior' ? '猛将' : '智将'}) - 武功:{s.martialValue} 文治:{s.civilValue}
                  </option>
                ))}
              </select>
              {errors.commanderId && touched.commanderId && (
                <span className="error-message">{errors.commanderId}</span>
              )}
              {conflictLegion && (
                <span className="warning-message">
                  ⚠️ 该将领已是军团「{conflictLegion.name}」的指挥官
                </span>
              )}
            </div>

            {/* 军团人数 (Requirement 5.4) */}
            <div className="form-group">
              <label>军团人数 * (库存: {maxSoldiers.toLocaleString('zh-CN')})</label>
              <input
                type="range"
                min={1}
                max={maxSoldiers}
                value={soldierCount}
                onChange={handleSoldierSliderChange}
                disabled={maxSoldiers === 0}
              />
              <div className="number-input-wrapper">
                <input
                  type="number"
                  min={1}
                  max={maxSoldiers}
                  value={soldierInput}
                  onChange={handleSoldierInputChange}
                  onBlur={handleSoldierInputBlur}
                  disabled={maxSoldiers === 0}
                />
                <span className="unit">人</span>
              </div>
            </div>

            {/* 军械配置 (Requirement 5.5) */}
            <div className="equipment-section">
              <h4>军械配置</h4>
              
              <div className="form-group">
                <label>铁炮 (库存: {maxRifles.toLocaleString('zh-CN')})</label>
                <input
                  type="range"
                  min={0}
                  max={maxRifles}
                  value={rifles}
                  onChange={handleRiflesSliderChange}
                  disabled={maxRifles === 0}
                />
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    min={0}
                    max={maxRifles}
                    value={riflesInput}
                    onChange={handleRiflesInputChange}
                    onBlur={handleRiflesInputBlur}
                    disabled={maxRifles === 0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>战马 (库存: {maxHorses.toLocaleString('zh-CN')})</label>
                <input
                  type="range"
                  min={0}
                  max={maxHorses}
                  value={horses}
                  onChange={handleHorsesSliderChange}
                  disabled={maxHorses === 0}
                />
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    min={0}
                    max={maxHorses}
                    value={horsesInput}
                    onChange={handleHorsesInputChange}
                    onBlur={handleHorsesInputBlur}
                    disabled={maxHorses === 0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>大筒 (库存: {maxCannons.toLocaleString('zh-CN')})</label>
                <input
                  type="range"
                  min={0}
                  max={maxCannons}
                  value={cannons}
                  onChange={handleCannonsSliderChange}
                  disabled={maxCannons === 0}
                />
                <div className="number-input-wrapper">
                  <input
                    type="number"
                    min={0}
                    max={maxCannons}
                    value={cannonsInput}
                    onChange={handleCannonsInputChange}
                    onBlur={handleCannonsInputBlur}
                    disabled={maxCannons === 0}
                  />
                </div>
              </div>
            </div>

            {/* 创建位置 (Requirement 5.6) */}
            <div className={`form-group ${errors.locationId && touched.locationId ? 'has-error' : ''}`}>
              <label htmlFor="location">创建位置 *</label>
              <select
                id="location"
                value={locationId}
                onChange={handleLocationChange}
                className={errors.locationId && touched.locationId ? 'error-input' : ''}
              >
                <option value="">请选择位置</option>
                {territories.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.districtName} ({t.provinceName})
                  </option>
                ))}
              </select>
              {errors.locationId && touched.locationId && (
                <span className="error-message">{errors.locationId}</span>
              )}
            </div>
          </div>

          <div className="create-legion-footer">
            <button className="cancel-btn" onClick={onCancel}>取消</button>
            <button
              className="confirm-btn"
              onClick={handleSubmit}
              disabled={maxSoldiers === 0}
            >
              创建军团
            </button>
          </div>
        </div>
      </div>

      {/* 将领冲突确认弹窗 (Requirement 5.9) */}
      {showConflictDialog && conflictLegion && (
        <div className="conflict-dialog-overlay" onClick={handleConflictCancel}>
          <div className="conflict-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="conflict-dialog-header">
              <h3>⚠️ 将领冲突</h3>
            </div>
            <div className="conflict-dialog-content">
              <p>
                将领 <strong>{commanders.find(c => c.id === commanderId)?.name}</strong> 
                已是军团「<strong>{conflictLegion.name}</strong>」的指挥官。
              </p>
              <p>如果继续，原军团将被解散，资源将返还库存。</p>
              <p className="warning-text">此操作不可撤销，是否继续？</p>
            </div>
            <div className="conflict-dialog-footer">
              <button className="cancel-btn" onClick={handleConflictCancel}>取消</button>
              <button className="danger-btn" onClick={handleConflictConfirm}>
                解散原军团并创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateLegionDialog;
