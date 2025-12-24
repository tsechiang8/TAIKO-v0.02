/**
 * 登录页面组件
 * Requirements: 1.1, 1.4, 13.2, 13.3
 */

import React, { useState, useEffect } from 'react';
import { login } from '../api';
import { User } from '../types';
import { generateBaseShareUrl, copyToClipboard } from '../utils/shareUrl';
import './Login.css';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  initialError?: string | null;
}

export function Login({ onLoginSuccess, initialError }: LoginProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  // 当initialError变化时更新error状态
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('请输入登录代码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(code.trim());

      if (result.success) {
        console.log('Login result:', result); // 调试信息
        const user: User = {
          type: result.userType,
          factionId: result.factionId,
        };
        console.log('Created user:', user); // 调试信息
        onLoginSuccess(user);
      } else {
        setError(result.error || '登录失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleCopyShareUrl = async () => {
    const url = generateBaseShareUrl();
    const success = await copyToClipboard(url);
    if (success) {
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">下克上小助手</h1>
        <p className="login-subtitle">文字游戏辅助系统</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="code" className="input-label">登录代码</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入代码"
              className={`login-input ${error ? 'input-error' : ''}`}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '确认'}
          </button>
        </form>

        <div className="login-hint">
          <p>管理员请输入管理员代码</p>
          <p>玩家请输入势力专属代码</p>
        </div>

        <div className="share-section">
          <button
            type="button"
            className="share-button"
            onClick={handleCopyShareUrl}
          >
            {shareUrlCopied ? '已复制!' : '复制分享链接'}
          </button>
          <p className="share-hint">分享此链接给其他玩家</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
