/**
 * 玩家仪表盘组件
 * Requirements: 2.1-2.9, 3.1-3.6, 4.1-4.5
 */

import { useEffect, useState } from 'react';
import { 
  getMyFaction, getFaction, logout, 
  getRecruitInfo, recruitSoldiers, RecruitInfo, 
  getDisbandInfo, disbandSoldiers, DisbandInfo,
  purchaseEquipment,
  getTaxRateInfo, changeTaxRate, TaxRateInfo,
  getAvailableCommanders, getAvailableTerritories, checkCommanderConflict,
  createLegion, disbandLegion, updateLegionSoldiers, updateLegionEquipment,
  CreateLegionRequest
} from '../api';
import { FactionDashboardData, User, Legion, Samurai, Territory } from '../types';
import { TerritoryList } from './TerritoryList';
import { SamuraiList } from './SamuraiList';
import { DiplomacyList } from './DiplomacyList';
import { LegionList } from './LegionList';
import { RecruitDialog } from './RecruitDialog';
import { DisbandSoldiersDialog } from './DisbandSoldiersDialog';
import { PurchaseEquipmentDialog } from './PurchaseEquipmentDialog';
import { CreateLegionDialog, CreateLegionData } from './CreateLegionDialog';
import { EditSoldiersDialog } from './EditSoldiersDialog';
import { EditEquipmentDialog } from './EditEquipmentDialog';
import { DisbandLegionDialog } from './DisbandLegionDialog';
import { InvestmentPanel } from './InvestmentPanel';
import { ErrorReportButton } from './ErrorReportButton';
import { IncomeExpenseBreakdown } from './IncomeExpenseBreakdown';
import './Dashboard.css';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  onOpenAdminPanel?: () => void;
}

