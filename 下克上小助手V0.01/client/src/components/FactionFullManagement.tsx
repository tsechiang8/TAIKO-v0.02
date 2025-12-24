/**
 * 势力完整管理组件
 * 显示所有势力的完整数据，支持编辑
 */

import { useState, useEffect } from 'react';
import { getAdminFactionsFull, updateFaction, FactionFullInfo } from '../api';
import SamuraiManagementDialog from './SamuraiManagementDialog';
import './FactionFullManagement.css';

export function FactionFullManagement() {
  const [factions, setFactions] = useState<FactionFullInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFaction, setEditingFaction] = useState<FactionFullInfo | null>(null);
  const [editForm, setEditForm] = useState<Partial<FactionFullInfo>>({});
  const [showSamuraiDialog, setShowSamuraiDialog] = useState<{ factionId: string; factionName: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminFactionsFull();
      if (result.success && result.data) {
        setFactions(result.data);
      } else {
        setError(result.error || '获取势力数据失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faction: FactionFullInfo) => {
    setEditingFaction(faction);
    setEditForm({ ...faction });
  };

  const handleSave = async () => {
    if (!editingFaction) return;
    
    const result = await updateFaction(editingFaction.id, {
      name: editForm.name,
      lordName: editForm.lordName,
      taxRate: editForm.taxRate,
      treasury: editForm.treasury,
      idleSoldiers: editForm.idleSoldiers,
      rifles: editForm.rifles,
      horses: editForm.horses,
      cannons: editForm.cannons,
      agriculturePoints: editForm.agriculturePoints,
      commercePoints: editForm.commercePoints,
      navyPoints: editForm.navyPoints,
      armamentPoints: editForm.armamentPoints,
      industryKokudaka: editForm.industryKokudaka,
    });

    if (result.success) {
      setEditingFaction(null);
      loadData();
    } else {
      alert(result.error || '保存失败');
    }
  };

  const handleCancel = () => {
    setEditingFaction(null);
    setEditForm({});
  };

  const handleEditSamurais = (faction: FactionFullInfo) => {
    setShowSamuraiDialog({ factionId: faction.id, factionName: faction.name });
  };

  const handleCloseSamuraiDialog = () => {
    setShowSamuraiDialog(null);
    // 重新加载数据以更新武士数量
    loadData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadData}>重试</button>
      </div>
    );
  }

  return (
    <div className="faction-full-management">
      <div className="management-header">
        <h2>势力完整管理</h2>
        <button className="btn btn-secondary" onClick={loadData}>刷新</button>
      </div>

      {factions.length === 0 ? (
        <div className="empty-state">暂无势力数据</div>
      ) : (
        <div className="faction-cards">
          {factions.map(faction => (
            <div key={faction.id} className="faction-card">
              <div className="faction-card-header">
                <h3>{faction.name}</h3>
                <div className="faction-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEditSamurais(faction)}>
                    编辑武士
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={() => handleEdit(faction)}>
                    编辑
                  </button>
                </div>
              </div>
              
              {/* 第一行：基础信息 */}
              <div className="faction-row">
                <div className="faction-field">
                  <label>家主姓名</label>
                  <span>{faction.lordName}</span>
                </div>
                <div className="faction-field">
                  <label>登录代码</label>
                  <span className="code">{faction.code}</span>
                </div>
                <div className="faction-field">
                  <label>税率</label>
                  <span>{(faction.taxRate * 100).toFixed(0)}%</span>
                </div>
                <div className="faction-field">
                  <label>金库</label>
                  <span>{faction.treasury.toLocaleString()}石</span>
                </div>
              </div>

              {/* 第二行：兵力与装备 */}
              <div className="faction-row">
                <div className="faction-field">
                  <label>闲置士兵</label>
                  <span>{faction.idleSoldiers.toLocaleString()}人</span>
                </div>
                <div className="faction-field">
                  <label>铁炮</label>
                  <span>{faction.rifles.toLocaleString()}挺</span>
                </div>
                <div className="faction-field">
                  <label>战马</label>
                  <span>{faction.horses.toLocaleString()}匹</span>
                </div>
                <div className="faction-field">
                  <label>大筒</label>
                  <span>{faction.cannons.toLocaleString()}门</span>
                </div>
              </div>

              {/* 第三行：投资点数 */}
              <div className="faction-row">
                <div className="faction-field">
                  <label>农业点数</label>
                  <span>{faction.agriculturePoints}</span>
                </div>
                <div className="faction-field">
                  <label>商业点数</label>
                  <span>{faction.commercePoints}</span>
                </div>
                <div className="faction-field">
                  <label>水军点数</label>
                  <span>{faction.navyPoints}</span>
                </div>
                <div className="faction-field">
                  <label>武备点数</label>
                  <span>{faction.armamentPoints}</span>
                </div>
              </div>

              {/* 第四行：石高与武士 */}
              <div className="faction-row">
                <div className="faction-field">
                  <label>产业石高</label>
                  <span>{(faction.industryKokudaka / 10000).toFixed(2)}万石</span>
                </div>
                <div className="faction-field">
                  <label>上级武士数</label>
                  <span>{faction.samuraiCount}人</span>
                </div>
                <div className="faction-field">
                  <label>表面石高</label>
                  <span>{(faction.surfaceKokudaka / 10000).toFixed(2)}万石</span>
                </div>
                <div className="faction-field">
                  <label>总兵力</label>
                  <span>{faction.totalSoldiers.toLocaleString()}人</span>
                </div>
              </div>

              {/* 加成明细 */}
              {faction.buffs && faction.buffs.length > 0 && (
                <div className="faction-buffs">
                  <label>加成明细</label>
                  <div className="buffs-list">
                    {faction.buffs.map((buff, idx) => (
                      <span key={idx} className="buff-tag">{buff.name}: {buff.effect}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {editingFaction && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑势力：{editingFaction.name}</h3>
              <button className="modal-close" onClick={handleCancel}>×</button>
            </div>
            <div className="modal-body">
              <div className="edit-grid">
                <div className="form-group">
                  <label>势力名称</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>家主姓名</label>
                  <input
                    type="text"
                    value={editForm.lordName || ''}
                    onChange={e => setEditForm({ ...editForm, lordName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>税率</label>
                  <select
                    value={editForm.taxRate || 0.6}
                    onChange={e => setEditForm({ ...editForm, taxRate: Number(e.target.value) })}
                  >
                    <option value={0.4}>40%</option>
                    <option value={0.6}>60%</option>
                    <option value={0.8}>80%</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>金库（石）</label>
                  <input
                    type="number"
                    value={editForm.treasury || 0}
                    onChange={e => setEditForm({ ...editForm, treasury: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>闲置士兵</label>
                  <input
                    type="number"
                    value={editForm.idleSoldiers || 0}
                    onChange={e => setEditForm({ ...editForm, idleSoldiers: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>铁炮</label>
                  <input
                    type="number"
                    value={editForm.rifles || 0}
                    onChange={e => setEditForm({ ...editForm, rifles: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>战马</label>
                  <input
                    type="number"
                    value={editForm.horses || 0}
                    onChange={e => setEditForm({ ...editForm, horses: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>大筒</label>
                  <input
                    type="number"
                    value={editForm.cannons || 0}
                    onChange={e => setEditForm({ ...editForm, cannons: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>农业点数</label>
                  <input
                    type="number"
                    value={editForm.agriculturePoints || 0}
                    onChange={e => setEditForm({ ...editForm, agriculturePoints: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>商业点数</label>
                  <input
                    type="number"
                    value={editForm.commercePoints || 0}
                    onChange={e => setEditForm({ ...editForm, commercePoints: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>水军点数</label>
                  <input
                    type="number"
                    value={editForm.navyPoints || 0}
                    onChange={e => setEditForm({ ...editForm, navyPoints: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>武备点数</label>
                  <input
                    type="number"
                    value={editForm.armamentPoints || 0}
                    onChange={e => setEditForm({ ...editForm, armamentPoints: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>产业石高</label>
                  <input
                    type="number"
                    value={editForm.industryKokudaka || 0}
                    onChange={e => setEditForm({ ...editForm, industryKokudaka: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancel}>取消</button>
              <button className="btn btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 武士管理对话框 */}
      {showSamuraiDialog && (
        <SamuraiManagementDialog
          factionId={showSamuraiDialog.factionId}
          factionName={showSamuraiDialog.factionName}
          onClose={handleCloseSamuraiDialog}
        />
      )}
    </div>
  );
}

export default FactionFullManagement;
