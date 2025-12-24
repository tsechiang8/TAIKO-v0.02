import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { getCurrentUser, getSessionId, setSessionId, login } from './api';
import { User } from './types';
import { getShareParamsFromUrl, clearShareParams } from './utils/shareUrl';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [urlLoginError, setUrlLoginError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // 首先检查URL中是否有登录代码
    const shareParams = getShareParamsFromUrl();
    
    if (shareParams.code) {
      // 尝试使用URL中的代码登录
      try {
        const result = await login(shareParams.code);
        if (result.success) {
          // 登录成功，清除URL中的代码
          clearShareParams();
          setUser({
            type: result.userType,
            factionId: result.factionId,
          });
          setLoading(false);
          return;
        } else {
          // 登录失败，显示错误
          setUrlLoginError(result.error || '链接中的登录代码无效');
          clearShareParams();
        }
      } catch {
        setUrlLoginError('链接登录失败，请手动输入代码');
        clearShareParams();
      }
    }

    // 检查现有会话
    const sessionId = getSessionId();
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await getCurrentUser();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        // 会话无效，清除
        setSessionId(null);
      }
    } catch {
      setSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    console.log('handleLoginSuccess called with:', loggedInUser); // 调试信息
    console.log('user.type:', loggedInUser.type, 'user.factionId:', loggedInUser.factionId); // 调试信息
    setUser(loggedInUser);
    setUrlLoginError(null);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAdminPanel(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} initialError={urlLoginError} />;
  }

  console.log('Rendering with user:', user); // 调试信息
  console.log('Condition check: user.type === admin:', user.type === 'admin', 'showAdminPanel:', showAdminPanel, '!user.factionId:', !user.factionId);

  // 管理员默认进入管理面板（因为没有势力数据）
  // 或者管理员手动切换到管理面板
  if (user.type === 'admin' && (showAdminPanel || !user.factionId)) {
    return (
      <AdminPanel 
        user={user} 
        onBack={() => {
          if (user.factionId) {
            setShowAdminPanel(false);
          } else {
            // 管理员没有势力，退出登录
            handleLogout();
          }
        }} 
      />
    );
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout}
      onOpenAdminPanel={user.type === 'admin' ? () => setShowAdminPanel(true) : undefined}
    />
  );
}

export default App;