export function Dashboard({ user, onLogout, onOpenAdminPanel }: DashboardProps) {
  const [data, setData] = useState<FactionDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 招募弹窗状态
  const [isRecruitDialogOpen, setIsRecruitDialogOpen] = useState(false);
  const [recruitInfo, setRecruitInfo] = useState<RecruitInfo | null>(null);
  
  // 解散士兵弹窗状态
  const [isDisbandDialogOpen, setIsDisbandDialogOpen] = useState(false);
  const [disbandInfo, setDisbandInfo] = useState<DisbandInfo | null>(null);

  // 购买装备弹窗状态
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  // 税率选择状态
  const [taxRateInfo, setTaxRateInfo] = useState<TaxRateInfo | null>(null);
  const [showTaxRateSelector, setShowTaxRateSelector] = useState(false);

  // 军团管理状态
  const [isCreateLegionDialogOpen, setIsCreateLegionDialogOpen] = useState(false);
  const [availableCommanders, setAvailableCommanders] = useState<Samurai[]>([]);
  const [availableTerritories, setAvailableTerritories] = useState<Territory[]>([]);
  const [isEditSoldiersDialogOpen, setIsEditSoldiersDialogOpen] = useState(false);
  const [isEditEquipmentDialogOpen, setIsEditEquipmentDialogOpen] = useState(false);
  const [isDisbandLegionDialogOpen, setIsDisbandLegionDialogOpen] = useState(false);
  const [selectedLegion, setSelectedLegion] = useState<Legion | null>(null);

  useEffect(() => {
    loadFactionData();
  }, [user]);

  const loadFactionData = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (user.type === 'player' && user.factionId) {
        response = await getMyFaction();
      } else if (user.factionId) {
        response = await getFaction(user.factionId);
      } else {
        setError('无法获取势力数据');
        setLoading(false);
        return;
      }

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || '获取数据失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-error">
        <p>{error || '数据加载失败'}</p>
        <button onClick={loadFactionData}>重试</button>
        <button onClick={handleLogout}>返回登录</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>{data.name}</h1>
          <span className="lord-name">家主：{data.lordName}</span>
        </div>
        <div className="header-right">
          <ErrorReportButton />
          {onOpenAdminPanel && (
            <button className="admin-btn" onClick={onOpenAdminPanel}>
              管理面板
            </button>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* 基础信息卡片 */}
        <section className="info-section">
          <h2>势力概况</h2>
          <div className="info-grid">
            <InfoCard
              label="表面石高"
              value={formatKokudaka(data.surfaceKokudaka)}
              unit="万石"
            />
            <InfoCard
              label="收入"
              value={formatKokudaka(data.income)}
              unit="万石/年"
            />
            <InfoCard
              label="库存石高"
              value={formatKokudaka(data.treasury ?? 0)}
              unit="万石"
            />
            <TaxRateCard
              taxRate={data.taxRate}
              canChange={taxRateInfo?.canChange ?? true}
              onOpenSelector={handleOpenTaxRateSelector}
            />
            <InfoCard
              label="陆军等级"
              value={data.armyLevel}
              subValue={`Lv.${data.armyLevelNumber}`}
            />
          </div>
          {/* 税率选择器 */}
          {showTaxRateSelector && (
            <TaxRateSelector
              currentRate={data.taxRate}
              availableRates={taxRateInfo?.availableRates ?? [0.4, 0.6, 0.8]}
              canChange={taxRateInfo?.canChange ?? true}
              onSelect={handleTaxRateChange}
              onClose={() => setShowTaxRateSelector(false)}
            />
          )}
        </section>

        {/* 武库数据 */}
        <section className="info-section">
          <div className="section-header">
            <h2>武库</h2>
            <button className="purchase-btn" onClick={handleOpenPurchaseDialog}>
              购买装备
            </button>
          </div>
          <div className="info-grid">
            <InfoCard
              label="铁炮"
              value={formatNumber(data.rifles)}
              unit="挺"
            />
            <InfoCard
              label="战马"
              value={formatNumber(data.horses)}
              unit="匹"
            />
            <InfoCard
              label="大筒"
              value={formatNumber(data.cannons)}
              unit="门"
            />
          </div>
        </section>

        {/* 士兵数据 */}
        <section className="info-section">
          <div className="section-header">
            <h2>兵力</h2>
            <div className="section-buttons">
              <button className="recruit-btn" onClick={handleOpenRecruitDialog}>
                招募士兵
              </button>
              <button className="disband-btn" onClick={handleOpenDisbandDialog}>
                解散士兵
              </button>
            </div>
          </div>
          <div className="info-grid">
            <InfoCard
              label="总兵力"
              value={formatNumber(data.totalSoldiers)}
              unit="人"
            />
            <InfoCard
              label="闲置士兵"
              value={formatNumber(data.idleSoldiers)}
              unit="人"
            />
            <InfoCard
              label="可招募上限"
              value={formatNumber(data.maxRecruitableSoldiers)}
              unit="人"
            />
            <InfoCard
              label="士兵维持比"
              value={`${(data.soldierMaintenanceRatio * 100).toFixed(1)}%`}
              subValue={`加成: ${data.bonusCoefficient >= 0 ? '+' : ''}${(data.bonusCoefficient * 100).toFixed(0)}%`}
            />
          </div>
        </section>

        {/* 增益列表 */}
        {data.buffs.length > 0 && (
          <section className="info-section">
            <h2>增益效果</h2>
            <div className="buffs-list">
              {data.buffs.slice(0, 10).map((buff, index) => (
                <div key={index} className="buff-item">
                  <span className="buff-name">{buff.name}</span>
                  <span className="buff-effect">{buff.effect}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 详细数据 */}
        <section className="info-section">
          <h2>石高详情</h2>
          <div className="detail-list">
            <DetailRow label="领地石高" value={formatKokudaka(data.territoryKokudaka)} unit="万石" />
            <DetailRow label="特产石高" value={formatKokudaka(data.specialProductKokudaka)} unit="万石" />
            <DetailRow label="领内财产" value={formatKokudaka(data.integrationBonus)} unit="万石" />
            <DetailRow label="产业石高" value={formatKokudaka(data.industryKokudaka)} unit="万石" />
            <DetailRow 
              label="加成系数" 
              value={`${data.bonusCoefficient >= 0 ? '+' : ''}${(data.bonusCoefficient * 100).toFixed(0)}%`} 
            />
            <DetailRow 
              label="自然增长率" 
              value={`${data.growthRate >= 0 ? '+' : ''}${(data.growthRate * 100).toFixed(1)}%`} 
            />
          </div>
        </section>

        {/* 投资点数 */}
        <section className="info-section">
          <h2>投资系统</h2>
          <InvestmentPanel 
            factionId={user.factionId} 
            onInvestmentComplete={loadFactionData}
          />
        </section>

        {/* 领地列表 */}
        {data.territories.length > 0 && (
          <section className="info-section">
            <h2>领地一览</h2>
            <TerritoryList territories={data.territories} legions={data.legions} />
          </section>
        )}

        {/* 武士列表 */}
        {data.samurais.length > 0 && (
          <section className="info-section">
            <h2>武士一览</h2>
            <SamuraiList samurais={data.samurais} />
          </section>
        )}

        {/* 外交关系列表 */}
        {data.diplomacy.length > 0 && (
          <section className="info-section">
            <h2>外交关系</h2>
            <DiplomacyList diplomacy={data.diplomacy} />
          </section>
        )}

        {/* 军团列表 */}
        <section className="info-section">
          <div className="section-header">
            <h2>军团一览</h2>
            <button className="create-legion-btn" onClick={handleOpenCreateLegionDialog}>
              新建军团
            </button>
          </div>
          {data.legions.length > 0 ? (
            <LegionList
              legions={data.legions}
              onDisband={handleDisbandLegion}
              onEditSoldiers={handleEditLegionSoldiers}
              onEditEquipment={handleEditLegionEquipment}
            />
          ) : (
            <div className="empty-list">暂无军团</div>
          )}
        </section>

        {/* 收支明细表 */}
        <IncomeExpenseBreakdown data={data} />
      </main>

      {/* 招募弹窗 */}
      <RecruitDialog
        isOpen={isRecruitDialogOpen}
        maxValue={recruitInfo?.availableToRecruit ?? 0}
        currentIdleSoldiers={data.idleSoldiers}
        onConfirm={handleRecruitConfirm}
        onCancel={handleRecruitCancel}
      />

      {/* 解散士兵弹窗 */}
      <DisbandSoldiersDialog
        isOpen={isDisbandDialogOpen}
        maxValue={disbandInfo?.maxDisbandable ?? 0}
        currentIdleSoldiers={data.idleSoldiers}
        treasury={data.treasury ?? 0}
        costPerSoldier={disbandInfo?.costPerSoldier ?? 2}
        onConfirm={handleDisbandConfirm}
        onCancel={handleDisbandCancel}
      />

      {/* 购买装备弹窗 */}
      <PurchaseEquipmentDialog
        isOpen={isPurchaseDialogOpen}
        treasury={data.treasury ?? 0}
        onConfirm={handlePurchaseConfirm}
        onCancel={() => setIsPurchaseDialogOpen(false)}
      />

      {/* 创建军团弹窗 */}
      <CreateLegionDialog
        isOpen={isCreateLegionDialogOpen}
        commanders={availableCommanders}
        territories={availableTerritories}
        maxSoldiers={data.idleSoldiers}
        maxRifles={data.rifles}
        maxHorses={data.horses}
        maxCannons={data.cannons}
        onConfirm={handleCreateLegionConfirm}
        onCancel={() => setIsCreateLegionDialogOpen(false)}
        onCheckConflict={handleCheckCommanderConflict}
      />

      {/* 编辑军团人数弹窗 */}
      <EditSoldiersDialog
        isOpen={isEditSoldiersDialogOpen}
        legion={selectedLegion}
        maxIdleSoldiers={data.idleSoldiers}
        onConfirm={handleEditSoldiersConfirm}
        onDisband={handleDisbandLegionConfirm}
        onCancel={() => {
          setIsEditSoldiersDialogOpen(false);
          setSelectedLegion(null);
        }}
      />

      {/* 编辑军团装备弹窗 */}
      <EditEquipmentDialog
        isOpen={isEditEquipmentDialogOpen}
        legion={selectedLegion}
        maxRifles={data.rifles}
        maxHorses={data.horses}
        maxCannons={data.cannons}
        onConfirm={handleEditEquipmentConfirm}
        onCancel={() => {
          setIsEditEquipmentDialogOpen(false);
          setSelectedLegion(null);
        }}
      />

      {/* 解散军团确认弹窗 */}
      <DisbandLegionDialog
        isOpen={isDisbandLegionDialogOpen}
        legion={selectedLegion}
        onConfirm={handleDisbandLegionConfirm}
        onCancel={() => {
          setIsDisbandLegionDialogOpen(false);
          setSelectedLegion(null);
        }}
      />
    </div>
  );

  // 招募相关函数
  async function handleOpenRecruitDialog() {
    // 获取最新的招募信息
    const response = await getRecruitInfo(user.factionId);
    if (response.success && response.data) {
      setRecruitInfo(response.data);
      setIsRecruitDialogOpen(true);
    } else {
      alert(response.error || '获取招募信息失败');
    }
  }

  async function handleRecruitConfirm(count: number) {
    const response = await recruitSoldiers(count, user.factionId);
    if (response.success) {
      setIsRecruitDialogOpen(false);
      // 刷新势力数据
      await loadFactionData();
    } else {
      alert(response.error || '招募失败');
    }
  }

  function handleRecruitCancel() {
    setIsRecruitDialogOpen(false);
  }

  // 解散士兵相关函数
  async function handleOpenDisbandDialog() {
    const response = await getDisbandInfo(user.factionId);
    if (response.success && response.data) {
      setDisbandInfo(response.data);
      setIsDisbandDialogOpen(true);
    } else {
      alert(response.error || '获取解散信息失败');
    }
  }

  async function handleDisbandConfirm(count: number) {
    const response = await disbandSoldiers(count, user.factionId);
    if (response.success) {
      setIsDisbandDialogOpen(false);
      await loadFactionData();
    } else {
      alert(response.error || '解散失败');
    }
  }

  function handleDisbandCancel() {
    setIsDisbandDialogOpen(false);
  }

  // 购买装备相关函数
  function handleOpenPurchaseDialog() {
    setIsPurchaseDialogOpen(true);
  }

  async function handlePurchaseConfirm(rifles: number, horses: number, cannons: number) {
    const response = await purchaseEquipment(rifles, horses, cannons, user.factionId);
    if (response.success) {
      setIsPurchaseDialogOpen(false);
      await loadFactionData();
    } else {
      alert(response.error || '购买失败');
    }
  }

  // 税率相关函数
  async function handleOpenTaxRateSelector() {
    const response = await getTaxRateInfo(user.factionId);
    if (response.success && response.data) {
      setTaxRateInfo(response.data);
      if (!response.data.canChange) {
        alert('本回合已更改过税率，无法再次更改');
        return;
      }
      setShowTaxRateSelector(true);
    } else {
      alert(response.error || '获取税率信息失败');
    }
  }

  async function handleTaxRateChange(newRate: number) {
    if (!confirm(`确定要将税率更改为 ${(newRate * 100).toFixed(0)}% 吗？\n\n注意：每回合只能更改一次税率！`)) {
      return;
    }
    
    const response = await changeTaxRate(newRate, user.factionId);
    if (response.success) {
      setShowTaxRateSelector(false);
      await loadFactionData();
      // 更新税率信息
      setTaxRateInfo(prev => prev ? { ...prev, canChange: false } : null);
    } else {
      alert(response.error || '更改税率失败');
    }
  }

  // 军团管理回调函数
  async function handleOpenCreateLegionDialog() {
    // 获取可用将领和领地
    const [commandersRes, territoriesRes] = await Promise.all([
      getAvailableCommanders(user.factionId),
      getAvailableTerritories(user.factionId),
    ]);
    
    if (commandersRes.success && commandersRes.data) {
      setAvailableCommanders(commandersRes.data);
    }
    if (territoriesRes.success && territoriesRes.data) {
      setAvailableTerritories(territoriesRes.data);
    }
    setIsCreateLegionDialogOpen(true);
  }

  async function handleCheckCommanderConflict(commanderId: string): Promise<{ hasConflict: boolean; conflictLegion?: Legion }> {
    const response = await checkCommanderConflict(commanderId);
    if (response.success && response.data) {
      return response.data;
    }
    return { hasConflict: false };
  }

  async function handleCreateLegionConfirm(legionData: CreateLegionData) {
    const request: CreateLegionRequest = {
      name: legionData.name,
      commanderId: legionData.commanderId,
      soldierCount: legionData.soldierCount,
      rifles: legionData.rifles,
      horses: legionData.horses,
      cannons: legionData.cannons,
      locationId: legionData.locationId,
      factionId: user.factionId,
      forceReassign: legionData.forceReassign,
    };
    
    const response = await createLegion(request);
    if (response.success) {
      setIsCreateLegionDialogOpen(false);
      await loadFactionData();
    } else {
      alert(response.error || '创建军团失败');
    }
  }

  function handleDisbandLegion(legion: Legion) {
    setSelectedLegion(legion);
    setIsDisbandLegionDialogOpen(true);
  }

  function handleEditLegionSoldiers(legion: Legion) {
    setSelectedLegion(legion);
    setIsEditSoldiersDialogOpen(true);
  }

  function handleEditLegionEquipment(legion: Legion) {
    setSelectedLegion(legion);
    setIsEditEquipmentDialogOpen(true);
  }

  async function handleDisbandLegionConfirm(legionId: string) {
    const response = await disbandLegion(legionId, user.factionId);
    if (response.success) {
      setIsDisbandLegionDialogOpen(false);
      setIsEditSoldiersDialogOpen(false);
      setSelectedLegion(null);
      await loadFactionData();
    } else {
      alert(response.error || '解散军团失败');
    }
  }

  async function handleEditSoldiersConfirm(legionId: string, newCount: number) {
    const response = await updateLegionSoldiers(legionId, newCount, user.factionId);
    if (response.success) {
      setIsEditSoldiersDialogOpen(false);
      setSelectedLegion(null);
      await loadFactionData();
    } else {
      alert(response.error || '修改人数失败');
    }
  }

  async function handleEditEquipmentConfirm(legionId: string, equipment: { rifles: number; horses: number; cannons: number }) {
    const response = await updateLegionEquipment(legionId, equipment, user.factionId);
    if (response.success) {
      setIsEditEquipmentDialogOpen(false);
      setSelectedLegion(null);
      await loadFactionData();
    } else {
      alert(response.error || '修改装备失败');
    }
  }
}

// 信息卡片组件
interface InfoCardProps {
  label: string;
  value: string;
  unit?: string;
  subValue?: string;
}

function InfoCard({ label, value, unit, subValue }: InfoCardProps) {
  return (
    <div className="info-card">
      <div className="info-label">{label}</div>
      <div className="info-value">
        {value}
        {unit && <span className="info-unit">{unit}</span>}
      </div>
      {subValue && <div className="info-sub">{subValue}</div>}
    </div>
  );
}

// 详情行组件
interface DetailRowProps {
  label: string;
  value: string;
  unit?: string;
}

function DetailRow({ label, value, unit }: DetailRowProps) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">
        {value}
        {unit && <span className="detail-unit">{unit}</span>}
      </span>
    </div>
  );
}

// 数字格式化
function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN');
}

// 石高格式化为万石（保留2位小数）
function formatKokudaka(num: number): string {
  const wanKoku = num / 10000;
  return wanKoku.toFixed(2);
}

// 税率卡片组件（可点击）
interface TaxRateCardProps {
  taxRate: number;
  canChange: boolean;
  onOpenSelector: () => void;
}

function TaxRateCard({ taxRate, canChange, onOpenSelector }: TaxRateCardProps) {
  return (
    <div className="info-card tax-rate-card" onClick={onOpenSelector}>
      <div className="info-label">税率</div>
      <div className="info-value clickable">
        {`${(taxRate * 100).toFixed(0)}%`}
        <span className="edit-icon">✎</span>
      </div>
      {!canChange && <div className="info-sub warning">本回合已更改</div>}
    </div>
  );
}

// 税率选择器组件
interface TaxRateSelectorProps {
  currentRate: number;
  availableRates: number[];
  canChange: boolean;
  onSelect: (rate: number) => void;
  onClose: () => void;
}

function TaxRateSelector({ currentRate, availableRates, canChange, onSelect, onClose }: TaxRateSelectorProps) {
  return (
    <div className="tax-rate-selector">
      <div className="selector-header">
        <span>选择税率</span>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="rate-options">
        {availableRates.map(rate => (
          <button
            key={rate}
            className={`rate-option ${rate === currentRate ? 'current' : ''}`}
            onClick={() => rate !== currentRate && canChange && onSelect(rate)}
            disabled={rate === currentRate || !canChange}
          >
            {(rate * 100).toFixed(0)}%
            {rate === currentRate && <span className="current-label">当前</span>}
          </button>
        ))}
      </div>
      <div className="selector-note">
        ⚠️ 每回合只能更改一次税率
      </div>
    </div>
  );
}

export default Dashboard;
