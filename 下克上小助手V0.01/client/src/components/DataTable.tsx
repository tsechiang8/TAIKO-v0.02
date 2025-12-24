/**
 * 通用数据表格组件
 * Requirements: 12.2, 12.3, 12.4
 * - 最多显示10条数据
 * - 滚动时表头固定
 * - 数据行与表头对齐
 */

import { ReactNode } from 'react';
import './DataTable.css';

export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  maxRows?: number;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyText?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  maxRows = 10,
  rowKey,
  onRowClick,
  emptyText = '暂无数据',
  className = '',
}: DataTableProps<T>) {
  const needsScroll = data.length > maxRows;

  return (
    <div className={`data-table-container ${className}`}>
      {/* 固定表头 */}
      <div className="data-table-header">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* 可滚动表体 */}
      <div
        className={`data-table-body ${needsScroll ? 'scrollable' : ''}`}
        style={{ maxHeight: needsScroll ? `${maxRows * 44}px` : 'auto' }}
      >
        <table className="data-table">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
          <tbody>
            {data.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={columns.length}>{emptyText}</td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={rowKey(item)}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'clickable' : ''}
                >
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render
                        ? col.render(item, index)
                        : String((item as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
