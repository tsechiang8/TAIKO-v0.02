/**
 * 管理员数据管理面板
 * Requirements: 8.1-8.5, 9.1-9.7, 10.1-10.4
 */

import { useState } from 'react';
import { User } from '../types';
import { TerritoryManagement } from './TerritoryManagement';
import { FactionManagement } from './FactionManagement';
import { FactionFullManagement } from './FactionFullManagement';
import { LegionManagement } from './LegionManagement';
import { SpecialProductManagement } from './SpecialProductManagement';
import { GameProgressControl } from './GameProgressControl';
import { DataImport } from './DataImport';
import { ErrorReportPanel } from './ErrorReportPanel';
import './AdminPanel.css';

type AdminTab = 'territories' | 'factions' | 'factions-full' | 'legions' | 'products' | 'progress' | 'import' | 'errors';

interface AdminPanelProps {
  user: User;
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('territories');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'territories', label: '郡国管理' },
    { key: 'factions-full', label: '势力管理' },
    { key: 'factions', label: '势力代码' },
    { key: 'legions', label: '军团一览' },
    { key: 'products', label: '特产配置' },
    { key: 'progress', label: '游戏进程' },
    { key: 'import', label: '数据导入' },
    { key: 'errors', label: '错误报告' },
  ];

  const handleImportComplete = () => {
    // 刷新其他管理页面的数据
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <button className="back-btn" onClick={onBack}>
          ← 返回仪表盘
        </button>
        <h1>管理员数据管理</h1>
      </header>

      <nav className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {activeTab === 'territories' && <TerritoryManagement key={`territories-${refreshKey}`} />}
        {activeTab === 'factions-full' && <FactionFullManagement key={`factions-full-${refreshKey}`} />}
        {activeTab === 'factions' && <FactionManagement key={`factions-${refreshKey}`} />}
        {activeTab === 'legions' && <LegionManagement key={`legions-${refreshKey}`} />}
        {activeTab === 'products' && <SpecialProductManagement key={`products-${refreshKey}`} />}
        {activeTab === 'progress' && <GameProgressControl />}
        {activeTab === 'import' && <DataImport onImportComplete={handleImportComplete} />}
        {activeTab === 'errors' && <ErrorReportPanel />}
      </main>
    </div>
  );
}

export default AdminPanel;
