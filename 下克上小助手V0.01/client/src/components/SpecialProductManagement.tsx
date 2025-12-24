/**
 * 特产系统配置组件
 * Requirements: 8.4
 */

import { useState, useEffect } from 'react';
import {
  getAdminSpecialProducts,
  createSpecialProduct,
  updateSpecialProduct,
  deleteSpecialProduct,
  SpecialProduct,
} from '../api';
import { DataTable, Column } from './DataTable';
import './AdminPanel.css';

export function SpecialProductManagement() {
  const [products, setProducts] = useState<SpecialProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 弹窗状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SpecialProduct | null>(null);
  const [formData, setFormData] = useState<SpecialProduct>({
    name: '',
    annualKokudaka: 0,
    annualHorses: 0,
    soldierCapacityBonus: 0,
    kokudakaBonus: 0,
    otherEffects: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAdminSpecialProducts();
      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(result.error || '获取特产数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      annualKokudaka: 0,
      annualHorses: 0,
      soldierCapacityBonus: 0,
      kokudakaBonus: 0,
      otherEffects: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = (product: SpecialProduct) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsModalOpen(true);
  };

  const handleDelete = async (product: SpecialProduct) => {
    if (!confirm(`确定要删除特产「${product.name}」吗？`)) {
      return;
    }

    const result = await deleteSpecialProduct(product.name);
    if (result.success) {
      loadData();
    } else {
      alert(result.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('请填写特产名称');
      return;
    }

    let result;
    if (editingProduct) {
      result = await updateSpecialProduct(editingProduct.name, formData);
    } else {
      result = await createSpecialProduct(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      loadData();
    } else {
      alert(result.error || '保存失败');
    }
  };

  const columns: Column<SpecialProduct>[] = [
    { key: 'name', title: '特产名称', width: '15%' },
    { 
      key: 'annualKokudaka', 
      title: '年产石高', 
      width: '12%',
      render: (p) => p.annualKokudaka.toLocaleString(),
    },
    { 
      key: 'annualHorses', 
      title: '年产战马', 
      width: '12%',
      render: (p) => p.annualHorses.toLocaleString(),
    },
    { 
      key: 'soldierCapacityBonus', 
      title: '兵力加成', 
      width: '12%',
      render: (p) => p.soldierCapacityBonus ? `+${p.soldierCapacityBonus}` : '-',
    },
    { 
      key: 'kokudakaBonus', 
      title: '石高加成', 
      width: '12%',
      render: (p) => p.kokudakaBonus ? `+${(p.kokudakaBonus * 100).toFixed(0)}%` : '-',
    },
    { 
      key: 'otherEffects', 
      title: '其他效果', 
      width: '20%',
      render: (p) => p.otherEffects || '-',
    },
    {
      key: 'actions',
      title: '操作',
      width: '15%',
      render: (p) => (
        <div className="action-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(p)}>
            编辑
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p)}>
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
        <h2>特产系统配置</h2>
        <div className="management-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            新增特产
          </button>
        </div>
      </div>

      <div className="management-body">
        {error ? (
          <div className="empty-state">
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadData}>重试</button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>暂无特产数据</p>
            <button className="btn btn-primary" onClick={handleCreate}>新增特产</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={products}
            rowKey={(p) => p.name}
            maxRows={10}
          />
        )}
      </div>

      {/* 编辑弹窗 */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? '编辑特产' : '新增特产'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>特产名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!!editingProduct}
                />
                {editingProduct && (
                  <div className="form-hint">特产名称不可修改</div>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>年产石高</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.annualKokudaka}
                    onChange={(e) => setFormData({ ...formData, annualKokudaka: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>年产战马</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.annualHorses}
                    onChange={(e) => setFormData({ ...formData, annualHorses: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>兵力加成</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.soldierCapacityBonus}
                    onChange={(e) => setFormData({ ...formData, soldierCapacityBonus: Number(e.target.value) })}
                  />
                  <div className="form-hint">增加可招募士兵上限</div>
                </div>
                <div className="form-group">
                  <label>石高加成 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.kokudakaBonus * 100}
                    onChange={(e) => setFormData({ ...formData, kokudakaBonus: Number(e.target.value) / 100 })}
                  />
                  <div className="form-hint">百分比加成</div>
                </div>
              </div>
              <div className="form-group">
                <label>其他效果</label>
                <textarea
                  value={formData.otherEffects}
                  onChange={(e) => setFormData({ ...formData, otherEffects: e.target.value })}
                  placeholder="描述其他特殊效果..."
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

export default SpecialProductManagement;
