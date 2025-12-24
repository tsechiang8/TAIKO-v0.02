/**
 * 外交关系列表组件
 * Requirements: 3.3
 * 显示目标势力和当前关系（仅显示已有关系的势力）
 */

import { DiplomacyRelation } from '../types';
import { DataTable, Column } from './DataTable';
import './DiplomacyList.css';

interface DiplomacyListProps {
  diplomacy: DiplomacyRelation[];
}

// 关系类型映射
const relationLabels: Record<string, { label: string; className: string }> = {
  alliance: { label: '同盟', className: 'alliance' },
  hostile: { label: '敌对', className: 'hostile' },
  neutral: { label: '中立', className: 'neutral' },
  vassal: { label: '从属', className: 'vassal' },
  suzerain: { label: '宗主', className: 'suzerain' },
  truce: { label: '停战', className: 'truce' },
  war: { label: '交战', className: 'war' },
};

function getRelationInfo(relation: string): { label: string; className: string } {
  return relationLabels[relation] || { label: relation, className: 'default' };
}

export function DiplomacyList({ diplomacy }: DiplomacyListProps) {
  const columns: Column<DiplomacyRelation>[] = [
    {
      key: 'targetFactionName',
      title: '目标势力',
      width: '50%',
      render: (item) => (
        <span className="faction-name">{item.targetFactionName}</span>
      ),
    },
    {
      key: 'relation',
      title: '当前关系',
      width: '50%',
      render: (item) => {
        const info = getRelationInfo(item.relation);
        return (
          <span className={`relation-badge ${info.className}`}>
            {info.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="diplomacy-list">
      <DataTable
        columns={columns}
        data={diplomacy}
        rowKey={(item) => item.targetFactionId}
        emptyText="暂无外交关系"
      />
    </div>
  );
}

export default DiplomacyList;
