/**
 * 势力代码管理组件
 * Requirements: 8.2
 */

import { useState, useEffect } from 'react';
import {
  getAdminFactions,
  createFaction,
  updateFaction,
  updateFactionCode,
  deleteFaction,
  FactionCodeInfo,
} from '../api';
import { DataTable, Column } from './DataTable';
import './AdminPanel.css';

export function FactionManagement() {
  const [factions, setFactions] = useState<FactionCodeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState<FactionCodeInfo | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    lordName: string;
    code: string;
    taxRate: number;
  }>({
    name: '',
    lordName: '',
    code: '',
    taxRate: 0.6,
  });

  // 代码编辑弹窗
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [editingCodeFaction, setEditingCodeFaction] = useState<FactionCodeInfo | null>(null);
  const [newCode, setNewCode] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAdminFactions();
      if (result.success && result.data) {
        setFactions(result.data);
      } else {
        setError(result.error || '获取势力数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFaction(null);
    setFormData({
      name: '',
      lordName: '',
      code: '',
      taxRate: 0.6,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (faction: FactionCodeInfo) => {
    setEditingFaction(faction);
    setFormData({
      name: faction.name,
      lordName: faction.lordName,
      code: faction.code,
      taxRate: 0.6, // 默认值，实际应从完整数据获取
    });
    setIsModalOpen(true);
  };

  const handleEditCode = (faction: FactionCodeInfo) => {
    setEditingCodeFaction(faction);
    setNewCode(faction.code);
    setIsCodeModalOpen(true);
  };

  const handleDelete = async (faction: FactionCodeInfo) => {
    if (!confirm(`确定要删除势力「${faction.name}」吗？此操作不可恢复！`)) {
      return;
    }

    const result = await deleteFaction(faction.id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.lordName || !formData.code) {
      alert('请填写必填项');
      return;
    }

    let result;
    if (editingFaction) {
      result = await updateFaction(editingFaction.id, {
        name: formData.name,
        lordName: formData.lordName,
      });
    } else {
      result = await createFaction(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(result.error || '保存失败');
    }
  };

  const handleCodeSubmit = async () => {
    if (!editingCodeFaction || !newCode) {
      return;
    }

    const result = await updateFactionCode(editingCodeFaction.id, newCode);
    if (result.success) {
      setIsCodeModalOpen(false);
      loadData();
    } else {
      alert(result.error || '更新代码失败');
    }
  };

  const columns: Column<FactionCodeInfo>[] = [
    { key: 'name', title: '势力名称', width: '25%' },
    { key: 'lordName', title: '家主姓名', width: '20%' },
    { 
      key: 'code', 
      title: '登录代码', 
      width: '25%',
      render: (f) => (
        <span style={{ fontFamily: 'monospace' }}>{f.code}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '30%',
      render: (f) => (
        <div className="action-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(f)}>
            编辑
          </button>
          <button className="btn btn-sm btn-success" onClick={() => handleEditCode(f)}>
            改代码
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f)}>
            删除
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="management-section">
      <div className="management-header">
        <h2>势力代码管理</h2>
        <div className="management-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            新增势力
          </button>
        </div>
      </div>

      <div className="management-body">
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadData}>重试</button>
          </div>
        ) : factions.length === 0 ? (
          <div className="empty-state">
            <p>暂无势力数据</p>
            <button className="btn btn-primary" onClick={handleCreate}>新增势力</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={factions}
            rowKey={(f) => f.id}
            maxRows={10}
          />
        )}
      </div>

      {/* 编辑势力弹窗 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingFaction ? '编辑势力' : '新增势力'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>势力名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>家主姓名 *</label>
                <input
                  type="text"
                  value={formData.lordName}
                  onChange={(e) => setFormData({ ...formData, lordName: e.target.value })}
                />
              </div>
              {!editingFaction && (
                <>
                  <div className="form-group">
                    <label>登录代码 *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                    <div className="form-hint">玩家使用此代码登录</div>
                  </div>
                  <div className="form-group">
                    <label>税率</label>
                    <select
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    >
                      <option value={0.4}>40%</option>
                      <option value={0.6}>60%</option>
                      <option value={0.8}>80%</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 修改代码弹窗 */}
      {isCodeModalOpen && editingCodeFaction && (
        <div className="modal-overlay" onClick={() => setIsCodeModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>修改登录代码</h3>
              <button className="modal-close" onClick={() => setIsCodeModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>势力：{editingCodeFaction.name}</p>
              <div className="form-group">
                <label>新登录代码</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsCodeModalOpen(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleCodeSubmit}>
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactionManagement;
