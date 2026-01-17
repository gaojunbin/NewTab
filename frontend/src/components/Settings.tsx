import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Settings as SettingsIcon, CloudSun, Search, Download, Upload, RotateCcw, Sun, Moon, Monitor, User, Clock, Link, Lock } from 'lucide-react';
import { useSettingsStore, themePresets } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { authApi, getAuthToken, getAuthHeaders } from '../services/api';

type TabType = 'appearance' | 'features' | 'backup';

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const { settings, setSettings, setThemePreset, resetSettings } = useSettingsStore();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openSettings', handleOpen);
    return () => window.removeEventListener('openSettings', handleOpen);
  }, []);

  const tabs = [
    { id: 'appearance' as TabType, label: '外观', icon: Palette },
    { id: 'features' as TabType, label: '功能', icon: SettingsIcon },
    { id: 'backup' as TabType, label: '备份', icon: Download },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ scale: 0.9, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 100 }}
            className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden backdrop-blur-[12px]"
            style={{
              background: settings.backgroundColor,
              border: `1px solid ${settings.accentColor}40`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ borderBottom: `1px solid ${settings.accentColor}20` }}>
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: settings.textColor }}>设置</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:opacity-70" style={{ color: settings.accentColor }}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex" style={{ borderBottom: `1px solid ${settings.accentColor}20` }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors"
                  style={{
                    color: activeTab === tab.id ? settings.textColor : settings.accentColor,
                    borderBottom: activeTab === tab.id ? `2px solid ${settings.accentColor}` : '2px solid transparent',
                  }}
                >
                  <tab.icon className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
              {activeTab === 'appearance' && <AppearanceSettings settings={settings} setSettings={setSettings} setThemePreset={setThemePreset} />}
              {activeTab === 'features' && <FeaturesSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'backup' && <BackupSettings settings={settings} resetSettings={resetSettings} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppearanceSettings({ settings, setSettings, setThemePreset }: { settings: any; setSettings: any; setThemePreset: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>主题模式</label>
        <div className="flex gap-2">
          {[{ id: 'light', label: '浅色', icon: Sun }, { id: 'dark', label: '深色', icon: Moon }, { id: 'auto', label: '自动', icon: Monitor }].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSettings({ theme: mode.id })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.theme === mode.id ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.theme === mode.id ? settings.backgroundColor : settings.textColor,
              }}
            >
              <mode.icon className="w-4 h-4" />{mode.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>主题预设</label>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
          {themePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setThemePreset(preset)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all hover:scale-105"
              style={{
                background: settings.backgroundColor === preset.primary ? `${settings.accentColor}30` : `${settings.accentColor}10`,
                border: settings.backgroundColor === preset.primary ? `2px solid ${settings.accentColor}` : '2px solid transparent',
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: preset.primary, border: `2px solid ${preset.accent}` }}>
                <span style={{ color: preset.text, fontSize: '10px', fontWeight: 'bold' }}>Aa</span>
              </div>
              <span className="text-xs" style={{ color: settings.textColor }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSettings({ settings, setSettings }: { settings: any; setSettings: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {[
          { key: 'showGreeting', label: '显示问候语', icon: User },
          { key: 'showClock', label: '显示时钟', icon: Clock },
          { key: 'showWeather', label: '显示天气', icon: CloudSun },
          { key: 'showSearch', label: '显示搜索框', icon: Search },
        ].map((feature) => (
          <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: `${settings.accentColor}10` }}>
            <div className="flex items-center gap-3">
              <feature.icon className="w-5 h-5" style={{ color: settings.accentColor }} />
              <span style={{ color: settings.textColor }}>{feature.label}</span>
            </div>
            <button
              onClick={() => setSettings({ [feature.key]: !settings[feature.key] })}
              className="w-12 h-6 rounded-full transition-colors"
              style={{ background: settings[feature.key] ? settings.accentColor : `${settings.accentColor}30` }}
            >
              <motion.div
                className="w-5 h-5 rounded-full shadow"
                style={{ background: settings.backgroundColor }}
                animate={{ x: settings[feature.key] ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
      {settings.showGreeting && (
        <div>
          <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>问候名称</label>
          <input
            type="text"
            value={settings.greetingName || ''}
            onChange={(e) => setSettings({ greetingName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg"
            style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40`, color: settings.textColor }}
            placeholder="输入你的名字"
          />
        </div>
      )}
      {settings.showClock && (
        <div>
          <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>时钟设置</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSettings({ clockFormat: '12h' })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockFormat === '12h' ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockFormat === '12h' ? settings.backgroundColor : settings.textColor,
              }}
            >
              12小时制
            </button>
            <button
              onClick={() => setSettings({ clockFormat: '24h' })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockFormat === '24h' ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockFormat === '24h' ? settings.backgroundColor : settings.textColor,
              }}
            >
              24小时制
            </button>
            <button
              onClick={() => setSettings({ clockShowSeconds: !settings.clockShowSeconds })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockShowSeconds ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockShowSeconds ? settings.backgroundColor : settings.textColor,
              }}
            >
              显示秒
            </button>
            <button
              onClick={() => setSettings({ showMultiTimezone: !settings.showMultiTimezone })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.showMultiTimezone ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.showMultiTimezone ? settings.backgroundColor : settings.textColor,
              }}
            >
              多时区
            </button>
          </div>
        </div>
      )}
      {settings.showWeather && (
        <div>
          <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>天气城市</label>
          <input
            type="text"
            value={settings.weatherCity}
            onChange={(e) => setSettings({ weatherCity: e.target.value })}
            className="w-full px-4 py-2 rounded-lg"
            style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40`, color: settings.textColor }}
            placeholder="输入城市"
          />
        </div>
      )}
    </div>
  );
}

function BackupSettings({ settings, resetSettings }: { settings: any; resetSettings: () => void }) {
  const { appGroups, bookmarks, fetchApps, fetchBookmarks } = useAppStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // 导出主题配置（排除 searchHistory）
  const handleExportTheme = () => {
    const data = localStorage.getItem('newtab-settings');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.state?.settings) {
        delete parsed.state.settings.searchHistory;
      }
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newtab-theme.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 导入主题配置
  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          // 保留当前的 searchHistory
          const current = localStorage.getItem('newtab-settings');
          if (current) {
            const currentParsed = JSON.parse(current);
            if (currentParsed.state?.settings?.searchHistory && data.state?.settings) {
              data.state.settings.searchHistory = currentParsed.state.settings.searchHistory;
            }
          }
          localStorage.setItem('newtab-settings', JSON.stringify(data));
          window.location.reload();
        } catch { alert('导入失败'); }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // 导出链接数据
  const handleExportLinks = () => {
    const data = {
      appGroups,
      bookmarks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newtab-links.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入链接数据（需要密码）
  const handleImportLinksClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    // 检查是否需要密码
    const required = await authApi.isPasswordRequired();
    const token = getAuthToken();

    if (required && !token) {
      setPendingFile(file);
      setShowPasswordDialog(true);
    } else {
      await importLinksData(file);
    }
  };

  const importLinksData = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.appGroups && !data.bookmarks) {
        throw new Error('无效的链接数据格式');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      // 导入 apps
      if (data.appGroups) {
        await fetch('/api/apps', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ appGroups: data.appGroups }),
        });
      }

      // 导入 bookmarks
      if (data.bookmarks) {
        await fetch('/api/links', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ bookmarks: data.bookmarks }),
        });
      }

      // 刷新数据
      await fetchApps();
      await fetchBookmarks();
      alert('链接数据导入成功');
    } catch (err) {
      alert('导入失败: ' + (err instanceof Error ? err.message : '未知错误'));
    } finally {
      setImporting(false);
      setShowPasswordDialog(false);
      setPendingFile(null);
      setPassword('');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!pendingFile) return;

    try {
      const result = await authApi.verifyPassword(password);
      if (result) {
        // 密码验证成功后，authApi.verifyPassword 会返回 token
        // 需要重新获取 token
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('newtab-auth-token', data.token);
        }
        await importLinksData(pendingFile);
      } else {
        alert('密码错误');
      }
    } catch {
      alert('验证失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 主题配置 */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2" style={{ color: settings.textColor }}>
          <Palette className="w-4 h-4" style={{ color: settings.accentColor }} />
          主题配置
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExportTheme}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors hover:opacity-80"
            style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
          >
            <Download className="w-5 h-5" />导出主题
          </button>
          <label
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
            style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
          >
            <Upload className="w-5 h-5" />导入主题
            <input type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
          </label>
        </div>
      </div>

      {/* 链接数据 */}
      <div>
        <h3 className="font-medium mb-3 flex items-center gap-2" style={{ color: settings.textColor }}>
          <Link className="w-4 h-4" style={{ color: settings.accentColor }} />
          链接数据
        </h3>
        <div className="space-y-3">
          <button
            onClick={handleExportLinks}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors hover:opacity-80"
            style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
          >
            <Download className="w-5 h-5" />导出链接
          </button>
          <label
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
            style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
          >
            <Upload className="w-5 h-5" />
            <Lock className="w-4 h-4" style={{ color: settings.accentColor }} />
            导入链接
            <input type="file" accept=".json" onChange={handleImportLinksClick} className="hidden" disabled={importing} />
          </label>
        </div>
      </div>

      {/* 重置 */}
      <div>
        <button
          onClick={() => { if (confirm('确定重置所有设置?')) { resetSettings(); window.location.reload(); }}}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
        >
          <RotateCcw className="w-5 h-5" />重置设置
        </button>
      </div>

      {/* 密码弹窗 */}
      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => { setShowPasswordDialog(false); setPendingFile(null); setPassword(''); }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: settings.backgroundColor, border: `1px solid ${settings.accentColor}40` }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: settings.textColor }}>
                <Lock className="w-5 h-5" style={{ color: settings.accentColor }} />
                需要密码验证
              </h3>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full px-4 py-2 rounded-lg mb-4"
                style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40`, color: settings.textColor }}
                placeholder="输入编辑密码"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPasswordDialog(false); setPendingFile(null); setPassword(''); }}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
                >
                  取消
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={importing}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: settings.accentColor, color: settings.backgroundColor }}
                >
                  {importing ? '导入中...' : '确认'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings;
