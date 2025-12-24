/**
 * 组件导出
 */

export { Dashboard } from './Dashboard';
export { Login } from './Login';
export { DataTable } from './DataTable';
export type { Column } from './DataTable';
export { TerritoryList } from './TerritoryList';
export { SamuraiList } from './SamuraiList';
export { DiplomacyList } from './DiplomacyList';
export { LegionList } from './LegionList';
export { RecruitDialog, clampValue } from './RecruitDialog';
export { CreateLegionDialog } from './CreateLegionDialog';
export type { CreateLegionData } from './CreateLegionDialog';
export { EditSoldiersDialog } from './EditSoldiersDialog';
export { EditEquipmentDialog } from './EditEquipmentDialog';
export { DisbandLegionDialog } from './DisbandLegionDialog';
export { DisbandSoldiersDialog } from './DisbandSoldiersDialog';
export { InvestmentPanel } from './InvestmentPanel';

// 管理员组件 (Requirements: 8.1-8.5, 9.1-9.7, 10.1-10.4)
export { AdminPanel } from './AdminPanel';
export { TerritoryManagement } from './TerritoryManagement';
export { FactionManagement } from './FactionManagement';
export { FactionFullManagement } from './FactionFullManagement';
export { SamuraiManagementDialog } from './SamuraiManagementDialog';
export { LegionManagement } from './LegionManagement';
export { SpecialProductManagement } from './SpecialProductManagement';
export { GameProgressControl } from './GameProgressControl';
export { DataImport } from './DataImport';

// 收支明细组件
export { IncomeExpenseBreakdown } from './IncomeExpenseBreakdown';

// 错误报告组件 (Requirements: 14.1-14.9)
export { ErrorReportButton } from './ErrorReportButton';
export { ErrorReportPanel } from './ErrorReportPanel';
