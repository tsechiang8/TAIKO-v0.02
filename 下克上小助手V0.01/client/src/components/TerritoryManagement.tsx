/**
 * 郡国数据管理组件
 * Requirements: 8.1
 */

import { useState, useEffect } from 'react';
import { Territory } from '../types';
import {
  getAdminTerritories,
  createTerritory,
  updateTerritory,
  deleteTerritory,
  getFactionOptions,
  TerritorySearchParams,
} from '../api';
import { DataTable, Column } from './DataTable';
import './AdminPanel.css';

interface FactionOption {
  id: string;
  name: string;
}

export function TerritoryManagement() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [factionOptions, setFactionOptions] = useState<FactionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选条件
  const [filters, setFilters] = useState<TerritorySearchParams>({});

  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  const [formData, setFormData] = useState<Partial<Territory>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [territoriesRes, factionsRes] = await Promise.all([
        getAdminTerritories(filters),
        getFactionOptions(),
      ]);

      if (territoriesRes.success && territoriesRes.data) {
        setTerritories(territoriesRes.data);
      } else {
        setError(territoriesRes.error || '获取郡国数据失败');
      }

      if (factionsRes.success && factionsRes.data) {
        setFactionOptions(factionsRes.data);
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleResetFilters = () => {
    setFilters({});
    loadData();
  };

  const handleCreate = () => {
    setEditingTerritory(null);
    setFormData({
      provinceName: '',
      districtName: '',
      castleName: '',
      castleLevel: 1,
      baseKokudaka: 0,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (territory: Territory) => {
    setEditingTerritory(territory);
    setFormData({ ...territory });
    setIsModalOpen(true);
  };

  const handleDelete = async (territory: Territory) => {
    if (!confirm(`确定要删除「${territory.districtName}」吗？`)) {
      return;
    }

    const result = await deleteTerritory(territory.id);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    if (!formData.provinceName || !formData.districtName || !formData.castleName) {
      alert('请填写必填项');
      return;
    }

    let result;
    if (editingTerritory) {
      result = await updateTerritory(editingTerritory.id, formData);
    } else {
      result = await createTerritory(formData as Omit<Territory, 'id'>);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(result.error || '保存失败');
    }
  };

  const columns: Column<Territory>[] = [
    { key: 'provinceName', title: '令制国', width: '10%' },
    { key: 'districtName', title: '郡名', width: '10%' },
    { key: 'castleName', title: '城池', width: '10%' },
    { key: 'castleLevel', title: '等级', width: '6%' },
    { 
      key: 'baseKokudaka', 
      title: '石高', 
      width: '10%',
      render: (t) => t.baseKokudaka.toLocaleString(),
    },
    { 
      key: 'specialProducts', 
      title: '特产', 
      width: '15%',
      render: (t) => [t.specialProduct1, t.specialProduct2, t.specialProduct3].filter(Boolean).join(', ') || '-',
    },
    { 
      key: 'factionId', 
      title: '所属势力', 
      width: '12%',
      render: (t) => {
        const faction = factionOptions.find(f => f.id === t.factionId);
        return faction?.name || '-';
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '12%',
      render: (t) => (
        <div className="action-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(t)}>
            编辑
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t)}>
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
        <h2>郡国数据管理</h2>
        <div className="management-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            新增郡国
          </button>
        </div>
      </div>

      <div className="management-body">
        {/* 筛选区域 */}
        <div className="filter-section">
          <div className="filter-group">
            <label>令制国</label>
            <input
              type="text"
              value={filters.provinceName || ''}
              onChange={(e) => setFilters({ ...filters, provinceName: e.target.value })}
              placeholder="搜索令制国"
            />
          </div>
          <div className="filter-group">
            <label>郡名</label>
            <input
              type="text"
              value={filters.districtName || ''}
              onChange={(e) => setFilters({ ...filters, districtName: e.target.value })}
              placeholder="搜索郡名"
            />
          </div>
          <div className="filter-group">
            <label>所属势力</label>
            <select
              value={filters.factionId ?? ''}
              onChange={(e) => setFilters({ ...filters, factionId: e.target.value || undefined })}
            >
              <option value="">全部</option>
              <option value="">无主领地</option>
              {factionOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn btn-primary" onClick={handleSearch}>
              搜索
            </button>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              重置
            </button>
          </div>
        </div>

        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadData}>重试</button>
          </div>
        ) : territories.length === 0 ? (
          <div className="empty-state">
            <p>暂无郡国数据</p>
            <button className="btn btn-primary" onClick={handleCreate}>新增郡国</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={territories}
            rowKey={(t) => t.id}
            maxRows={10}
          />
        )}
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTerritory ? '编辑郡国' : '新增郡国'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>令制国 *</label>
                  <input
                    type="text"
                    value={formData.provinceName || ''}
                    onChange={(e) => setFormData({ ...formData, provinceName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>郡名 *</label>
                  <input
                    type="text"
                    value={formData.districtName || ''}
                    onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>城池名称 *</label>
                  <input
                    type="text"
                    value={formData.castleName || ''}
                    onChange={(e) => setFormData({ ...formData, castleName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>城池等级 (1-7)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.castleLevel || 1}
                    onChange={(e) => setFormData({ ...formData, castleLevel: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>基础石高</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baseKokudaka || 0}
                    onChange={(e) => setFormData({ ...formData, baseKokudaka: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>令制国总石高</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.provinceTotalKokudaka || 0}
                    onChange={(e) => setFormData({ ...formData, provinceTotalKokudaka: Number(e.target.value) || undefined })}
                    placeholder="用于计算整合奖励门槛"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>所属势力</label>
                  <select
                    value={formData.factionId || ''}
                    onChange={(e) => setFormData({ ...formData, factionId: e.target.value || undefined })}
                  >
                    <option value="">无</option>
                    {factionOptions.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>特产1</label>
                  <input
                    type="text"
                    value={formData.specialProduct1 || ''}
                    onChange={(e) => setFormData({ ...formData, specialProduct1: e.target.value || undefined })}
                  />
                </div>
                <div className="form-group">
                  <label>特产2</label>
                  <input
                    type="text"
                    value={formData.specialProduct2 || ''}
                    onChange={(e) => setFormData({ ...formData, specialProduct2: e.target.value || undefined })}
                  />
                </div>
                <div className="form-group">
                  <label>特产3</label>
                  <input
                    type="text"
                    value={formData.specialProduct3 || ''}
                    onChange={(e) => setFormData({ ...formData, specialProduct3: e.target.value || undefined })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>可发展特产</label>
                <input
                  type="text"
                  value={formData.developableProduct || ''}
                  onChange={(e) => setFormData({ ...formData, developableProduct: e.target.value || undefined })}
                />
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || undefined })}
                />
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

export default TerritoryManagement;
