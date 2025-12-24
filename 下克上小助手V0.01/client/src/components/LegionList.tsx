/**
 * 军团列表组件
 * Requirements: 3.4, 3.6
 * 显示军团名称、将领、人数、装备、位置
 * 点击展开管理菜单
 */

import { useState } from 'react';
import { Legion } from '../types';
import { DataTable, Column } from './DataTable';
import './LegionList.css';

interface LegionListProps {
  legions: Legion[];
  onDisband?: (legion: Legion) => void;
  onEditSoldiers?: (legion: Legion) => void;
  onEditEquipment?: (legion: Legion) => void;
}

export function LegionList({
  legions,
  onDisband,
  onEditSoldiers,
  onEditEquipment,
}: LegionListProps) {
  const [expandedLegionId, setExpandedLegionId] = useState<string | null>(null);

  const handleRowClick = (legion: Legion) => {
    setExpandedLegionId(
      expandedLegionId === legion.id ? null : legion.id
    );
  };

  const columns: Column<Legion>[] = [
    {
      key: 'name',
      title: '军团名称',
      width: '15%',
      render: (item) => (
        <span className="legion-name">{item.name}</span>
      ),
    },
    {
      key: 'commanderName',
      title: '将领',
      width: '12%',
    },
    {
      key: 'soldierCount',
      title: '人数',
      width: '10%',
      render: (item) => (
        <span className="soldier-count">
          {item.soldierCount.toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      key: 'rifles',
      title: '铁炮',
      width: '10%',
      render: (item) => (
        <span className="equipment-count">{item.rifles}</span>
      ),
    },
    {
      key: 'horses',
      title: '战马',
      width: '10%',
      render: (item) => (
        <span className="equipment-count">{item.horses}</span>
      ),
    },
    {
      key: 'cannons',
      title: '大筒',
      width: '10%',
      render: (item) => (
        <span className="equipment-count">{item.cannons}</span>
      ),
    },
    {
      key: 'locationName',
      title: '位置',
      width: '15%',
    },
    {
      key: 'actions',
      title: '操作',
      width: '18%',
      render: (item) => (
        <span
          className={`expand-indicator ${
            expandedLegionId === item.id ? 'expanded' : ''
          }`}
        >
          {expandedLegionId === item.id ? '收起 ▲' : '管理 ▼'}
        </span>
      ),
    },
  ];

  return (
    <div className="legion-list">
      <DataTable
        columns={columns}
        data={legions}
        rowKey={(item) => item.id}
        onRowClick={handleRowClick}
        emptyText="暂无军团数据"
      />

      {/* 展开的管理菜单 */}
      {expandedLegionId && (
        <LegionManagementMenu
          legion={legions.find((l) => l.id === expandedLegionId)!}
          onDisband={onDisband}
          onEditSoldiers={onEditSoldiers}
          onEditEquipment={onEditEquipment}
          onClose={() => setExpandedLegionId(null)}
        />
      )}
    </div>
  );
}

interface LegionManagementMenuProps {
  legion: Legion;
  onDisband?: (legion: Legion) => void;
  onEditSoldiers?: (legion: Legion) => void;
  onEditEquipment?: (legion: Legion) => void;
  onClose: () => void;
}

function LegionManagementMenu({
  legion,
  onDisband,
  onEditSoldiers,
  onEditEquipment,
  onClose,
}: LegionManagementMenuProps) {
  const handleDisband = () => {
    if (onDisband) {
      onDisband(legion);
    }
  };

  const handleEditSoldiers = () => {
    if (onEditSoldiers) {
      onEditSoldiers(legion);
    }
  };

  const handleEditEquipment = () => {
    if (onEditEquipment) {
      onEditEquipment(legion);
    }
  };

  return (
    <div className="legion-management-menu">
      <div className="menu-header">
        <span className="menu-title">管理: {legion.name}</span>
        <button className="menu-close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="menu-actions">
        <button
          className="action-btn edit-soldiers"
          onClick={handleEditSoldiers}
          disabled={!onEditSoldiers}
        >
          编辑人数
        </button>
        <button
          className="action-btn edit-equipment"
          onClick={handleEditEquipment}
          disabled={!onEditEquipment}
        >
          编辑装备
        </button>
        <button
          className="action-btn disband"
          onClick={handleDisband}
          disabled={!onDisband}
        >
          解散军团
        </button>
      </div>
    </div>
  );
}

export default LegionList;
