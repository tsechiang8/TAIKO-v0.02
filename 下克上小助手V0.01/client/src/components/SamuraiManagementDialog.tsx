/**
 * 武士管理对话框组件
 * 用于管理势力的武士
 */

import { useState, useEffect } from 'react';
import { 
  getFactionSamurais, 
  createSamurai, 
  updateSamurai, 
  deleteSamurai,
  getFactionOptions
} from '../api';
import { Samurai } from '../types';
import './SamuraiManagementDialog.css';

interface SamuraiManagementDialogProps {
  factionId: string;
  factionName: string;
  onClose: () => void;
}

interface SamuraiFormData {
  name: string;
  age: number;
  type: 'warrior' | 'strategist';
  martialValue: number;
  civilValue: number;
  factionId: string;
}

export function SamuraiManagementDialog({ factionId, factionName, onClose }: SamuraiManagementDialogProps) {
  const [samurais, setSamurais] = useState<Samurai[]>([]);
  const [factionOptions, setFactionOptions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSamurai, setEditingSamurai] = useState<Samurai | null>(null);
  const [formData, setFormData] = useState<SamuraiFormData>({
    name: '',
    age: 25,
    type: 'warrior',
    martialValue: 1,
    civilValue: 1,
    factionId: factionId,
  });

  useEffect(() => {
    loadData();
    loadFactionOptions();
  }, [factionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getFactionSamurais(factionId);
      if (result.success && result.data) {
        setSamurais(result.data);
      } else {
        setError(result.error || '获取武士数据失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const loadFactionOptions = async () => {
    try {
      const result = await getFactionOptions();
      if (result.success && result.data) {
        setFactionOptions(result.data);
      }
    } catch {
      // 忽略错误，不影响主要功能
    }
  };

  const handleAdd = () => {
    setEditingSamurai(null);
    setFormData({
      name: '',
      age: 25,
      type: 'warrior',
      martialValue: 1,
      civilValue: 1,
      factionId: factionId,
    });
    setShowAddForm(true);
  };

  const handleEdit = (samurai: Samurai) => {
    setEditingSamurai(samurai);
    setFormData({
      name: samurai.name,
      age: samurai.age || 25,
      type: samurai.type,
      martialValue: samurai.martialValue,
      civilValue: samurai.civilValue,
      factionId: samurai.factionId,
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入武士姓名');
      return;
    }

    try {
      let result;
      if (editingSamurai) {
        result = await updateSamurai(editingSamurai.id, formData);
      } else {
        result = await createSamurai(formData);
      }

      if (result.success) {
        setShowAddForm(false);
        setEditingSamurai(null);
        loadData();
      } else {
        alert(result.error || '保存失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleDelete = async (samurai: Samurai) => {
    if (!confirm(`确定要删除武士「${samurai.name}」吗？`)) {
      return;
    }

    try {
      const result = await deleteSamurai(samurai.id);
      if (result.success) {
        loadData();
      } else {
        alert(result.error || '删除失败');
      }
    } catch {
      alert('网络错误');
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingSamurai(null);
  };

  const getActionPointsClass = (actionPoints: number) => {
    if (actionPoints === 2) return 'action-points-full';
    if (actionPoints === 1) return 'action-points-partial';
    return 'action-points-empty';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large samurai-management-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>武士管理：{factionName}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button onClick={loadData}>重试</button>
            </div>
          ) : (
            <>
              <div className="samurai-header">
                <h4>武士列表 ({samurais.length}人)</h4>
                <button className="btn btn-primary" onClick={handleAdd}>
                  添加武士
                </button>
              </div>

              {samurais.length === 0 ? (
                <div className="empty-state">暂无武士</div>
              ) : (
                <div className="samurai-table">
                  <table>
                    <thead>
                      <tr>
                        <th>姓名</th>
                        <th>年龄</th>
                        <th>类型</th>
                        <th>武功</th>
                        <th>文治</th>
                        <th>状态</th>
                        <th>行动力</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {samurais.map(samurai => (
                        <tr key={samurai.id}>
                          <td>{samurai.name}</td>
                          <td>{samurai.age || '-'}</td>
                          <td>{samurai.type === 'warrior' ? '武将' : '文官'}</td>
                          <td>{samurai.martialValue}</td>
                          <td>{samurai.civilValue}</td>
                          <td>
                            <span className={samurai.isIdle ? 'status-idle' : 'status-busy'}>
                              {samurai.isIdle ? '闲置' : '忙碌'}
                            </span>
                          </td>
                          <td>
                            <span className={getActionPointsClass(samurai.actionPoints)}>
                              {samurai.actionPoints}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-secondary" 
                              onClick={() => handleEdit(samurai)}
                            >
                              编辑
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => handleDelete(samurai)}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <div className="form-overlay">
            <div className="form-content">
              <div className="form-header">
                <h4>{editingSamurai ? '编辑武士' : '添加武士'}</h4>
                <button className="form-close" onClick={handleCancel}>×</button>
              </div>
              <div className="form-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>姓名 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入武士姓名"
                    />
                  </div>
                  <div className="form-group">
                    <label>年龄</label>
                    <input
                      type="number"
                      min="15"
                      max="80"
                      value={formData.age}
                      onChange={e => setFormData({ ...formData, age: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>类型</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as 'warrior' | 'strategist' })}
                    >
                      <option value="warrior">武将</option>
                      <option value="strategist">文官</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>武功</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.martialValue}
                      onChange={e => setFormData({ ...formData, martialValue: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>文治</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.civilValue}
                      onChange={e => setFormData({ ...formData, civilValue: Number(e.target.value) })}
                    />
                  </div>
                  {editingSamurai && (
                    <div className="form-group">
                      <label>转移到势力</label>
                      <select
                        value={formData.factionId}
                        onChange={e => setFormData({ ...formData, factionId: e.target.value })}
                      >
                        {factionOptions.map(faction => (
                          <option key={faction.id} value={faction.id}>
                            {faction.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-footer">
                <button className="btn btn-secondary" onClick={handleCancel}>取消</button>
                <button className="btn btn-primary" onClick={handleSave}>保存</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SamuraiManagementDialog;