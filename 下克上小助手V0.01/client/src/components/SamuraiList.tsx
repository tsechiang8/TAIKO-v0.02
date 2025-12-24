/**
 * 武士列表组件
 * Requirements: 3.2
 * 显示姓名、类型、武功、文治、状态、行动力
 */

import { Samurai } from '../types';
import { DataTable, Column } from './DataTable';
import './SamuraiList.css';

interface SamuraiListProps {
  samurais: Samurai[];
}

export function SamuraiList({ samurais }: SamuraiListProps) {
  const columns: Column<Samurai>[] = [
    {
      key: 'name',
      title: '姓名',
      width: '20%',
    },
    {
      key: 'type',
      title: '类型',
      width: '15%',
      render: (item) => (
        <span className={`samurai-type ${item.type}`}>
          {item.type === 'warrior' ? '猛将' : '智将'}
        </span>
      ),
    },
    {
      key: 'martialValue',
      title: '武功',
      width: '15%',
      render: (item) => (
        <span className="stat-value martial">{item.martialValue}</span>
      ),
    },
    {
      key: 'civilValue',
      title: '文治',
      width: '15%',
      render: (item) => (
        <span className="stat-value civil">{item.civilValue}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '15%',
      render: (item) => (
        <span className={`samurai-status ${item.isIdle ? 'idle' : 'busy'}`}>
          {item.isIdle ? '待命' : '任务中'}
        </span>
      ),
    },
    {
      key: 'actionPoints',
      title: '行动力',
      width: '20%',
      render: (item) => {
        const apClass = item.actionPoints >= 2 ? 'ap-full' : item.actionPoints === 1 ? 'ap-half' : 'ap-empty';
        return (
          <span className={`action-points ${apClass}`}>
            <span className="ap-current">{item.actionPoints}</span>
            <span className="ap-separator">/</span>
            <span className="ap-max">2</span>
          </span>
        );
      },
    },
  ];

  return (
    <div className="samurai-list">
      <DataTable
        columns={columns}
        data={samurais}
        rowKey={(item) => item.id}
        emptyText="暂无武士数据"
      />
    </div>
  );
}

export default SamuraiList;
