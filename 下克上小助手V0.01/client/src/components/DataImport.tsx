/**
 * 数据导入组件
 * Requirements: 10.1-10.4
 */

import { useState, useEffect } from 'react';
import {
  ImportType,
  ImportTemplateInfo,
  ImportPreviewResult,
  ImportResultData,
  getImportTemplate,
  previewImport,
  executeImport,
} from '../api';
import './DataImport.css';

interface DataImportProps {
  onImportComplete?: () => void;
}

export function DataImport({ onImportComplete }: DataImportProps) {
  const [selectedType, setSelectedType] = useState<ImportType>('territory');
  const [templateInfo, setTemplateInfo] = useState<ImportTemplateInfo | null>(null);
  const [inputText, setInputText] = useState('');
  const [overwrite, setOverwrite] = useState(true);
  const [loading, setLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载模板信息
  useEffect(() => {
    loadTemplate(selectedType);
  }, [selectedType]);

  const loadTemplate = async (type: ImportType) => {
    setLoading(true);
    setError(null);
    setPreviewResult(null);
    setImportResult(null);

    const response = await getImportTemplate(type);
    if (response.success && response.data) {
      setTemplateInfo(response.data);
    } else {
      setError(response.error || '加载模板失败');
    }
    setLoading(false);
  };

  const handleTypeChange = (type: ImportType) => {
    setSelectedType(type);
    setInputText('');
    setPreviewResult(null);
    setImportResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!inputText.trim()) {
      setError('请输入要导入的数据');
      return;
    }

    setLoading(true);
    setError(null);
    setImportResult(null);

    const response = await previewImport(selectedType, inputText);
    if (response.success && response.data) {
      setPreviewResult(response.data);
    } else {
      setError(response.error || '预览失败');
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!inputText.trim()) {
      setError('请输入要导入的数据');
      return;
    }

    setLoading(true);
    setError(null);

    const response = await executeImport(selectedType, inputText, overwrite);
    if (response.success && response.data) {
      setImportResult(response.data);
      setPreviewResult(null);
      if (response.data.imported > 0) {
        onImportComplete?.();
      }
    } else {
      setError(response.error || '导入失败');
    }
    setLoading(false);
  };

  const getTypeLabel = (type: ImportType): string => {
    switch (type) {
      case 'territory':
        return '郡国数据';
      case 'legion':
        return '军团数据';
      case 'faction':
        return '势力数据';
      case 'specialProduct':
        return '特产数据';
      default:
        return type;
    }
  };

  const renderPreviewTable = () => {
    if (!previewResult || previewResult.preview.length === 0) return null;

    const data = previewResult.preview as Record<string, unknown>[];
    const columns = Object.keys(data[0]);

    return (
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{getColumnLabel(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col}>{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getColumnLabel = (col: string): string => {
    const labels: Record<string, string> = {
      provinceName: '令制国',
      districtName: '郡名',
      castleName: '城池名称',
      castleLevel: '城池等级',
      baseKokudaka: '基础石高',
      specialProduct1: '特产1',
      specialProduct2: '特产2',
      specialProduct3: '特产3',
      developableProduct: '可发展特产',
      factionName: '势力名称',
      description: '描述',
      name: '名称',
      commanderName: '将领姓名',
      soldierCount: '士兵数量',
      rifles: '铁炮',
      horses: '战马',
      cannons: '大筒',
      locationName: '驻扎位置',
      lordName: '家主姓名',
      code: '登录代码',
      taxRate: '税率',
      treasury: '金库',
      idleSoldiers: '闲置士兵',
      agriculturePoints: '农业点数',
      commercePoints: '商业点数',
      navyPoints: '水军点数',
      armamentPoints: '武备点数',
      industryKokudaka: '产业石高',
      // 特产字段
      annualKokudaka: '年产石高',
      annualHorses: '年产战马',
      soldierCapacityBonus: '兵力加成',
      kokudakaBonus: '石高加成',
      otherEffects: '其他效果',
    };
    return labels[col] || col;
  };

  return (
    <div className="data-import">
      <h2>数据导入</h2>

      {/* 类型选择 */}
      <div className="import-type-selector">
        {(['territory', 'legion', 'faction', 'specialProduct'] as ImportType[]).map((type) => (
          <button
            key={type}
            className={`type-btn ${selectedType === type ? 'active' : ''}`}
            onClick={() => handleTypeChange(type)}
          >
            {getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* 模板信息 */}
      {templateInfo && (
        <div className="template-info">
          <h3>导入格式说明</h3>
          <p>{templateInfo.description}</p>
          <div className="template-header">
            <strong>表头：</strong>{templateInfo.template}
          </div>
        </div>
      )}

      {/* 文本输入区域 */}
      <div className="import-input-section">
        <label>粘贴Excel数据（制表符分隔）：</label>
        <textarea
          className="import-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="从Excel复制数据后粘贴到此处...&#10;&#10;提示：直接从Excel选中数据区域复制，粘贴即可。数据会以制表符分隔。"
        />
      </div>

      {/* 操作按钮 */}
      <div className="import-actions">
        <button
          className="preview-btn"
          onClick={handlePreview}
          disabled={loading || !inputText.trim()}
        >
          预览数据
        </button>
        <button
          className="import-btn"
          onClick={handleImport}
          disabled={loading || !inputText.trim()}
        >
          确认导入
        </button>
        <div className="overwrite-option">
          <input
            type="checkbox"
            id="overwrite"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          />
          <label htmlFor="overwrite">覆盖现有数据</label>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>处理中...</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="import-messages">
          <div className="error-list">
            <h4>错误</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* 预览结果 */}
      {previewResult && (
        <div className="preview-result">
          <h3>数据预览</h3>
          <div className="preview-stats">
            <span>
              解析行数：<span className="count">{previewResult.rowCount}</span>
            </span>
            {previewResult.errors.length > 0 && (
              <span style={{ color: '#c62828' }}>
                错误：<span className="count">{previewResult.errors.length}</span>
              </span>
            )}
            {previewResult.warnings.length > 0 && (
              <span style={{ color: '#f57f17' }}>
                警告：<span className="count">{previewResult.warnings.length}</span>
              </span>
            )}
          </div>

          {renderPreviewTable()}

          {previewResult.errors.length > 0 && (
            <div className="error-list" style={{ marginTop: '15px' }}>
              <h4>解析错误</h4>
              <ul>
                {previewResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {previewResult.warnings.length > 0 && (
            <div className="warning-list" style={{ marginTop: '15px' }}>
              <h4>警告</h4>
              <ul>
                {previewResult.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 导入结果 */}
      {importResult && (
        <div
          className={`import-result ${
            importResult.errors.length === 0
              ? 'success'
              : importResult.imported > 0
              ? 'partial'
              : 'error'
          }`}
        >
          <h3>
            {importResult.errors.length === 0
              ? '导入成功'
              : importResult.imported > 0
              ? '部分导入成功'
              : '导入失败'}
          </h3>
          <p>成功导入 {importResult.imported} 条数据</p>

          {importResult.errors.length > 0 && (
            <div className="error-list" style={{ marginTop: '15px', textAlign: 'left' }}>
              <h4>错误</h4>
              <ul>
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importResult.warnings.length > 0 && (
            <div className="warning-list" style={{ marginTop: '15px', textAlign: 'left' }}>
              <h4>警告</h4>
              <ul>
                {importResult.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DataImport;
