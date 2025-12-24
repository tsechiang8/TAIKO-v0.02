/**
 * 领地列表组件
 * Requirements: 3.1
 * 显示郡名、令制国、石高、城池、特产、驻扎军团
 */

import { Territory, Legion } from '../types';
import { DataTable, Column } from './DataTable';
import './TerritoryList.css';

interface TerritoryListProps {
  territories: Territory[];
  legions: Legion[];
}

export function TerritoryList({ territories, legions }: TerritoryListProps) {
  // 创建军团ID到名称的映射
  const legionMap = new Map(legions.map((l) => [l.id, l.name]));

  const columns: Column<Territory>[] = [
    {
      key: 'districtName',
      title: '郡名',
      width: '12%',
    },
    {
      key: 'provinceName',
      title: '令制国',
      width: '12%',
    },
    {
      key: 'baseKokudaka',
      title: '石高',
      width: '12%',
      render: (item) => `${item.baseKokudaka.toLocaleString('zh-CN')}石`,
    },
    {
      key: 'castle',
      title: '城池',
      width: '18%',
      render: (item) => (
        <span className="castle-info">
          {item.castleName}
          <span className="castle-level">Lv.{item.castleLevel}</span>
        </span>
      ),
    },
    {
      key: 'specialProducts',
      title: '特产',
      width: '26%',
      render: (item) => {
        const products = [
          item.specialProduct1,
          item.specialProduct2,
          item.specialProduct3,
        ].filter(Boolean);
        return products.length > 0 ? (
          <span className="special-products">
            {products.map((p, i) => (
              <span key={i} className="product-tag">
                {p}
              </span>
            ))}
          </span>
        ) : (
          <span className="no-product">-</span>
        );
      },
    },
    {
      key: 'garrison',
      title: '驻扎军团',
      width: '20%',
      render: (item) => {
        const legionName = item.garrisonLegionId
          ? legionMap.get(item.garrisonLegionId)
          : null;
        return legionName ? (
          <span className="garrison-name">{legionName}</span>
        ) : (
          <span className="no-garrison">-</span>
        );
      },
    },
  ];

  return (
    <div className="territory-list">
      <DataTable
        columns={columns}
        data={territories}
        rowKey={(item) => item.id}
        emptyText="暂无领地数据"
      />
    </div>
  );
}

export default TerritoryList;
