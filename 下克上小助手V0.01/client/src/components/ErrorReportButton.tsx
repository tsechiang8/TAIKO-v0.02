/**
 * 玩家端报错按钮组件
 * Requirements: 14.1, 14.4
 */

import { useState } from 'react';
import { submitManualErrorReport } from '../api';
import './ErrorReportButton.css';

interface ErrorReportButtonProps {
  onReportSubmitted?: () => void;
}

export function ErrorReportButton({ onReportSubmitted }: ErrorReportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await submitManualErrorReport(errorMessage || undefined);
      
      if (response.success) {
        setSubmitResult({ success: true, message: '错误报告已提交，管理员会尽快处理' });
        setErrorMessage('');
        onReportSubmitted?.();
        // 3秒后关闭对话框
        setTimeout(() => {
          setShowDialog(false);
          setSubmitResult(null);
        }, 3000);
      } else {
        setSubmitResult({ success: false, message: response.error || '提交失败' });
      }
    } catch {
      setSubmitResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    setErrorMessage('');
    setSubmitResult(null);
  };

  return (
    <>
      <button
        className="error-report-button"
        onClick={() => setShowDialog(true)}
        title="报告问题"
      >
        🐛 报错
      </button>

      {showDialog && (
        <div className="error-report-overlay" onClick={handleClose}>
          <div className="error-report-dialog" onClick={e => e.stopPropagation()}>
            <h3>报告问题</h3>
            <p className="error-report-hint">
              如果您遇到了问题，请描述一下情况。系统会自动记录您最近的操作，帮助管理员定位问题。
            </p>
            
            <textarea
              className="error-report-textarea"
              placeholder="请描述您遇到的问题（可选）"
              value={errorMessage}
              onChange={e => setErrorMessage(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />

            {submitResult && (
              <div className={`error-report-result ${submitResult.success ? 'success' : 'error'}`}>
                {submitResult.message}
              </div>
            )}

            <div className="error-report-actions">
              <button
                className="error-report-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                className="error-report-submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '提交中...' : '提交报告'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ErrorReportButton;
