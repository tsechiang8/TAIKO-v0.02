/**
 * 收支明细表组件
 * 可折叠展开，显示所有收入与支出项目
 */

import { useState } from 'react';
import { FactionDashboardData } from '../types';
import './IncomeExpenseBreakdown.css';

interface IncomeExpenseBreakdownProps {
  data: FactionDashboardData;
}

interface BreakdownItem {
  name: string;
  value: number;
  note: string;
}

export function IncomeExpenseBreakdown({ data }: IncomeExpenseBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 安全检查：如果 maintenanceCost 未定义，使用默认值
  const mc = data.maintenanceCost || {
    infantryCost: 0,
    horseCost: 0,
    rifleCost: 0,
    cannonCost: 0,
    legionExtraCost: 0,
    samuraiSalary: 0,
    subtotal: 0,
    armamentModifier: 0,
    total: 0,
  };

  // 计算收入项目（表面石高的组成部分）
  const incomeItems: BreakdownItem[] = [
    {
      name: '领地石高',
      value: data.territoryKokudaka,
      note: '所有领地的基础石高总和',
    },
    {
      name: '加成系数效果',
      value: Math.floor(data.territoryKokudaka * data.bonusCoefficient),
      note: `领地石高 × ${(data.bonusCoefficient * 100).toFixed(0)}%`,
    },
    {
      name: '特产石高',
      value: data.specialProductKokudaka,
      note: '特产带来的额外石高收入',
    },
    {
      name: '领内财产',
      value: data.integrationBonus,
      note: '完全占领令制国的整合奖励',
    },
    {
      name: '产业石高',
      value: data.industryKokudaka,
      note: '家族产业带来的石高',
    },
  ];

  // 计算支出项目（维护费明细）
  const expenseItems: BreakdownItem[] = [
    {
      name: '步卒维护费',
      value: -mc.infantryCost,
      note: `${data.totalSoldiers}人 × 4石/人`,
    },
    {
      name: '战马维护费',
      value: -mc.horseCost,
      note: `${data.horses + data.legions.reduce((s, l) => s + l.horses, 0)}匹 × 12石/匹`,
    },
    {
      name: '铁炮维护费',
      value: -mc.rifleCost,
      note: `${data.rifles + data.legions.reduce((s, l) => s + l.rifles, 0)}挺 × 3石/挺`,
    },
    {
      name: '大筒维护费',
      value: -mc.cannonCost,
      note: `${data.cannons + data.legions.reduce((s, l) => s + l.cannons, 0)}门 × 8石/门`,
    },
    {
      name: '军团额外费用',
      value: -mc.legionExtraCost,
      note: `${data.legionSoldiers}人 × 4石/人`,
    },
    {
      name: '武士俸禄',
      value: -mc.samuraiSalary,
      note: `${data.samurais.length}人 × 2000石/人`,
    },
  ];

  // 过滤掉值为0的支出项
  const filteredExpenseItems = expenseItems.filter(item => item.value !== 0);

  // 计算总收入（表面石高）
  const totalSurfaceKokudaka = data.surfaceKokudaka;
  // 年度收入 = 表面石高 × 税率 × 0.4
  const annualIncome = data.income;
  // 总支出
  const totalExpense = mc.total;
  // 净收入
  const netIncome = annualIncome - totalExpense;

  return (
    <div className="income-expense-breakdown">
      <div 
        className="breakdown-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="breakdown-title">
          {isExpanded ? '▼' : '▶'} 收支明细表
        </span>
        <span className={`net-income ${netIncome >= 0 ? 'positive' : 'negative'}`}>
          净收入: {netIncome >= 0 ? '+' : ''}{formatKokudaka(netIncome)}万石
        </span>
      </div>

      {isExpanded && (
        <div className="breakdown-content">
          {/* 表面石高组成 */}
          <div className="breakdown-section">
            <h4 className="section-title income-title">表面石高组成</h4>
            <div className="breakdown-items">
              {incomeItems.map((item, idx) => (
                <div key={idx} className="breakdown-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-note">{item.note}</span>
                  </div>
                  <span className={`item-value ${item.value >= 0 ? 'positive' : 'negative'}`}>
                    {item.value >= 0 ? '+' : ''}{formatKokudaka(item.value)}万石
                  </span>
                </div>
              ))}
              <div className="breakdown-subtotal">
                <span>表面石高合计</span>
                <span className="positive">{formatKokudaka(totalSurfaceKokudaka)}万石</span>
              </div>
            </div>
          </div>

          {/* 年度收入计算 */}
          <div className="breakdown-section">
            <h4 className="section-title income-title">年度收入</h4>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <div className="item-info">
                  <span className="item-name">年度收入</span>
                  <span className="item-note">表面石高 × 税率({(data.taxRate * 100).toFixed(0)}%) × 0.4</span>
                </div>
                <span className="item-value positive">
                  +{formatKokudaka(annualIncome)}万石
                </span>
              </div>
            </div>
          </div>

          {/* 支出部分 */}
          <div className="breakdown-section">
            <h4 className="section-title expense-title">年度支出</h4>
            <div className="breakdown-items">
              {filteredExpenseItems.map((item, idx) => (
                <div key={idx} className="breakdown-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-note">{item.note}</span>
                  </div>
                  <span className="item-value negative">
                    {formatKokudaka(item.value)}万石
                  </span>
                </div>
              ))}
              {mc.armamentModifier !== 0 && (
                <div className="breakdown-item">
                  <div className="item-info">
                    <span className="item-name">武备等级修正</span>
                    <span className="item-note">军事维护费 × {(mc.armamentModifier * 100).toFixed(0)}%</span>
                  </div>
                  <span className={`item-value ${mc.armamentModifier < 0 ? 'positive' : 'negative'}`}>
                    {mc.armamentModifier < 0 ? '+' : ''}{formatKokudaka(Math.floor((mc.subtotal - mc.samuraiSalary) * mc.armamentModifier))}万石
                  </span>
                </div>
              )}
              <div className="breakdown-subtotal">
                <span>支出小计</span>
                <span className="negative">-{formatKokudaka(totalExpense)}万石</span>
              </div>
            </div>
          </div>

          {/* 总计 */}
          <div className="breakdown-total">
            <span>年度净收入</span>
            <span className={netIncome >= 0 ? 'positive' : 'negative'}>
              {netIncome >= 0 ? '+' : ''}{formatKokudaka(netIncome)}万石
            </span>
          </div>

          {/* 增长率 */}
          <div className="growth-rate">
            <span>自然增长率</span>
            <span className={data.growthRate >= 0 ? 'positive' : 'negative'}>
              {data.growthRate >= 0 ? '+' : ''}{(data.growthRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function formatKokudaka(value: number): string {
  return (value / 10000).toFixed(2);
}

export default IncomeExpenseBreakdown;
