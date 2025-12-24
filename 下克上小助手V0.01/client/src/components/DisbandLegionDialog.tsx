/**
 * 解散军团确认弹窗组件
 * Requirements: 6.1, 6.2
 */

import { Legion } from '../types';
import './DisbandLegionDialog.css';

interface DisbandLegionDialogProps {
  isOpen: boolean;
  legion: Legion | null;
  onConfirm: (legionId: string) => void;
  onCancel: () => void;
}

export function DisbandLegionDialog({
  isOpen,
  legion,
  onConfirm,
  onCancel,
}: DisbandLegionDialogProps) {
  if (!isOpen || !legion) return null;

  const handleConfirm = () => {
    onConfirm(legion.id);
  };

  return (
    <div className="disband-legion-overlay" onClick={onCancel}>
      <div className="disband-legion-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="disband-legion-header">
          <h3>⚠️ 确认解散军团</h3>
        </div>
        
        <div className="disband-legion-content">
          <p>确定要解散军团「<strong>{legion.name}</strong>」吗？</p>
          
          <div className="return-resources">
            <p>以下资源将返还库存：</p>
            <ul>
              <li>
                <span className="resource-name">士兵</span>
                <span className="resource-value">{legion.soldierCount.toLocaleString('zh-CN')} 人</span>
              </li>
              <li>
                <span className="resource-name">铁炮</span>
                <span className="resource-value">{legion.rifles}</span>
              </li>
              <li>
                <span className="resource-name">战马</span>
                <span className="resource-value">{legion.horses}</span>
              </li>
              <li>
                <span className="resource-name">大筒</span>
                <span className="resource-value">{legion.cannons}</span>
              </li>
            </ul>
          </div>
          
          <p className="commander-info">
            将领「{legion.commanderName}」将恢复闲置状态。
          </p>
          
          <p className="warning-text">此操作不可撤销！</p>
        </div>

        <div className="disband-legion-footer">
          <button className="cancel-btn" onClick={onCancel}>取消</button>
          <button className="danger-btn" onClick={handleConfirm}>确认解散</button>
        </div>
      </div>
    </div>
  );
}

export default DisbandLegionDialog;
