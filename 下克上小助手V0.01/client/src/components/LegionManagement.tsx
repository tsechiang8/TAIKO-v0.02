/**
 * 全军团一览管理组件
 * Requirements: 8.3
 */

import { useState, useEffect } from 'react';
import {
  getAdminLegions,
  adminUpdateLegion,
  adminDeleteLegion,
  LegionOverviewItem,
} from '../api';
import { DataTable, Column } from './DataTable';
import './AdminPanel.css';

export function LegionManagement() {
  const [legions, setLegions] = useState<LegionOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 编辑弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLegion, setEditingLegion] = useState<LegionOverviewItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    soldierCount: number;
    rifles: number;
    horses: number;
    cannons: number;
  }>({
    name: '',
    soldierCount: 0,
    rifles: 0,
    horses: 0,
    cannons: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAdminLegions();
      if (result.success && result.data) {
        setLegions(result.data);
      } else {
        setError(result.error || '获取军团数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (legion: LegionOverviewItem) => {
    setEditingLegion(legion);
    setFormData({
      name: legion.name,
      soldierCount: legion.soldierCount,
      rifles: legion.rifles,
      horses: legion.horses,
      cannons: legion.cannons,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (legion: LegionOverviewItem) => {
    if (!confirm(`确定要删除军团「${legion.name}」吗？资源将返还到势力库存。`)) {
      return;
    }

    const result = await adminDeleteLegion(legion.id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    if (!editingLegion) return;

    // 验证军团名称
    const nameRegex = /^[\u4e00-\u9fa5]{1,8}$/;
    if (!nameRegex.test(formData.name)) {
      alert('军团名称必须为1-8个简体中文字符');
      return;
    }

    const result = await adminUpdateLegion(editingLegion.id, formData);
    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(result.error || '更新失败');
    }
  };

  const columns: Column<LegionOverviewItem>[] = [
    { key: 'factionName', title: '所属势力', width: '12%' },
    { key: 'name', title: '军团名', width: '12%' },
    { key: 'commanderName', title: '将领', width: '10%' },
    { 
      key: 'soldierCount', 
      title: '人数', 
      width: '8%',
      render: (l) => l.soldierCount.toLocaleString(),
    },
    { 
      key: 'rifles', 
      title: '铁炮', 
      width: '8%',
      render: (l) => l.rifles.toLocaleString(),
    },
    { 
      key: 'horses', 
      title: '战马', 
      width: '8%',
      render: (l) => l.horses.toLocaleString(),
    },
    { 
      key: 'cannons', 
      title: '大筒', 
      width: '8%',
      render: (l) => l.cannons.toLocaleString(),
    },
    { key: 'locationName', title: '位置', width: '12%' },
    {
      key: 'actions',
      title: '操作',
      width: '15%',
      render: (l) => (
        <div className="action-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(l)}>
            编辑
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(l)}>
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
        <h2>全军团一览</h2>
        <div className="management-actions">
          <button className="btn btn-secondary" onClick={loadData}>
            刷新
          </button>
        </div>
      </div>

      <div className="management-body">
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadData}>重试</button>
          </div>
        ) : legions.length === 0 ? (
          <div className="empty-state">
            <p>暂无军团数据</p>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              共 {legions.length} 个军团
            </p>
            <DataTable
              columns={columns}
              data={legions}
              rowKey={(l) => l.id}
              maxRows={10}
            />
          </>
        )}
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && editingLegion && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑军团</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: '#666' }}>
                所属势力：{editingLegion.factionName} | 将领：{editingLegion.commanderName}
              </p>
              <div className="form-group">
                <label>军团名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <div className="form-hint">1-8个简体中文字符</div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>人数</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.soldierCount}
                    onChange={(e) => setFormData({ ...formData, soldierCount: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>铁炮</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rifles}
                    onChange={(e) => setFormData({ ...formData, rifles: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>战马</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.horses}
                    onChange={(e) => setFormData({ ...formData, horses: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>大筒</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cannons}
                    onChange={(e) => setFormData({ ...formData, cannons: Number(e.target.value) })}
                  />
                </div>
              </div>
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
    </div>
  );
}

export default LegionManagement;
